"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { CategoryManager } from "@/components/parameter-catalog/category-manager"
import { ParameterTable } from "@/components/parameter-catalog/parameter-table"
import { useParameterCategories } from "@/hooks/use-parameter-categories"
import { useParameters } from "@/hooks/use-parameters"

export function NarrativeParametersManager() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)

  const {
    data: categories,
    error: categoriesError,
    isLoading: categoriesLoading,
    mutate: mutateCategories,
  } = useParameterCategories({ type: "narrative" })

  const {
    data: parameters,
    error: parametersError,
    isLoading: parametersLoading,
    mutate: mutateParameters,
  } = useParameters({ categoryId: selectedCategory })

  useEffect(() => {
    if (categories?.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  if (categoriesLoading) {
    return <div className="text-center p-8">Loading...</div>
  }

  if (categoriesError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{categoriesError.message}</AlertDescription>
      </Alert>
    )
  }

  if (!categories?.length) {
    return (
      <Alert>
        <AlertDescription>No narrative parameter categories found. Please create a category first.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <CategoryManager
        categories={categories}
        selectedCategoryId={selectedCategory}
        onCategorySelect={handleCategorySelect}
        onCategoryChange={mutateCategories}
        parameterType="narrative"
      />
      {selectedCategory && (
        <ParameterTable
          categoryId={selectedCategory}
          onParameterChange={mutateParameters}
          parameterType="narrative"
          showExamples={true}
        />
      )}
    </div>
  )
}
