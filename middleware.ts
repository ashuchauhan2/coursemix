import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  try {
    // Use the existing updateSession to handle authentication
    const response = await updateSession(request);
    
    // Only run profile check for protected routes, except profile-setup
    if (
      request.nextUrl.pathname.startsWith('/protected') && 
      !request.nextUrl.pathname.startsWith('/protected/profile-setup')
    ) {
      try {
        // Create Supabase client to check profile
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return request.cookies.get(name)?.value;
              },
              set() {}, // No need to set cookies here
              remove() {}, // No need to remove cookies here
            },
          }
        );
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user in middleware:', userError);
          return NextResponse.redirect(new URL('/sign-in', request.url));
        }
        
        if (user) {
          // Check if user profile exists and is set up
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_profile_setup')
            .eq('user_id', user.id)
            .single();
    
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching user profile:', profileError);
          }
          
          // If no profile or setup not complete, redirect to profile setup
          if (!userProfile || !userProfile.is_profile_setup) {
            return NextResponse.redirect(new URL('/protected/profile-setup', request.url));
          }
        }
      } catch (error) {
        console.error('Error in middleware profile check:', error);
        // On error, redirect to sign-in for safety
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('Critical middleware error:', error);
    // Fallback response to prevent complete failure
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

// Configure the middleware to match all paths except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
