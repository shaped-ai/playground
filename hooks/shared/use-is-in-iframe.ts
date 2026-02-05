"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect if the page is running inside an iframe
 * @returns boolean indicating if the page is embedded in an iframe
 */
export function useIsInIframe(): boolean {
  const [isInIframe, setIsInIframe] = useState(false)

  useEffect(() => {
    setIsInIframe(typeof window !== "undefined" && window.self !== window.top)
  }, [])

  return isInIframe
}
