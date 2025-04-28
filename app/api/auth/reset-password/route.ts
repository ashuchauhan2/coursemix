import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, token, and password are required' },
        { status: 400 }
      );
    }

    // Normalize input
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.trim();

    // Validation
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    console.log(`Processing password reset for email: ${normalizedEmail}`);

    // Create admin client to bypass RLS
    const supabase = createAdminClient();

    // Check if user exists in auth.users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    const user = existingUsers?.users.find(user => user.email === normalizedEmail);
    if (!user) {
      console.log('User does not exist in auth.users');
      return NextResponse.json(
        { success: false, error: 'No account found with this email address' },
        { status: 400 }
      );
    }

    // Verify the reset token against the reset_codes table
    const { data: resetCode, error: resetCodeError } = await supabase
      .from('reset_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('token', normalizedToken)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (resetCodeError || !resetCode) {
      console.error('Invalid or expired reset token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check token expiration
    const now = new Date();
    const expirationDate = new Date(resetCode.expires_at);
    
    if (expirationDate < now) {
      return NextResponse.json(
        { success: false, error: 'This reset code has expired' },
        { status: 400 }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('reset_codes')
      .update({ used: true })
      .eq('id', resetCode.id);
    
    if (updateError) {
      console.error('Error marking code as used:', updateError);
    }

    // Update the user's password
    const { error: passwordUpdateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (passwordUpdateError) {
      console.error('Error updating password:', passwordUpdateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log('Password updated successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 