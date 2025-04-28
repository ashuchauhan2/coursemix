"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// An event system to communicate between components
const navigationEvents = {
  listeners: new Set<(isLoading: boolean) => void>(),
  
  subscribe(callback: (isLoading: boolean) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  },
  
  emit(isLoading: boolean) {
    this.listeners.forEach(callback => callback(isLoading));
  }
};

// Export for external use
export { navigationEvents };

// Inner component that uses hooks that need Suspense
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prevPathname, setPrevPathname] = useState("");
  const isInitialLoad = useRef(true);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for external navigation events
  useEffect(() => {
    return navigationEvents.subscribe((loading) => {
      if (loading && !isLoading) {
        // Start progress animation
        setIsLoading(true);
        setProgress(20);
        
        startProgressAnimation();
      } else if (!loading && isLoading) {
        // Complete progress animation
        finishProgressAnimation();
      }
    });
  }, [isLoading]);
  
  // Function to start the progress animation
  const startProgressAnimation = () => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Rapid progress during initial transition
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev < 85) {
          // Gradually slow down as we approach 85%
          const increment = Math.max(1, 10 - Math.floor(prev / 10));
          return prev + increment;
        }
        return prev;
      });
    }, 35);
  };
  
  // Function to finish the progress animation
  const finishProgressAnimation = () => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Quick finish to 100%
    setProgress(100);
    
    // Hide after completion animation finishes
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 200);
  };
  
  // Reset and trigger loading on route change - fallback for programmatic navigation
  useEffect(() => {
    // Skip the very first load to avoid showing progress bar on initial page load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      setPrevPathname(pathname);
      return;
    }
    
    // Skip if the pathname is '/transition' as we handle that separately
    if (pathname === '/transition' || prevPathname === '/transition') {
      setPrevPathname(pathname);
      return;
    }
    
    // Only trigger on actual route changes, not on initial load
    if (prevPathname && prevPathname !== pathname && !isLoading) {
      setIsLoading(true);
      setProgress(20);
      
      startProgressAnimation();
      
      // Complete the animation after a delay
      const completeTimer = setTimeout(() => {
        finishProgressAnimation();
      }, 450);
      
      return () => {
        clearTimeout(completeTimer);
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
    }
    
    // Update previous pathname for comparison
    setPrevPathname(pathname);
  }, [pathname, searchParams, prevPathname, isLoading]);
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);
  
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div 
          className="fixed top-0 left-0 right-0 z-[101] h-1.5 bg-gray-100 dark:bg-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="h-full bg-teal-600 dark:bg-teal-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ 
              duration: 0.08,
              ease: "easeOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export the component wrapped in Suspense
export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
} 