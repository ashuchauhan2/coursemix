import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/server';

// Check if RESEND_API_KEY exists, if not use a mock implementation in development
const resendApiKey = process.env.RESEND_API_KEY || (process.env.NODE_ENV === 'development' ? 'mock_key_for_dev' : undefined);
const resend = resendApiKey ? new Resend(resendApiKey) : {
  emails: {
    send: async () => {
      console.log('Using mock email service for development');
      return { id: 'mock-email-id', data: null };
    }
  }
};

// Generate a random 6-digit code
function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, resendOnly } = await req.json();

    // Normalize email
    const normalizedEmail = email ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`Processing verification for email: ${normalizedEmail}, resendOnly: ${resendOnly}`);

    // Create admin client to bypass RLS
    const supabase = createAdminClient();

    // Check if user already exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    if (existingUsers && existingUsers.users.some(user => user.email === normalizedEmail)) {
      console.log('User already exists in auth.users');
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    console.log(`Generated verification code: ${code} for email: ${normalizedEmail}`);
    
    // Check if we're resending
    if (resendOnly) {
      console.log('Resending verification code');
      // Find existing verification code
      const { data: existingCode } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!existingCode) {
        console.log('No existing verification found for resend');
        return NextResponse.json(
          { success: false, error: 'No verification request found for this email' },
          { status: 400 }
        );
      }

      console.log('Found existing verification code, updating it');
      // Update the existing code
      const { error: updateError } = await supabase
        .from('verification_codes')
        .update({
          code: code.toString(),
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          used: false
        })
        .eq('email', normalizedEmail);

      if (updateError) {
        console.error('Error updating verification code:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update verification code' },
          { status: 500 }
        );
      }
    } else {
      console.log('Creating new verification code');
      // Delete any existing verification codes for this email
      const { error: deleteError } = await supabase
        .from('verification_codes')
        .delete()
        .eq('email', normalizedEmail);

      if (deleteError) {
        console.warn('Error deleting old verification codes:', deleteError);
        // Continue anyway
      }

      // Store the verification code temporarily
      console.log('Inserting new verification code record...');
      const { data: insertData, error: storeError } = await supabase
        .from('verification_codes')
        .insert([
          {
            email: normalizedEmail,
            code: code.toString(),
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            used: false
          }
        ])
        .select();

      console.log('Insert result:', insertData);

      if (storeError) {
        console.error('Error storing verification code:', storeError);
        return NextResponse.json(
          { success: false, error: 'Failed to create verification code' },
          { status: 500 }
        );
      }
    }

    // Double-check that the code was stored correctly
    console.log(`Checking if code ${code} was stored for ${normalizedEmail}...`);
    const { data: verificationCheck, error: checkError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', code.toString());
    
    if (checkError) {
      console.error('Error checking code storage:', checkError);
    }

    console.log('Verification code stored check:', verificationCheck && verificationCheck.length > 0 ? 'Success' : 'Failed');
    if (verificationCheck) {
      console.log('Found verification records:', verificationCheck.length);
    }

    // Send verification email
    const emailResult = await resend.emails.send({
      from: 'Course Mix <noreply@coursemix.ca>',
      to: [normalizedEmail],
      subject: 'Verify Your Email - Course Mix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Welcome to Course Mix!</h2>
          <p>Thank you for registering. To verify your email address, please enter this code:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</span>
          </div>
          <p>This code will expire in 1 hour. If you don't verify your email within this time, you'll need to register again.</p>
          <p>Best regards,<br>The Course Mix Team</p>
        </div>
      `
    });

    console.log('Verification email sent successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Verification code error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 