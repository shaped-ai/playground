import { useQuery } from "@tanstack/react-query"
import type { SavedQuery } from "@/lib/types/query.types"
import axios from "@/utils/axios-interceptor"
import { useOrganization } from "../use-organization"


interface SavedQueriesResponse {
  success: boolean
  data: {
    engine: string
    queries: SavedQuery[]
    count: number
  }
}

export function useSavedQueries(engine?: string) {
  const {organization} = useOrganization()
  const { data, isLoading, error } = useQuery({
    queryKey: ["saved-queries", engine],
    queryFn: async () => {
      const response = await axios.get(
        `/api/query/saved?engine=${encodeURIComponent(engine ?? "")}`,{
          headers: {
            "x-api-key": `${organization?.apiKey}`,
          },
        }
      )
      return response.data
    },
    
     
    enabled: !!engine && engine !== "",
    staleTime: 5 * 60 * 1000,
  })

  return { data: data?.data ?? null, isLoading, error }
}