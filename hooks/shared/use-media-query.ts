"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect if a media query matches
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event listener
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  return matches
}

/**
 * Hook to detect if screen is mobile (< 768px)
 * Uses Tailwind's md breakpoint
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)")
}

/**
 * Hook to detect if screen is desktop (>= 768px)
 * Uses Tailwind's md breakpoint
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)")
}
