"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

// Inner component that uses hooks that need Suspense
function LoadingIndicatorInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  // Listen for route changes
  useEffect(() => {
    const handleRouteChangeStart = () => setIsLoading(true);
    const handleRouteChangeComplete = () => setIsLoading(false);

    // Set up route change listeners
    window.addEventListener("beforeunload", handleRouteChangeStart);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener("beforeunload", handleRouteChangeStart);
    };
  }, []);
  
  // Reset loading state when pathname or search params change
  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100 dark:bg-gray-800">
      <motion.div
        className="h-full bg-teal-600 dark:bg-teal-500"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </div>
  );
}

// Export the component wrapped in Suspense
export default function LoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <LoadingIndicatorInner />
    </Suspense>
  );
} 