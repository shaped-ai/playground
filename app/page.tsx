"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { QueryPageContent } from "@/components/modules/query/query-page-content"

const queryClient = new QueryClient()

export default function QueryPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryPageContent />
    </QueryClientProvider>
  )
}
