"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { v4 as uuidv4 } from "uuid"
import type { RubricEntry } from "@/shared/types/rubric"

interface AddCompetencyModalProps {
  open: boolean
  onClose: () => void
  onSave: (name: string, description: string, rubrics: RubricEntry[]) => void
}

export default function AddCompetencyModal({ open, onClose, onSave }: AddCompetencyModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [rubrics, setRubrics] = useState<RubricEntry[]>([])

  const handleAddRubric = () => {
    setRubrics([
      ...rubrics,
      {
        id: uuidv4(),
        competency_id: "", // will be added in parent
        score_range: "",
        criteria: "",
      },
    ])
  }

  const handleRubricChange = (index: number, field: keyof RubricEntry, value: string) => {
    const updated = [...rubrics]
    updated[index][field] = value
    setRubrics(updated)
  }

  const handleSave = () => {
    onSave(name, description, rubrics)
    setName("")
    setDescription("")
    setRubrics([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Competency</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Rubric Entries</Label>
              <Button size="sm" onClick={handleAddRubric}>+ Add Entry</Button>
            </div>
            {rubrics.map((r, idx) => (
              <div key={r.id} className="flex space-x-2">
                <Input
                  placeholder="Score Range"
                  value={r.score_range}
                  className="w-28"
                  onChange={(e) => handleRubricChange(idx, "score_range", e.target.value)}
                />
                <Input
                  placeholder="Criteria"
                  className="flex-1"
                  value={r.criteria}
                  onChange={(e) => handleRubricChange(idx, "criteria", e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
            <Button onClick={handleSave} disabled={!name || !description}>Save Competency</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
