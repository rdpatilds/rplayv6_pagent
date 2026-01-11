"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"
import type { CompetencyWithRubrics } from "@shared/types/competency"
import type { RubricEntry } from "@shared/types/rubric"

type Props = {
  open: boolean
  onClose: () => void
  competency: CompetencyWithRubrics
  onSave: (updated: CompetencyWithRubrics) => void
}

export default function EditCompetencyModal({ open, onClose, competency, onSave }: Props) {
  const [name, setName] = useState(competency.name)
  const [description, setDescription] = useState(competency.description)
  const [rubrics, setRubrics] = useState<RubricEntry[]>(competency.rubrics || [])

  const updateRubric = (index: number, field: keyof RubricEntry, value: string) => {
    const updated = [...rubrics]
    updated[index] = { ...updated[index], [field]: value }
    setRubrics(updated)
  }

  const removeRubric = (index: number) => {
    const updated = rubrics.filter((_, i) => i !== index)
    setRubrics(updated)
  }

  const addRubric = () => {
    setRubrics([...rubrics, { id: crypto.randomUUID(), competency_id: competency.id, score_range: "", criteria: "" }])
  }

  const handleSave = () => {
    onSave({ id: competency.id, name, description, rubrics })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Competency</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Rubric Entries</Label>
            {rubrics.map((rubric, index) => (
              <div key={rubric.id} className="flex gap-2 items-center">
                <Input
                  className="w-32"
                  placeholder="Score Range"
                  value={rubric.score_range}
                  onChange={(e) => updateRubric(index, "score_range", e.target.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Criteria"
                  value={rubric.criteria}
                  onChange={(e) => updateRubric(index, "criteria", e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => removeRubric(index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addRubric}>
              + Add Rubric
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-[rgb(35,15,110)] text-white" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
