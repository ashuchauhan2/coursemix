"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Create the component that uses the useSearchParams hook
function ScrollManagerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef(pathname);
  
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    
    // Start scrolling right when transition overlay appears
    // This ensures we're already at the top when new content appears
    window.scrollTo({
      top: 0,
      behavior: "auto" // Use instant scroll during the white overlay
    });
    
    // Update previous path
    prevPathRef.current = pathname;
    
    // Focus on main content for accessibility after transition completes
    const focusTimer = setTimeout(() => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.focus();
      }
    }, 500); // Align with end of transition
    
    return () => clearTimeout(focusTimer);
  }, [pathname, searchParams]);
  
  return null; // This is a utility component with no UI
}

// Export the component wrapped in Suspense
export default function ScrollManager() {
  return (
    <Suspense fallback={null}>
      <ScrollManagerInner />
    </Suspense>
  );
} 