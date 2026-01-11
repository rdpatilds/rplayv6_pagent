"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import type { Parameter } from "@/lib/parameter-db"
import { ParameterForm } from "./parameter-form"

interface AddParameterProps {
  type: "structured" | "narrative" | "guardrail" | "life"
  onAdd: (data: Partial<Parameter>) => Promise<void>
}

export function AddParameter({ type, onAdd }: AddParameterProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async (data: Partial<Parameter>) => {
    await onAdd(data)
    setIsAdding(false)
  }

  const handleCancel = () => {
    setIsAdding(false)
  }

  if (isAdding) {
    return (
      <Card>
        <ParameterForm type={type} onSubmit={handleAdd} onCancel={handleCancel} />
      </Card>
    )
  }

  return (
    <Button
      variant="outline"
      className="w-full h-24 border-dashed flex flex-col items-center justify-center"
      onClick={() => setIsAdding(true)}
    >
      <Plus className="h-6 w-6 mb-1" />
      <span>Add Parameter</span>
    </Button>
  )
}
