"use client"

import { useQuery } from "@tanstack/react-query"
import { DEMO_ENGINES } from "@/lib/constants"

interface EngineDetailsOptions {
  isDemoModel?: boolean
}

export function useEngineDetails(
  engineName?: string,
  { isDemoModel = false }: EngineDetailsOptions = {}
) {
  const query = useQuery({
    queryKey: ["engine-details", engineName],
    queryFn: async () => {
      // Find engine in DEMO_ENGINES by id (which is now a unique demo identifier)
      if (engineName) {
        const engine = DEMO_ENGINES.find((e) => e.id === engineName)
        if (engine && engine.details) {
          return engine.details
        }
      }

      // Return null if engine not found
      return null
    },
    enabled: Boolean(engineName),
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}
