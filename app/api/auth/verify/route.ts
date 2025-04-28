import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

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

    console.log(`Verifying code: '${normalizedCode}' for email: '${normalizedEmail}'`);

    // Create admin client to bypass RLS
    const supabase = createAdminClient();

    // Log all codes for this email to see what's available
    const { data: allCodes, error: codesError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail);
    
    if (codesError) {
      console.error('Error fetching verification codes:', codesError);
    }
    
    console.log(`Found ${allCodes?.length || 0} verification codes for this email:`, 
      allCodes?.map(c => ({ code: c.code, used: c.used })));

    // Look for the specific code
    const matchingCode = allCodes?.find(c => 
      c.code.toString() === normalizedCode && c.used === false
    );

    if (!matchingCode) {
      const usedCode = allCodes?.find(c => c.code.toString() === normalizedCode && c.used === true);
      
      if (usedCode) {
        return NextResponse.json(
          { success: false, error: 'This verification code has already been used' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(matchingCode.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Mark the verification code as used
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', matchingCode.id);
      
    if (updateError) {
      console.warn('Error marking code as used:', updateError);
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email: normalizedEmail,
      verified: true
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 