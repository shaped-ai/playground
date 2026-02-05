"use client"

import { Suspense } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { QueryPageContent } from "@/components/modules/query/query-page-content"
import { ThemeProvider } from "next-themes"

const queryClient = new QueryClient()

function QueryPageContentFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}

export function QueryPageClient({
  themeOverride,
}: {
  themeOverride?: "light" | "dark"
}) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      defaultTheme={themeOverride ?? "light"}
      forcedTheme={themeOverride}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<QueryPageContentFallback />}>
          <QueryPageContent />
        </Suspense>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
