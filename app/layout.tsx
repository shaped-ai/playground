import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { PHProvider } from "@/components/providers/posthog-provider"
import { AnalyticsProvider } from "@/components/providers/analytics-provider"
import { SessionProvider } from "@/components/providers/session-provider"
import PostHogPageView from "./PostHogPageView"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ShapedQL Playground",
  description: "Test and explore the Shaped query language with real data",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PHProvider>
          <AnalyticsProvider>
            <SessionProvider>
              <Suspense fallback={null}>
                <PostHogPageView />
              </Suspense>
              {children}
            </SessionProvider>
          </AnalyticsProvider>
        </PHProvider>
      </body>
    </html>
  )
}
