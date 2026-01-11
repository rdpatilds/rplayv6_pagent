"use client"

import { useState, useEffect } from "react"
import { useParameterCategories } from "@/hooks/use-parameter-categories"
import { CategoryManager } from "@/components/parameter-catalog/category-manager"
import { ParameterTable } from "@/components/parameter-catalog/parameter-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StructuredParameters({ onCategoryChange }: { onCategoryChange?: () => void }) {
  const { data: categories, error, isLoading, mutate } = useParameterCategories({ type: "structured" })
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Set the first category as selected when data loads
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  const handleCategoryChange = () => {
    mutate()
    if (onCategoryChange) {
      onCategoryChange()
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load structured parameters.
          <Button variant="link" onClick={() => mutate()} className="p-0 h-auto font-normal">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <CategoryManager
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onCategoryChange={handleCategoryChange}
        parameterType="structured"
      />

      {selectedCategoryId && (
        <ParameterTable
          categoryId={selectedCategoryId}
          onParameterChange={handleCategoryChange}
          parameterType="structured"
        />
      )}
    </div>
  )
}
