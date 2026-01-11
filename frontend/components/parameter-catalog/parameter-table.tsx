"use client"

import { useState } from "react"
import { useParameters } from "@/hooks/use-parameters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, PlusCircle, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { parametersApi } from "@/lib/api"

interface ParameterTableProps {
  categoryId: string
  onParameterChange: () => void
  parameterType: string
  showExamples?: boolean
}

export function ParameterTable({
  categoryId,
  onParameterChange,
  parameterType,
  showExamples = false,
}: ParameterTableProps) {
  const { toast } = useToast()
  const { data: parameters, error, isLoading, mutate } = useParameters({ categoryId })
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expandedExamples, setExpandedExamples] = useState<Record<string, boolean>>({})

  const [newParameter, setNewParameter] = useState({
    name: "",
    description: "",
    range: "",
    examples: "",
  })

  const [editingParameter, setEditingParameter] = useState<any>(null)

  const toggleExamples = (parameterId: string) => {
    setExpandedExamples({
      ...expandedExamples,
      [parameterId]: !expandedExamples[parameterId],
    })
  }

  const handleAddParameter = async () => {
    try {
      if (!newParameter.name) {
        toast({
          title: "Error",
          description: "Parameter name is required",
          variant: "destructive",
        })
        return
      }

      const response = await parametersApi.create({
        name: newParameter.name,
        description: newParameter.description,
        range: newParameter.range,
        examples: newParameter.examples,
        type: parameterType,
        categoryId: categoryId,
        global: true,
      })

      toast({
        title: "Success",
        description: `Parameter "${response.data.name}" has been created.`,
      })

      setNewParameter({ name: "", description: "", range: "", examples: "" })
      setAddDialogOpen(false)
      mutate()
      onParameterChange()
    } catch (error) {
      console.error("Error creating parameter:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create parameter. Please try again.",
        variant: "destructive",
      })
    }
  }

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

      const response = await parametersApi.update(editingParameter.id, {
        name: editingParameter.name,
        description: editingParameter.description,
        range: editingParameter.range,
        examples: editingParameter.examples,
      })

      toast({
        title: "Success",
        description: `Parameter "${response.data.name}" has been updated.`,
      })

      setEditingParameter(null)
      setEditDialogOpen(false)
      mutate()
      onParameterChange()
    } catch (error) {
      console.error("Error updating parameter:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update parameter. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteParameter = async () => {
    try {
      if (!editingParameter) return

      await parametersApi.delete(editingParameter.id)

      toast({
        title: "Success",
        description: `Parameter "${editingParameter.name}" has been deleted.`,
      })

      setEditingParameter(null)
      setDeleteDialogOpen(false)
      mutate()
      onParameterChange()
    } catch (error) {
      console.error("Error deleting parameter:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete parameter. Please try again.",
        variant: "destructive",
      })
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
          Failed to load parameters.
          <Button variant="link" onClick={() => mutate()} className="p-0 h-auto font-normal">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const getItemLabel = () => {
    switch (parameterType) {
      case "structured":
        return "Group"
      case "narrative":
        return "Parameter"
      case "guardrail":
        return "Item"
      default:
        return "Parameter"
    }
  }

  const itemLabel = getItemLabel()

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {parameters.length} {itemLabel}
          {parameters.length !== 1 ? "s" : ""}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewParameter({ name: "", description: "", range: "", examples: "" })
            setAddDialogOpen(true)
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add {itemLabel}
        </Button>
      </div>

      {/* Parameters Table */}
      <div className="border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {itemLabel} Name
              </th>
              {parameterType === "structured" && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Range
                </th>
              )}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              {showExamples && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Examples
                </th>
              )}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parameters.length === 0 ? (
              <tr>
                <td colSpan={showExamples ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No parameters found. Add your first {itemLabel.toLowerCase()} using the button above.
                </td>
              </tr>
            ) : (
              parameters.map((parameter) => (
                <tr key={parameter.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{parameter.name}</td>
                  {parameterType === "structured" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parameter.range || "-"}</td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-500">{parameter.description || "-"}</td>
                  {showExamples && (
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 p-0 h-auto font-normal text-xs flex items-center"
                          onClick={() => toggleExamples(parameter.id)}
                        >
                          {expandedExamples[parameter.id] ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Hide Examples
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              View Examples
                            </>
                          )}
                        </Button>

                        {expandedExamples[parameter.id] && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                            {parameter.examples || "No examples provided."}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingParameter(parameter)
                          setEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setEditingParameter(parameter)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Parameter Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {itemLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">{itemLabel} Name</label>
              <Input
                placeholder={`e.g., ${parameterType === "structured" ? "Young Adult" : "Life Events"}`}
                value={newParameter.name}
                onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
              />
            </div>
            {parameterType === "structured" && (
              <div>
                <label className="block text-sm font-medium mb-1">Range</label>
                <Input
                  placeholder="e.g., 18-25"
                  value={newParameter.range}
                  onChange={(e) => setNewParameter({ ...newParameter, range: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                placeholder={`Brief description of this ${itemLabel.toLowerCase()}`}
                value={newParameter.description}
                onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                rows={3}
              />
            </div>
            {showExamples && (
              <div>
                <label className="block text-sm font-medium mb-1">Examples</label>
                <Textarea
                  placeholder="Provide examples for AI generation (comma-separated or quoted)"
                  value={newParameter.examples}
                  onChange={(e) => setNewParameter({ ...newParameter, examples: e.target.value })}
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddParameter} className="bg-purple-700 hover:bg-purple-800">
              Add {itemLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Parameter Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {itemLabel}</DialogTitle>
          </DialogHeader>
          {editingParameter && (
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">{itemLabel} Name</label>
                <Input
                  value={editingParameter.name}
                  onChange={(e) => setEditingParameter({ ...editingParameter, name: e.target.value })}
                />
              </div>
              {parameterType === "structured" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Range</label>
                  <Input
                    value={editingParameter.range || ""}
                    onChange={(e) => setEditingParameter({ ...editingParameter, range: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={editingParameter.description || ""}
                  onChange={(e) => setEditingParameter({ ...editingParameter, description: e.target.value })}
                  rows={3}
                />
              </div>
              {showExamples && (
                <div>
                  <label className="block text-sm font-medium mb-1">Examples</label>
                  <Textarea
                    value={editingParameter.examples || ""}
                    onChange={(e) => setEditingParameter({ ...editingParameter, examples: e.target.value })}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditParameter} className="bg-purple-700 hover:bg-purple-800">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Parameter Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {itemLabel}</DialogTitle>
          </DialogHeader>
          {editingParameter && (
            <div className="py-4">
              <p>
                Are you sure you want to delete the {itemLabel.toLowerCase()} "{editingParameter.name}"?
              </p>
              <p className="text-red-500 mt-2">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteParameter}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
