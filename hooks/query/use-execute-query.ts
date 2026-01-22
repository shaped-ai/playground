"use client"

import { useMutation } from "@tanstack/react-query"
import axios from "@/utils/axios-interceptor"
import { getOrganizationInfo } from "@/utils/organization-info"

interface ExecuteQueryParams {
  engine: string
  query: string
  parameters?: Record<string, unknown>
}

interface ExecuteQueryResultItem {
  id: string
  score: number
  metadata: Record<string, unknown>
}

interface ExecuteQueryPayload {
  results: ExecuteQueryResultItem[]
  executionTime?: number
  rowCount?: number
  columns?: string[]
  explanation?: Record<string, unknown>
}

export interface ExecuteQueryResponse {
  success: boolean
  message: string
  data: ExecuteQueryPayload
}

export function useExecuteQuery() {
  return useMutation({
    mutationFn: async (
      params: ExecuteQueryParams
    ): Promise<ExecuteQueryResponse> => {
      try {
        const organization = await getOrganizationInfo()
        const apiKey = organization?.apiKey ?? ""
        const { data } = await axios.post<ExecuteQueryResponse>(
          "/api/query/execute",
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
        throw error || { message: "Failed to execute query" }
      }
    },
  })
}
