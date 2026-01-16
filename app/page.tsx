"use client"

import { Suspense } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { QueryPageContent } from "@/components/modules/query/query-page-content"

const queryClient = new QueryClient()

function QueryPageContentFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
}

export default function QueryPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<QueryPageContentFallback />}>
        <QueryPageContent />
      </Suspense>
    </QueryClientProvider>
  )
}
