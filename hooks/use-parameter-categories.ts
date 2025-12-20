import useSWR from "swr"

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
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch parameter categories")
  }
  return response.json()
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
