import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import crypto from 'crypto';

// Generate a secure token for reset authorization
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.toString().trim();

    console.log(`Verifying reset code: '${normalizedCode}' for email: '${normalizedEmail}'`);

    // Create admin client to bypass RLS
    const supabase = createAdminClient();

    // Check if user exists in auth.users 
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    const userExists = existingUsers && existingUsers.users.some(user => user.email === normalizedEmail);
    if (!userExists) {
      console.log('User does not exist in auth.users');
      return NextResponse.json(
        { success: false, error: 'No account found with this email address' },
        { status: 400 }
      );
    }

    // Log all codes for this email to see what's available
    const { data: allCodes, error: codesError } = await supabase
      .from('reset_codes')
      .select('*')
      .eq('email', normalizedEmail);
    
    if (codesError) {
      console.error('Error fetching reset codes:', codesError);
    }
    
    console.log(`Found ${allCodes?.length || 0} reset codes for this email:`, 
      allCodes?.map(c => ({ code: c.code, used: c.used })));

    // Look for the specific code
    const matchingCode = allCodes?.find(c => 
      c.code.toString() === normalizedCode && c.used === false
    );

    if (!matchingCode) {
      const usedCode = allCodes?.find(c => c.code.toString() === normalizedCode && c.used === true);
      
      if (usedCode) {
        return NextResponse.json(
          { success: false, error: 'This reset code has already been used' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid reset code' },
        { status: 400 }
      );
    }

    // Check expiration
    const now = new Date();
    const expirationDate = new Date(matchingCode.expires_at);
    
    if (expirationDate < now) {
      return NextResponse.json(
        { success: false, error: 'This reset code has expired' },
        { status: 400 }
      );
    }

    // Generate a token that we'll use for the password reset
    // This is just used as a one-time token in the URL and not stored in the database
    const resetToken = generateResetToken();

    // Mark code as used - but not entirely used yet - we'll use this same record for the actual reset
    // We're not marking it as fully used yet because we want to use it to verify the reset request
    // in the final step
    const { error: updateError } = await supabase
      .from('reset_codes')
      .update({ 
        // Add a token field to the record that we'll verify in the reset-password endpoint
        token: resetToken,
        // Don't mark as used yet - we'll do that in the reset-password endpoint
      })
      .eq('id', matchingCode.id);
    
    if (updateError) {
      console.error('Error updating code record:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to process verification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Verification successful',
      email: normalizedEmail,
      token: resetToken
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 