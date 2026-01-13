"use client"

import { useMutation } from "@tanstack/react-query"
import axios from "@/utils/axios-interceptor"
import { getOrganizationInfo } from "@/utils/organization-info"

interface ExecuteSavedQueryParams {
  engineName: string
  queryName: string
  parameters?: Record<string, unknown>
}

interface ExecuteSavedQueryResultItem {
  id: string
  score: number
  metadata: Record<string, unknown>
  [key: string]: unknown
}

interface ExecuteSavedQueryPayload {
  results: ExecuteSavedQueryResultItem[]
  executionTime?: number
  rowCount?: number
  columns?: string[]
}

interface ExecuteSavedQueryResponse {
  success: boolean
  message: string
  data: ExecuteSavedQueryPayload
}

export function useExecuteSavedQuery() {
  return useMutation({
    mutationFn: async (
      params: ExecuteSavedQueryParams
    ): Promise<ExecuteSavedQueryResponse> => {
      try {
        const organization = await getOrganizationInfo()
        const apiKey = organization?.apiKey ?? ""
        const { data } = await axios.post<ExecuteSavedQueryResponse>(
          "/api/query/saved/execute",
          params,
          {
            headers: apiKey ? { "x-api-key": apiKey } : undefined,
          }
        )
        return data
      } catch (error: any) {
        // Return the full error response if available
        if (error?.response?.data) {
          // Throw the full error response object
          throw error.response.data
        }
        // If no response data, throw the error itself or create a formatted error
        throw error || { message: "Failed to execute saved query" }
      }
    },
  })
}

