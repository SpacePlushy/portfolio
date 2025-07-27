"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReset() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Remove hash from URL without triggering navigation
    if (window.location.hash) {
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', newUrl);
    }
    
    // Scroll to top on page load/refresh
    window.scrollTo(0, 0);
    
    // Prevent hash changes from updating the URL
    const handleHashChange = (e: HashChangeEvent) => {
      e.preventDefault();
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', newUrl);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [pathname]);

  return null;
}