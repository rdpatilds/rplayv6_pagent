"use client"

import { useState, useEffect } from "react"
import { useParameterCategories } from "@/hooks/use-parameter-categories"
import { ParameterTable } from "@/components/parameter-catalog/parameter-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NarrativeParameters({ onCategoryChange }: { onCategoryChange?: () => void }) {
  const { data: categories, error, isLoading, mutate } = useParameterCategories({ type: "narrative" })
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
          Failed to load narrative parameters.
          <Button variant="link" onClick={() => mutate()} className="p-0 h-auto font-normal">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (categories.length === 0) {
    return (
      <Alert>
        <AlertDescription>No narrative parameter categories found. Please create a category first.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {selectedCategoryId && (
        <ParameterTable
          categoryId={selectedCategoryId}
          onParameterChange={handleCategoryChange}
          parameterType="narrative"
          showExamples={true}
        />
      )}
    </div>
  )
}
