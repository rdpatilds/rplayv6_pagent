import useSWR from "swr"

interface Parameter {
  id: string
  name: string
  description?: string
  type?: string
  range?: string
  examples?: string
  global?: boolean
  category_id?: string
  category_key?: string
  applicable_industries?: any
  created_at?: string
  updated_at?: string
}

interface UseParametersOptions {
  categoryId?: string
}

interface UseParametersResult {
  data: Parameter[]
  error: Error | null
  isLoading: boolean
  mutate: () => void
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch parameters")
  }
  return response.json()
}

export function useParameters(options?: UseParametersOptions): UseParametersResult {
  const { categoryId } = options || {}
  const url = categoryId ? `/api/parameters?categoryId=${categoryId}` : "/api/parameters"

  const { data, error, isLoading, mutate } = useSWR<Parameter[], Error>(url, fetcher)

  return {
    data: data || [],
    error,
    isLoading,
    mutate,
  }
}
