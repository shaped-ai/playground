'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'always',
    capture_pageview: false, // Disable automatic capture. Capture manually in Next.js
    capture_pageleave: true // Enable pageleave capture
  })
}

/* 
This component is used to capture client side page views. It's used in conjunction with
the PostHogPageView.tsx element. https://posthog.com/docs/libraries/next-js
*/
export function PHProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
