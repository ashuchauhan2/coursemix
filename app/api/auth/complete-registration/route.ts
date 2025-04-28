import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedEmail = email.trim().toLowerCase();

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Create admin client to bypass RLS
    const supabase = createAdminClient();

    // Check if this email was verified
    const { data: verificationCodes } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!verificationCodes || verificationCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You must verify your email before completing registration' },
        { status: 400 }
      );
    }

    console.log('Creating user account for verified email:', normalizedEmail);
    
    // Create the user account in Supabase Auth
    const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true // Email is already verified by the code
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return NextResponse.json(
        { success: false, error: createUserError.message },
        { status: 500 }
      );
    }

    // Create an entry in the profiles table if it exists
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: normalizedEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.warn('Error creating profile:', profileError);
        // Don't fail the whole process if profile creation fails
      }
    } catch (profileErr) {
      console.warn('Error creating profile entry:', profileErr);
      // Continue even if profile creation fails
    }

    // Return success with auth user id
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId: authUser.user.id
    });
  } catch (error) {
    console.error('Registration completion error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 