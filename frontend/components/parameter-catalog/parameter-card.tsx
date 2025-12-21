"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Check, X } from "lucide-react"
import type { Parameter } from "@/lib/parameter-db"
import { ParameterForm } from "./parameter-form"

interface ParameterCardProps {
  parameter: Parameter
  onUpdate: (id: string, data: Partial<Parameter>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ParameterCard({ parameter, onUpdate, onDelete }: ParameterCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleUpdate = async (data: Partial<Parameter>) => {
    await onUpdate(parameter.id, data)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (isDeleting) {
      await onDelete(parameter.id)
    } else {
      setIsDeleting(true)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleting(false)
  }

  return (
    <Card className="w-full">
      {isEditing ? (
        <ParameterForm parameter={parameter} onSubmit={handleUpdate} onCancel={handleCancelEdit} />
      ) : (
        <>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{parameter.name}</CardTitle>
                {parameter.category_key && (
                  <Badge variant="outline" className="mt-1">
                    {parameter.category_key}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {parameter.description && <CardDescription>{parameter.description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-2">
            {parameter.range && (
              <div>
                <span className="font-medium">Range:</span> {parameter.range}
              </div>
            )}
            {parameter.examples && (
              <div>
                <span className="font-medium">Examples:</span> {parameter.examples}
              </div>
            )}
            {parameter.applicable_industries && parameter.applicable_industries.length > 0 && (
              <div>
                <span className="font-medium">Industries:</span>{" "}
                {Array.isArray(parameter.applicable_industries)
                  ? parameter.applicable_industries.join(", ")
                  : JSON.stringify(parameter.applicable_industries)}
              </div>
            )}
            <div>
              <span className="font-medium">Global:</span> {parameter.global ? "Yes" : "No"}
            </div>
          </CardContent>
          {isDeleting && (
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-red-500">Confirm deletion?</div>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Check className="h-4 w-4 mr-1" /> Confirm
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelDelete}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
              </div>
            </CardFooter>
          )}
        </>
      )}
    </Card>
  )
}
