"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { navigationEvents } from "@/components/navigation-transitions/NavigationProgress";

// Track already prefetched pages across the application
const prefetchedPaths = new Set<string>();

export default function LinkPreloader() {
  const router = useRouter();
  const currentPath = usePathname();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Create a mutation observer to watch for new links
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          setupLinkPreloading();
        }
      }
    });

    // Start observing the document body for changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Initial setup for links already on the page
    setupLinkPreloading();
    
    // Only preload common paths on initial page load
    if (isInitialLoad.current) {
      preloadCommonPaths();
      isInitialLoad.current = false;
    }

    // Cleanup observer on unmount
    return () => observer.disconnect();
  }, [currentPath]);

  // Helper function to safely prefetch a page
  const safePrefetch = async (path: string) => {
    // Skip if already prefetched
    if (prefetchedPaths.has(path)) return;
    
    try {
      // Add to set immediately to prevent duplicate prefetches
      prefetchedPaths.add(path);
      await router.prefetch(path);
    } catch (error) {
      console.error(`Failed to prefetch ${path}:`, error);
      // Remove from the set if prefetch failed so we can try again later
      prefetchedPaths.delete(path);
    }
  };

  // Preload commonly accessed pages
  const preloadCommonPaths = () => {
    const commonPaths = [
      '/protected/dashboard',
      '/protected/course-registration',
      '/protected/my-courses',
      '/protected/grades',
      '/protected/course-reviews',
      '/protected/profile',
      '/',
      '/sign-in',
      '/sign-up'
    ];
    
    // Filter out the current path and prefetch others with minimal delay
    commonPaths
      .filter(path => path !== currentPath)
      .forEach((path, index) => {
        // Stagger prefetching to avoid network congestion, but make it faster
        setTimeout(() => {
          safePrefetch(path);
        }, index * 75);
      });
  };

  // Setup preloading behavior for all internal links
  const setupLinkPreloading = () => {
    const links = document.querySelectorAll('a[href^="/"]:not([data-preload-setup])');
    
    links.forEach(link => {
      // Mark as processed
      link.setAttribute('data-preload-setup', 'true');
      
      // Get the href
      const href = link.getAttribute('href');
      if (!href || href === currentPath) return;
      
      // Don't preload external links or anchor links
      if (href.startsWith('http') || href.startsWith('#')) return;
      
      // Aggressively prefetch immediately for important navigation elements
      if (
        link.closest('nav') || 
        link.closest('header') || 
        link.classList.contains('main-nav') ||
        link.getAttribute('role') === 'navigation'
      ) {
        setTimeout(() => {
          safePrefetch(href);
        }, 50);
      }
      
      // Preload on mouseenter with immediate navigation progress indicator
      link.addEventListener('mouseenter', () => {
        safePrefetch(href);
      });
      
      // Also preload on touchstart for mobile devices
      link.addEventListener('touchstart', () => {
        safePrefetch(href);
      });
    });
  };

  return null; // No UI, just functionality
} 