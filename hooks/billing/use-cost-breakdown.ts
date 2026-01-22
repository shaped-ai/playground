"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "@/utils/axios-interceptor"

export interface UsageDimension {
  units: number
  cost: number
}

export interface CostDimension {
  cost: number
}

export interface CostBreakdownResponse {
  coldStorage: UsageDimension
  warmStorage: UsageDimension
  computeTime: UsageDimension
  aiTransforms: UsageDimension
  apiCalls: UsageDimension
  subtotalCost: CostDimension
  totalCost: CostDimension
}

interface CostBreakdownApiResponse {
  success: boolean
  data: CostBreakdownResponse
  message?: string
}

export function useCostBreakdown(organizationId?: string) {
  return useQuery({
    queryKey: ["cost-breakdown", organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required")
      }

      const { data } = await axios.get<CostBreakdownApiResponse>(
        `/api/billing/cost-breakdown`,
        {
          params: {
            tenant_id: organizationId,
          },
        }
      )

      if (!data?.success) {
        throw new Error(data?.message ?? "Failed to fetch cost breakdown")
      }

      return data.data
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
