"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pencil, Trash2, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useParameterCategories } from "@/hooks/use-parameter-categories"
import { useParameters } from "@/hooks/use-parameters"
import { CategoryManager } from "@/components/parameter-catalog/category-manager"
import { ParameterTable } from "@/components/parameter-catalog/parameter-table"

interface Category {
  id: string
  name: string
  key: string
  parameter_type: string
}

interface Parameter {
  id: string
  name: string
  description?: string
  range?: string
  examples?: string
  category_id: string
  category_key: string
}

export function StructuredParametersManager() {
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const { data: categories, error: categoriesError, isLoading: categoriesLoading, mutate: mutateCategories } = useParameterCategories({ type: "structured" })
  const { data: parameters, error: parametersError, isLoading: parametersLoading, mutate: mutateParameters } = useParameters({ categoryId: selectedCategory })

  // Dialog states
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false)
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [addParameterDialogOpen, setAddParameterDialogOpen] = useState(false)
  const [editParameterDialogOpen, setEditParameterDialogOpen] = useState(false)
  const [deleteParameterDialogOpen, setDeleteParameterDialogOpen] = useState(false)

  // Form states
  const [newCategory, setNewCategory] = useState({ name: "", key: "" })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newParameter, setNewParameter] = useState({ name: "", description: "", range: "" })
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null)

  // Set initial category when data loads
  useEffect(() => {
    if (categories?.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id)
    }
  }, [categories, selectedCategory])

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  // Add new category
  const handleAddCategory = async () => {
    try {
      if (!newCategory.name) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive",
        })
        return
      }

      // Generate key if not provided
      const key = newCategory.key || newCategory.name.toLowerCase().replace(/\s+/g, "-")

      const response = await fetch("/api/parameter-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategory.name,
          key,
          parameter_type: "structured",
        }),
      })

      if (!response.ok) throw new Error("Failed to create category")

      const createdCategory = await response.json()
      setSelectedCategory(createdCategory.id)
      setNewCategory({ name: "", key: "" })
      setAddCategoryDialogOpen(false)
      mutateCategories()

      toast({
        title: "Category created",
        description: `Category "${createdCategory.name}" has been created successfully.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  // Edit category
  const handleEditCategory = async () => {
    try {
      if (!editingCategory || !editingCategory.name) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/parameter-categories/${editingCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingCategory.name,
          key: editingCategory.key,
        }),
      })

      if (!response.ok) throw new Error("Failed to update category")

      const updatedCategory = await response.json()
      setEditingCategory(null)
      setEditCategoryDialogOpen(false)
      mutateCategories()

      toast({
        title: "Category updated",
        description: `Category "${updatedCategory.name}" has been updated successfully.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  // Delete category
  const handleDeleteCategory = async () => {
    try {
      if (!editingCategory) return

      const response = await fetch(`/api/parameter-categories/${editingCategory.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete category")

      if (selectedCategory === editingCategory.id) {
        setSelectedCategory(categories?.length > 1 ? categories[0].id : undefined)
      }
      setEditingCategory(null)
      setDeleteCategoryDialogOpen(false)
      mutateCategories()

      toast({
        title: "Category deleted",
        description: `Category "${editingCategory.name}" has been deleted successfully.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  // Add new parameter
  const handleAddParameter = async () => {
    try {
      if (!newParameter.name || !selectedCategory) {
        toast({
          title: "Error",
          description: "Parameter name is required",
          variant: "destructive",
        })
        return
      }

      const selectedCat = categories?.find((cat) => cat.id === selectedCategory)
      if (!selectedCat) return

      const response = await fetch("/api/parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParameter.name,
          description: newParameter.description,
          range: newParameter.range,
          type: "structured",
          category_id: selectedCategory,
          category_key: selectedCat.key,
          global: true,
        }),
      })

      if (!response.ok) throw new Error("Failed to create parameter")

      const createdParameter = await response.json()
      setNewParameter({ name: "", description: "", range: "" })
      setAddParameterDialogOpen(false)
      mutateParameters()

      toast({
        title: "Parameter created",
        description: `Parameter "${createdParameter.name}" has been created successfully.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create parameter",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  // Edit parameter
  const handleEditParameter = async () => {
    try {
      if (!editingParameter || !editingParameter.name) {
        toast({
          title: "Error",
          description: "Parameter name is required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/parameters/${editingParameter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingParameter.name,
          description: editingParameter.description,
          range: editingParameter.range,
        }),
      })

      if (!response.ok) throw new Error("Failed to update parameter")

      const updatedParameter = await response.json()
      setEditingParameter(null)
      setEditParameterDialogOpen(false)
      mutateParameters()

      toast({
        title: "Parameter updated",
        description: `Parameter "${updatedParameter.name}" has been updated successfully.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update parameter",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  // Delete parameter
  const handleDeleteParameter = async () => {
    try {
      if (!editingParameter) return

      const response = await fetch(`/api/parameters/${editingParameter.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete parameter")

      setEditingParameter(null)
      setDeleteParameterDialogOpen(false)
      mutateParameters()

      toast({
        title: "Parameter deleted",
        description: `Parameter "${editingParameter.name}" has been deleted successfully.`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete parameter",
        variant: "destructive",
      })
      console.error(err)
    }
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
        <AlertDescription>No structured parameter categories found. Please create a category first.</AlertDescription>
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
        parameterType="structured"
      />
      {selectedCategory && (
        <ParameterTable
          categoryId={selectedCategory}
          onParameterChange={mutateParameters}
          parameterType="structured"
          showExamples={false}
        />
      )}
    </div>
  )
}
