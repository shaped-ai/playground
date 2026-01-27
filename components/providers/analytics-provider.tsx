"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { usePostHog } from "posthog-js/react"

// Analytics context for PostHog tracking
// Set these in environment variables:
// - NEXT_PUBLIC_POSTHOG_KEY: Your PostHog project API key
// - NEXT_PUBLIC_POSTHOG_HOST: PostHog host (defaults to https://us.i.posthog.com)

interface AnalyticsContextType {
  trackEvent: (event: string, properties?: Record<string, any>) => void
  identify: (userId: string, properties?: Record<string, any>) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    // Return no-op functions if not within provider
    return {
      trackEvent: (event: string, properties?: Record<string, any>) => {
        console.log("[Analytics] Event (no provider):", event, properties)
      },
      identify: (userId: string, properties?: Record<string, any>) => {
        console.log("[Analytics] Identify (no provider):", userId, properties)
      },
    }
  }
  return context
}

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const posthog = usePostHog()

  const trackEvent = (event: string, properties?: Record<string, any>) => {
    // Track in PostHog
    if (typeof window !== "undefined" && posthog) {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
      })
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Event:", event, properties)
    }
  }

  const identify = (userId: string, properties?: Record<string, any>) => {
    // Identify in PostHog
    if (typeof window !== "undefined" && posthog) {
      posthog.identify(userId, properties)
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] Identify:", userId, properties)
    }
  }

  return <AnalyticsContext.Provider value={{ trackEvent, identify }}>{children}</AnalyticsContext.Provider>
}
