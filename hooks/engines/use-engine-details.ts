"use client"

import { useQuery } from "@tanstack/react-query"
import { ModelStatus } from "@/types/enums"

interface EngineDetailsOptions {
  isDemoModel?: boolean
}

// Hardcoded engine details matching the engines in DEMO_ENGINES
// Keys should match the engine IDs from DEMO_ENGINES
const HARDCODED_ENGINE_DETAILS: Record<string, any> = {
  "movielens_demo_v2": {
    model_name: "Movielens Dataset",
    status: ModelStatus.ACTIVE,
    created_at: "2025-12-15 10:30:00 UTC",
    last_updated: "2025-12-15 10:30:00 UTC",
    model_uri: "movielens_demo_v2",
    model_schema: {
      interaction: [],
      user: [],
      item: [],
    },
    trained_at: "2025-12-15 10:30:00 UTC",
    config: {
      connectors: [],
      fetch: "",
      model: {
        pagination_store_ttl: 3600,
        train_schedule: "",
        text_index: false,
        vector_index: false,
        schema_override: {},
        slate_size: 0,
      },
    },
    hyperparameters: {},
  },
  "hackernews_for_you_v2": {
    model_name: "hackernews_for_you_v2",
    status: ModelStatus.ACTIVE,
    created_at: "2024-01-10 14:20:00 UTC",
    last_updated: "2024-01-10 14:20:00 UTC",
    model_uri: "hackernews_for_you_v2",
    model_schema: {
      interaction: [],
      user: [],
      item: [],
    },
    trained_at: "2024-01-10 14:20:00 UTC",
    config: {
      connectors: [],
      fetch: "",
      model: {
        pagination_store_ttl: 3600,
        train_schedule: "",
        text_index: false,
        vector_index: false,
        schema_override: {},
        slate_size: 0,
      },
    },
    hyperparameters: {},
  },
  "amazon_games_v2_dipro": {
    model_name: "Amazon Games",
    status: ModelStatus.ACTIVE,
    created_at: "2025-12-20 09:15:00 UTC",
    last_updated: "2025-12-20 09:15:00 UTC",
    model_uri: "amazon_games_v2_dipro",
    model_schema: {
      interaction: [],
      user: [],
      item: [],
    },
    trained_at: "2025-12-20 09:15:00 UTC",
    config: {
      connectors: [],
      fetch: "",
      model: {
        pagination_store_ttl: 3600,
        train_schedule: "",
        text_index: false,
        vector_index: false,
        schema_override: {},
        slate_size: 0,
      },
    },
    hyperparameters: {},
  },
}

export function useEngineDetails(
  engineName?: string,
  { isDemoModel = false }: EngineDetailsOptions = {}
) {
  const query = useQuery({
    queryKey: ["engine-details", engineName],
    queryFn: async () => {
      // Return hardcoded engine details if engine name matches
      if (engineName && HARDCODED_ENGINE_DETAILS[engineName]) {
        return HARDCODED_ENGINE_DETAILS[engineName]
      }

      // Return null if engine not found in hardcoded list
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

