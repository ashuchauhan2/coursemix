"use client";

import { ReactNode, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { navigationEvents } from "@/components/navigation-transitions/NavigationProgress";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [displayChildren, setDisplayChildren] = useState<ReactNode>(children);
  const [transitionKey, setTransitionKey] = useState(pathname || "");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isForceTransitioning, setIsForceTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<'none' | 'start' | 'swap' | 'end'>('none');
  const prevPathRef = useRef(pathname);
  const skipNextTransitionRef = useRef(false);
  const isInitialRenderRef = useRef(true);
  const prefetchStatusRef = useRef<{[key: string]: boolean}>({});
  const minTransitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // This effect handles the special case when we're returning from the transition page
  useEffect(() => {
    // If we're returning from a transition page, skip animation
    if (skipNextTransitionRef.current && pathname !== '/transition') {
      skipNextTransitionRef.current = false;
      setDisplayChildren(children);
      setTransitionKey(pathname || "");
      prevPathRef.current = pathname;
    }
  }, [pathname, children]);

  // Add/remove custom cursor class on body
  useEffect(() => {
    if (isTransitioning || isForceTransitioning) {
      document.body.classList.add('loading-cursor');
    } else {
      document.body.classList.remove('loading-cursor');
    }
    
    return () => {
      document.body.classList.remove('loading-cursor');
    };
  }, [isTransitioning, isForceTransitioning]);

  // Notify NavigationProgress about transition state changes
  useEffect(() => {
    // Emit loading state changes to the navigation progress component
    navigationEvents.emit(isTransitioning || isForceTransitioning);
  }, [isTransitioning, isForceTransitioning]);

  // Handle page prefetching
  const prefetchPage = useCallback(async (href: string): Promise<boolean> => {
    if (prefetchStatusRef.current[href]) {
      return true; // Already prefetched
    }

    try {
      // Start prefetching
      await router.prefetch(href);
      
      // Mark as prefetched and return success
      prefetchStatusRef.current[href] = true;
      return true;
    } catch (error) {
      console.error(`Failed to prefetch ${href}:`, error);
      return false;
    }
  }, [router]);

  // Navigate to the target page when both conditions are met:
  // 1. Minimum transition time has passed
  // 2. Page has been prefetched successfully
  const completeNavigation = useCallback((href: string) => {
    let minTimeElapsed = false;
    let prefetchComplete = false;
    
    // Set minimum transition time
    minTransitionTimerRef.current = setTimeout(() => {
      minTimeElapsed = true;
      
      // If prefetch is already complete, navigate now
      if (prefetchComplete) {
        finishTransition();
      }
    }, 450);
    
    // Check prefetch status repeatedly
    navigateCheckIntervalRef.current = setInterval(async () => {
      if (!prefetchComplete) {
        // Check if prefetch is done or try again
        if (prefetchStatusRef.current[href]) {
          prefetchComplete = true;
        } else {
          prefetchComplete = await prefetchPage(href);
        }
        
        // If both conditions met, navigate
        if (minTimeElapsed && prefetchComplete) {
          finishTransition();
        }
      }
    }, 50);
    
    // Function to finish transition and navigate
    function finishTransition() {
      // Clear timers
      if (minTransitionTimerRef.current) {
        clearTimeout(minTransitionTimerRef.current);
        minTransitionTimerRef.current = null;
      }
      if (navigateCheckIntervalRef.current) {
        clearInterval(navigateCheckIntervalRef.current);
        navigateCheckIntervalRef.current = null;
      }
      
      // End transition state
      setIsForceTransitioning(false);
      
      // Set the flag to skip transition on the target page when we return
      skipNextTransitionRef.current = true;
      
      // Navigate to the target page
      router.push(href);
    }
  }, [router, prefetchPage]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (minTransitionTimerRef.current) {
        clearTimeout(minTransitionTimerRef.current);
      }
      if (navigateCheckIntervalRef.current) {
        clearInterval(navigateCheckIntervalRef.current);
      }
    };
  }, []);

  // Intercept navigation clicks
  useEffect(() => {
    if (!isClient) return;

    // This function will be called for each link click
    const handleLinkClick = (e: MouseEvent) => {
      // Only process if we're not currently transitioning
      if (isTransitioning || isForceTransitioning) return;
      
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (!link) return;
      
      const href = link.getAttribute('href');
      
      // Skip if it's an external link, anchor link, or the current page
      if (!href || 
          href.startsWith('http') || 
          href.startsWith('#') || 
          href === pathname || 
          href === '/transition') {
        return;
      }
      
      // Skip if it has a target attribute
      if (link.getAttribute('target')) return;
      
      // Prevent default navigation
      e.preventDefault();
      
      // Start the forced transition
      setIsForceTransitioning(true);
      setTargetPath(href);

      // Start prefetching and navigate when conditions are met
      prefetchPage(href);
      completeNavigation(href);
    };
    
    // Add global click event listener
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, [isClient, pathname, router, prefetchPage, completeNavigation, isTransitioning, isForceTransitioning]);

  // Handle transitions between pages - this is the fallback for programmatic navigation
  useEffect(() => {
    if (!isClient) return;
    
    // Skip initial render and when we're force transitioning
    if (prevPathRef.current === pathname || isForceTransitioning || isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
      return;
    }

    // Skip if navigating to/from transition page
    if (pathname === '/transition' || prevPathRef.current === '/transition') {
      prevPathRef.current = pathname;
      return;
    }

    // Skip transition for auth-related paths to prevent state conflicts
    const authPaths = ['/sign-in', '/sign-up', '/sign-out', '/forgot-password'];
    if (authPaths.includes(pathname || '') || authPaths.includes(prevPathRef.current || '')) {
      setDisplayChildren(children);
      setTransitionKey(pathname || "");
      prevPathRef.current = pathname;
      return;
    }

    // Phase 1: Start transition - capture old content and show overlay
    setTransitionPhase('start');
    setIsTransitioning(true);
    
    // Phase 2: After overlay is visible, swap content (invisible to user)
    const swapTimer = setTimeout(() => {
      setTransitionPhase('swap');
      setDisplayChildren(children);
      setTransitionKey(pathname || "");
      
      // Phase 3: Begin removing overlay and showing new content
      const endTimer = setTimeout(() => {
        setTransitionPhase('end');
        
        // Phase 4: Complete transition
        const completeTimer = setTimeout(() => {
          setIsTransitioning(false);
          setTransitionPhase('none');
        }, 250); // Reduced from 350ms
        
        return () => clearTimeout(completeTimer);
      }, 200); // Reduced from 300ms
      
      return () => clearTimeout(endTimer);
    }, 180); // Reduced from 250ms
    
    // Store current path as previous for next transition
    prevPathRef.current = pathname;
    
    return () => clearTimeout(swapTimer);
  }, [pathname, children, isClient, isForceTransitioning]);

  // During SSR or before hydration, render without animation
  if (!isClient) {
    return <>{children}</>;
  }

  // Determine direction of transition based on path
  const getTransitionDirection = () => {
    const currentPathParts = pathname?.split('/') || [];
    const prevPathParts = prevPathRef.current?.split('/') || [];
    
    // Going deeper into the app
    if (currentPathParts.length > prevPathParts.length) {
      return { y: 25 };
    }
    // Going up in the app
    else if (currentPathParts.length < prevPathParts.length) {
      return { y: -25 };
    }
    // Same level, use x-axis transition
    return { x: -15 };
  };

  const direction = getTransitionDirection();

  return (
    <div className="flex-grow w-full relative">
      {/* Current page content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={transitionKey}
          initial={{ opacity: 0, ...direction }}
          animate={{ 
            opacity: isForceTransitioning ? 0 : 1, 
            x: 0, 
            y: 0 
          }}
          transition={{ 
            duration: 0.35,
            delay: transitionPhase === 'end' ? 0.05 : 0.25,
            ease: "easeOut" 
          }}
          className="w-full"
        >
          {!isForceTransitioning && displayChildren}
        </motion.div>
      </AnimatePresence>

      {/* Full-screen transition overlay */}
      <AnimatePresence>
        {(isTransitioning || isForceTransitioning) && (
          <motion.div
            className="fixed inset-0 bg-white dark:bg-gray-900 z-[100] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: transitionPhase === 'end' ? 0 : 0.98 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: transitionPhase === 'start' ? 0.2 : 0.3,
              ease: "easeInOut" 
            }}
          >
            <motion.div 
              className="w-12 h-12 rounded-full border-t-2 border-r-2 border-teal-600 dark:border-teal-500"
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 