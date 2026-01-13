"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "@/utils/axios-interceptor"
import { getOrganizationInfo } from "@/utils/organization-info"

interface SavedQueryDetailsResponse {
  success: boolean
  data: {
    name?: string
    query?: string // YAML query string
    template?: string // Alternative field name for query
    parameters?: Array<{
      name: string
      type: "string" | "number" | "boolean"
      description?: string
      defaultValue?: any
      required?: boolean
    }>
    [key: string]: unknown
  }
}

export function useSavedQueryDetails(
  engineName?: string,
  queryName?: string
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-query-details", engineName, queryName],
    queryFn: async (): Promise<SavedQueryDetailsResponse> => {
      if (!engineName || !queryName) {
        throw new Error("Engine name and query name are required")
      }

      const organization = await getOrganizationInfo()
      const apiKey = organization?.apiKey ?? ""

      const response = await axios.get<SavedQueryDetailsResponse>(
        `/api/query/saved/query-details?engineName=${encodeURIComponent(
          engineName
        )}&queryName=${encodeURIComponent(queryName)}`,
        {
          headers: apiKey ? { "x-api-key": apiKey } : undefined,
        }
      )
      return response.data
    },
    enabled: !!engineName && !!queryName && engineName !== "" && queryName !== "",
    staleTime: 5 * 60 * 1000,
  })

  // Normalize the response - handle both 'query' and 'template' field names
  const normalizedData = data?.data
    ? {
        ...data.data,
        query: data.data.query ?? data.data.template ?? "",
      }
    : null

  return {
    data: normalizedData,
    isLoading,
    error,
  }
}

