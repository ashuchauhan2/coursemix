"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isReviewsDropdownOpen, setIsReviewsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Create Supabase client inside the component to ensure it's created after hydration
  const getSupabase = () => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Immediately check if user is in a protected route
  // This gives us a quick initial state before Supabase client is ready
  useEffect(() => {
    // Only apply this quick check if we're not in the middle of signing out
    if (!isSigningOut) {
      const isInProtectedRoute = pathname?.startsWith('/protected');
      if (isInProtectedRoute && !user) {
        setUser({ id: 'temp-user-id' } as User); // Temporarily assume logged in if in protected route
      }
    }
  }, [pathname, user, isSigningOut]);

  // Initialize user state
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    const initializeAuthState = async () => {
      try {
        const supabase = getSupabase();
        
        // Check current user state
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth error:", error);
          if (mounted) setUser(null);
        } else if (mounted) {
          setUser(data.user);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            // Update user state immediately when auth state changes
            setUser(session?.user ?? null);
            
            // If signing out, make sure to mark that we're no longer in the signing out state
            if (_event === 'SIGNED_OUT') {
              setIsSigningOut(false);
            } else if (_event === 'SIGNED_IN') {
              // Make sure we're definitely not in a signing out state when signing in
              setIsSigningOut(false);
            }
            
            // Force component refresh through router refresh on important events
            if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'TOKEN_REFRESHED') {
              router.refresh();
            }
          }
        });
        
        if (mounted) setIsLoading(false);
        
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Error initializing auth:", err);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };
    
    initializeAuthState();
    
    return () => {
      mounted = false;
    };
  }, [router]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const toggleReviewsDropdown = () => setIsReviewsDropdownOpen(!isReviewsDropdownOpen);

  const handleSignOut = async () => {
    try {
      // Set signing out state to prevent route-based auth detection
      setIsSigningOut(true);
      
      // First perform the actual sign-out operations
      await signOutAction();
      
      // Client-side signout
      const supabase = getSupabase();
      await supabase.auth.signOut();
      
      // Only after successful sign-out, update the UI state
      setUser(null);
      
      // Clear any cached auth state
      try {
        localStorage.removeItem('supabase.auth.token');
      } catch (e) {
        console.error('Error clearing local storage:', e);
      }
      
      // Navigate after sign-out completed
      router.push('/sign-in');
      
      // Use setTimeout to ensure navigation completes before refresh
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error('Error signing out:', error);
      // Reset signing out state if there was an error
      setIsSigningOut(false);
    }
  };

  // Get user authentication status from Supabase session
  const hasValidUser = !!user && user.id !== 'temp-user-id';
  
  // Check if we're on a protected route
  const isProtectedRoute = pathname?.startsWith('/protected');
  
  // Determine authentication status based on multiple factors
  const isAuthenticated = !isSigningOut && (hasValidUser || isProtectedRoute);

  // Non-auth routes that should always show the signed-out navbar regardless of other factors
  const forceUnauthenticatedPaths = ['/sign-in', '/sign-up', '/forgot-password'];
  const isOnAuthPage = forceUnauthenticatedPaths.includes(pathname || '');
  
  // Final auth state determination - either we have a valid session or we're on a protected route
  // but not if we're specifically on an auth page
  const showAuthenticatedUI = isAuthenticated && !isOnAuthPage;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={showAuthenticatedUI ? "/protected/dashboard" : "/"}
            className="font-bold text-xl text-gray-800 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            Course Mix
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {showAuthenticatedUI ? (
              <>
                <Link
                  href="/protected/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-4 py-1"
                >
                  Dashboard
                </Link>
                <div className="relative dropdown-container">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-4 py-1 gap-1"
                  >
                    Course Registration
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900 rounded mt-2 w-48 py-1 z-50">
                      <Link
                        href="/protected/course-registration"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Register
                      </Link>
                      <Link
                        href="/protected/my-courses"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        My Courses
                      </Link>
                    </div>
                  )}
                </div>
                <div className="relative dropdown-container">
                  <button
                    onClick={toggleReviewsDropdown}
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-4 py-1 gap-1"
                  >
                    Reviews and Discussion
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isReviewsDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isReviewsDropdownOpen && (
                    <div className="absolute bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900 rounded mt-2 w-48 py-1 z-50">
                      <Link
                        href="/protected/course-discussions"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        onClick={() => setIsReviewsDropdownOpen(false)}
                      >
                        Discussions
                      </Link>
                      <Link
                        href="/protected/course-reviews"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        onClick={() => setIsReviewsDropdownOpen(false)}
                      >
                        Reviews
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  href="/protected/academic-progress"
                  className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-4 py-1"
                >
                  Academic Progress
                </Link>
                <Link
                  href="/protected/profile"
                  className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-4 py-1"
                >
                  Profile
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors py-1 px-4"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button
                    variant="outline"
                    className="border-gray-200 dark:border-gray-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white transition-colors">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col space-y-4">
              {showAuthenticatedUI ? (
                <>
                  <Link
                    href="/protected/dashboard"
                    className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="relative dropdown-container">
                    <button
                      onClick={toggleDropdown}
                      className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-2 py-1 gap-1 w-full text-left"
                    >
                      Course Registration
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isDropdownOpen && (
                      <div className="relative bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900 rounded mt-2 w-48 py-1">
                        <Link
                          href="/protected/course-registration"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          Register
                        </Link>
                        <Link
                          href="/protected/my-courses"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          My Courses
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="relative dropdown-container">
                    <button
                      onClick={toggleReviewsDropdown}
                      className="flex items-center text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-2 py-1 gap-1 w-full text-left"
                    >
                      Reviews and Discussion
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          isReviewsDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isReviewsDropdownOpen && (
                      <div className="relative bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900 rounded mt-2 w-48 py-1">
                        <Link
                          href="/protected/course-discussions"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                          onClick={() => {
                            setIsReviewsDropdownOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          Discussions
                        </Link>
                        <Link
                          href="/protected/course-reviews"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                          onClick={() => {
                            setIsReviewsDropdownOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          Review
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    href="/protected/academic-progress"
                    className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Academic Progress
                  </Link>
                  <Link
                    href="/protected/profile"
                    className="text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 px-2 py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="flex-grow border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Sign Out
                    </Button>
                    <ThemeToggle className="flex-shrink-0 rounded-full bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-700/70" />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-gray-200 dark:border-gray-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <div className="flex items-center justify-between gap-2">
                    <Link href="/sign-up" onClick={() => setIsMenuOpen(false)} className="flex-grow">
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white transition-colors">
                        Register
                      </Button>
                    </Link>
                    <ThemeToggle className="flex-shrink-0 rounded-full bg-gray-50/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-700/70" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
