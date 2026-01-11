"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api"

interface ParameterCategory {
  id: string
  name: string
  key: string
  parameter_type: string
}

interface CategoryManagerProps {
  categories: ParameterCategory[]
  selectedCategoryId: string | undefined
  onCategorySelect: (categoryId: string) => void
  onCategoryChange: () => void
  parameterType: string
}

export function CategoryManager({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onCategoryChange,
  parameterType,
}: CategoryManagerProps) {
  const { toast } = useToast()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", key: "" })
  const [editingCategory, setEditingCategory] = useState<ParameterCategory | null>(null)

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)

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

      // TODO: Consider adding category methods to parametersApi or creating separate categoriesApi
      const response = await apiClient.post("/api/parameter-categories", {
        name: newCategory.name,
        key: newCategory.key || newCategory.name.toLowerCase().replace(/\s+/g, "-"),
        parameter_type: parameterType,
      })

      toast({
        title: "Success",
        description: `Category "${response.data.name}" has been created.`,
      })

      setNewCategory({ name: "", key: "" })
      setAddDialogOpen(false)
      onCategoryChange()
      onCategorySelect(response.data.id)
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category. Please try again.",
        variant: "destructive",
      })
    }
  }

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

      const response = await apiClient.patch(`/api/parameter-categories/${editingCategory.id}`, {
        name: editingCategory.name,
        key: editingCategory.key,
      })

      toast({
        title: "Success",
        description: `Category "${response.data.name}" has been updated.`,
      })

      setEditingCategory(null)
      setEditDialogOpen(false)
      onCategoryChange()
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    try {
      if (!editingCategory) return

      await apiClient.delete(`/api/parameter-categories/${editingCategory.id}`)

      toast({
        title: "Success",
        description: `Category "${editingCategory.name}" has been deleted.`,
      })

      setEditingCategory(null)
      setDeleteDialogOpen(false)
      onCategoryChange()

      // Select another category if available
      if (editingCategory.id === selectedCategoryId && categories.length > 1) {
        const otherCategory = categories.find((cat) => cat.id !== selectedCategoryId)
        if (otherCategory) {
          onCategorySelect(otherCategory.id)
        }
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Parameter Categories</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewCategory({ name: "", key: "" })
            setAddDialogOpen(true)
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Category
        </Button>
      </div>

      <Tabs value={selectedCategoryId || ""} className="mb-6">
        <TabsList className="flex flex-wrap h-auto mb-4">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              onClick={() => onCategorySelect(category.id)}
              className="mb-2"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {selectedCategory && (
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-md font-medium">{selectedCategory.name}</h4>
              <p className="text-sm text-gray-600">
                {selectedCategory.name} parameters define the {selectedCategory.key.replace(/-/g, " ")} of potential
                clients, which influence their financial needs, goals, and concerns.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCategory(selectedCategory)
                  setEditDialogOpen(true)
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  setEditingCategory(selectedCategory)
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <Input
                placeholder="e.g., ACT Scores"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category ID (URL-friendly)</label>
              <Input
                placeholder="e.g., act-scores"
                value={newCategory.key}
                onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate from name</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} className="bg-purple-700 hover:bg-purple-800">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category ID (URL-friendly)</label>
                <Input
                  value={editingCategory.key}
                  onChange={(e) => setEditingCategory({ ...editingCategory, key: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} className="bg-purple-700 hover:bg-purple-800">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="py-4">
              <p>Are you sure you want to delete the category "{editingCategory.name}"?</p>
              <p className="text-red-500 mt-2">
                This will also delete all parameters in this category and cannot be undone.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
