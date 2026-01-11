import useSWR from "swr"
import { parametersApi } from "@/lib/api"

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
  type?: "structured" | "narrative" | "guardrails"
}

interface UseParametersResult {
  data: Parameter[]
  error: Error | null
  isLoading: boolean
  mutate: () => void
}

const fetcher = async (key: string) => {
  const [_, categoryId, type] = key.split("|")
  const response = await parametersApi.getAll({
    categoryId: categoryId || undefined,
    type: type as any || undefined
  })
  return response.data
}

export function useParameters(options?: UseParametersOptions): UseParametersResult {
  const { categoryId, type } = options || {}
  const key = `parameters|${categoryId || ""}|${type || ""}`

  const { data, error, isLoading, mutate } = useSWR<Parameter[], Error>(key, fetcher)

  return {
    data: data || [],
    error,
    isLoading,
    mutate,
  }
}
