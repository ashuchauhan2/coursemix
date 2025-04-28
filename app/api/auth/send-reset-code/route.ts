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

    console.log(`Processing password reset for email: ${normalizedEmail}, resendOnly: ${resendOnly}`);

    // Create admin client to bypass RLS
    const supabase = createAdminClient();

    // Check if user exists in auth.users (user needs to exist for password reset)
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    const userExists = existingUsers && existingUsers.users.some(user => user.email === normalizedEmail);
    if (!userExists) {
      console.log('User does not exist in auth.users');
      // For security reasons, still return success but don't actually send an email
      // This prevents email enumeration attacks
      return NextResponse.json({ 
        success: true, 
        message: 'If this email exists in our system, a reset code has been sent' 
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    console.log(`Generated reset code: ${code} for email: ${normalizedEmail}`);
    
    // Check if we're resending
    if (resendOnly) {
      console.log('Resending reset code');
      // Find existing password reset code
      const { data: existingCode } = await supabase
        .from('reset_codes')
        .select('*')
        .eq('email', normalizedEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!existingCode) {
        console.log('No existing reset code found for resend');
        return NextResponse.json(
          { success: false, error: 'No password reset request found for this email' },
          { status: 400 }
        );
      }

      console.log('Found existing reset code, updating it');
      // Update the existing code
      const { error: updateError } = await supabase
        .from('reset_codes')
        .update({
          code: code.toString(),
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          used: false
        })
        .eq('email', normalizedEmail);

      if (updateError) {
        console.error('Error updating reset code:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update reset code' },
          { status: 500 }
        );
      }
    } else {
      console.log('Creating new reset code');
      // Delete any existing reset codes for this email
      const { error: deleteError } = await supabase
        .from('reset_codes')
        .delete()
        .eq('email', normalizedEmail);

      if (deleteError) {
        console.warn('Error deleting old reset codes:', deleteError);
        // Continue anyway
      }

      // Store the reset code temporarily
      console.log('Inserting new reset code record...');
      const { data: insertData, error: storeError } = await supabase
        .from('reset_codes')
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
        console.error('Error storing reset code:', storeError);
        return NextResponse.json(
          { success: false, error: 'Failed to create reset code' },
          { status: 500 }
        );
      }
    }

    // Double-check that the code was stored correctly
    console.log(`Checking if code ${code} was stored for ${normalizedEmail}...`);
    const { data: verificationCheck, error: checkError } = await supabase
      .from('reset_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', code.toString());
    
    if (checkError) {
      console.error('Error checking code storage:', checkError);
    }

    console.log('Reset code stored check:', verificationCheck && verificationCheck.length > 0 ? 'Success' : 'Failed');
    if (verificationCheck) {
      console.log('Found reset code records:', verificationCheck.length);
    }

    // Send password reset email
    const emailResult = await resend.emails.send({
      from: 'Course Mix <noreply@coursemix.ca>',
      to: [normalizedEmail],
      subject: 'Reset Your Password - Course Mix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Reset Your Password</h2>
          <p>We received a request to reset your password. To continue, please enter this code:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</span>
          </div>
          <p>This code will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.</p>
          <p>Best regards,<br>The Course Mix Team</p>
        </div>
      `
    });

    console.log('Password reset email sent successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Password reset code sent successfully'
    });
  } catch (error) {
    console.error('Password reset code error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 