import useSWR from "swr"
import { apiClient } from "@/lib/api"

// TODO: This endpoint may need to be created in the backend if categories are separate from parameters
// For now, using the API client for consistency

interface ParameterCategory {
  id: string
  name: string
  key: string
  parameter_type: string
  created_at?: string
}

interface UseParameterCategoriesOptions {
  type?: string
}

interface UseParameterCategoriesResult {
  data: ParameterCategory[]
  error: Error | null
  isLoading: boolean
  mutate: () => void
}

const fetcher = async (url: string) => {
  const response = await apiClient.get<ParameterCategory[]>(url)
  return response.data
}

export function useParameterCategories(options?: UseParameterCategoriesOptions): UseParameterCategoriesResult {
  const { type } = options || {}
  const url = type ? `/api/parameter-categories?type=${type}` : "/api/parameter-categories"

  const { data, error, isLoading, mutate } = useSWR<ParameterCategory[], Error>(url, fetcher)

  return {
    data: data || [],
    error,
    isLoading,
    mutate,
  }
}
