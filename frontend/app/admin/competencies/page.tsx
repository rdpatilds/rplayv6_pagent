"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, ArrowRight, Plus, Save, Trash2, Edit, ClipboardList, Loader2 } from "lucide-react"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchCompetencies, addCompetency, updateCompetency, deleteCompetency, saveAllCompetencies } from "./actions"
import type { CompetencyWithRubrics } from "@shared/types/competency"
import type { RubricEntry } from "@shared/types/rubric"
import AddCompetencyModal from "./AddCompetencyModal"
import EditCompetencyModal from "./EditCompetencyModal"
import { apiClient } from "@/lib/api"

export default function Competencies() {
  const [competencies, setCompetencies] = useState<CompetencyWithRubrics[]>([])
  const [newCompetency, setNewCompetency] = useState({ name: "", description: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const [newRubric, setNewRubric] = useState<Record<string, { score_range: string; criteria: string }>>({})
  const [expandedRubrics, setExpandedRubrics] = useState<Record<string, boolean>>({})
  const [activeCompetency, setActiveCompetency] = useState<CompetencyWithRubrics | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const handleAddNewCompetency = async (name: string, description: string, rubricEntries: RubricEntry[]) => {
    const id = name.toLowerCase().replace(/\s+/g, "-")
    const competency: CompetencyWithRubrics = { id, name, description, rubrics: rubricEntries.map(r => ({ ...r, competency_id: id })) }
  
    const { success } = await addCompetency(competency)
    if (success) {
      setCompetencies([...competencies, competency])
      toast({ title: "Success", description: "Competency added" })
    } else {
      toast({ title: "Error", description: "Failed to add competency", variant: "destructive" })
    }
  }

  const handleUpdateCompetency = async (updated: CompetencyWithRubrics) => {
    setSaving(true)
    try {
      const { success } = await updateCompetency(updated.id, updated)
      if (success) {
        setCompetencies((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        )
        toast({ title: "Success", description: "Competency updated" })
      } else {
        toast({ title: "Error", description: "Failed to update competency", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: "Error saving competency", variant: "destructive" })
    } finally {
      setSaving(false)
      setIsEditModalOpen(false)
    }
  }
  
  const openEditModal = (id: string) => {
    const competency = competencies.find(c => c.id === id)
    if (competency) {
      setActiveCompetency(structuredClone(competency)) // deep copy to avoid mutation
      setIsEditModalOpen(true)
    }
  }
  

  const toggleRubricVisibility = (id: string) => {
    setExpandedRubrics((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  
  const handleAddRubricEntry = async (competencyId: string) => {
    const entry = newRubric[competencyId]
    if (!entry?.score_range || !entry?.criteria) return

    const id = crypto.randomUUID()

    const payload: RubricEntry = {
      id,
      competency_id: competencyId,
      score_range: entry.score_range,
      criteria: entry.criteria,
    }

    try {
      await apiClient.post("/api/rubric-entry", payload)

      // Update rubric list in local state
      setCompetencies((prev) =>
        prev.map((c) =>
          c.id === competencyId
            ? { ...c, rubrics: [...c.rubrics, payload as RubricEntry] }
            : c
        )
      )

      // Clear input fields for this competency
      setNewRubric({
        ...newRubric,
        [competencyId]: { score_range: "", criteria: "" },
      })

      toast({
        title: "Rubric Added",
        description: "A new rubric entry has been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save rubric entry",
        variant: "destructive",
      })
    }
  }
  

  // Load competencies on page load
  useEffect(() => {
    const loadCompetencies = async () => {
      try {
        const data = await fetchCompetencies()
        setCompetencies(data)
      } catch (error) {
        console.error("Error loading competencies:", error)
        toast({
          title: "Error",
          description: "Failed to load competencies",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadCompetencies()
  }, [toast])

  const handleAddCompetency = async () => {
    if (newCompetency.name && newCompetency.description) {
      setSaving(true)
      try {
        const id = newCompetency.name.toLowerCase().replace(/\s+/g, "-")
        const competency: CompetencyWithRubrics = { id, ...newCompetency, rubrics: [] }

        const { success } = await addCompetency(competency)

        if (success) {
          setCompetencies([...competencies, competency])
          setNewCompetency({ name: "", description: "" })
          toast({
            title: "Success",
            description: "Competency added successfully",
          })
        } else {
          throw new Error("Failed to add competency")
        }
      } catch (error) {
        console.error("Error adding competency:", error)
        toast({
          title: "Error",
          description: "Failed to add competency",
          variant: "destructive",
        })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleEditCompetency = (id: string) => {
    const competency = competencies.find((c) => c.id === id)
    if (competency) {
      setActiveCompetency(structuredClone(competency))
      setIsEditModalOpen(true)
    }
  }
  

  const handleDeleteCompetency = async (id: string) => {
    setSaving(true)
    try {
      const { success } = await deleteCompetency(id)

      if (success) {
        setCompetencies(competencies.filter((c) => c.id !== id))
        toast({
          title: "Success",
          description: "Competency deleted successfully",
        })
      } else {
        throw new Error("Failed to delete competency")
      }
    } catch (error) {
      console.error("Error deleting competency:", error)
      toast({
        title: "Error",
        description: "Failed to delete competency",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const { success } = await saveAllCompetencies(competencies)

      if (success) {
        toast({
          title: "Success",
          description: "All competencies saved successfully",
        })
      } else {
        throw new Error("Failed to save all competencies")
      }
    } catch (error) {
      console.error("Error saving all competencies:", error)
      toast({
        title: "Error",
        description: "Failed to save all competencies",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(35,15,110)]" />
        <span className="ml-2">Loading competencies...</span>   
      
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Competencies Management</h1>
            <p className="text-gray-500 mt-2">Define and manage competency labels for simulations</p>
            <div className="text-sm text-gray-400 mt-1">Page ID: CM-001</div>
          </div>
          <div className="flex space-x-2">
            
            <Button
              className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Competency
            </Button>

            <Button
              className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Changes
            </Button>
          </div>
        </div>

        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Competencies List</CardTitle>
              <CardDescription>Manage existing competencies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competency</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competencies.map((competency) => (
                    <React.Fragment key={competency.id}>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center justify-between">
                            {competency.name}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleRubricVisibility(competency.id)}
                              className="ml-2"
                            >
                              {expandedRubrics[competency.id] ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{competency.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCompetency(competency.id)} disabled={saving}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCompetency(competency.id)} disabled={saving}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {expandedRubrics[competency.id] && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={3}>
                            <div className="pl-4 space-y-1">
                              <p className="text-sm text-gray-600 font-semibold">Rubrics:</p>
                              {competency.rubrics?.length ? (
                                competency.rubrics
                                .sort((a, b) => {
                                  const extractStart = (range: string) => {
                                    const match = range.match(/\d+/)
                                    return match ? parseInt(match[0], 10) : 0
                                  }
                                  return extractStart(b.score_range) - extractStart(a.score_range)
                                })
                                .map((rubric) => (
                                  <div key={rubric.id} className="text-sm text-gray-700">
                                    <strong>{rubric.score_range}</strong>: {rubric.criteria}
                                  </div>
                                ))
                              ) : (
                                <em className="text-gray-400">No rubric entries</em>
                              )}

                              <div className="flex space-x-2 mt-2">
                                <Input
                                  placeholder="Score Range"
                                  className="w-32"
                                  value={newRubric[competency.id]?.score_range || ""}
                                  onChange={(e) =>
                                    setNewRubric({
                                      ...newRubric,
                                      [competency.id]: {
                                        ...(newRubric[competency.id] || {}),
                                        score_range: e.target.value,
                                      },
                                    })
                                  }
                                />
                                
                                <Input
                                  placeholder="Criteria"
                                  className="flex-1"
                                  value={newRubric[competency.id]?.criteria || ""}
                                  onChange={(e) =>
                                    setNewRubric({
                                      ...newRubric,
                                      [competency.id]: {
                                        ...(newRubric[competency.id] || {}),
                                        criteria: e.target.value,
                                      },
                                    })
                                  }
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddRubricEntry(competency.id)}
                                  className="bg-[rgb(35,15,110)] text-white"
                                >
                                  + Add
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Link href="/admin/industry-settings">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Industry Settings
          </Button>
        </Link>
        <Link href="/admin/fusion-model">
          <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
            Next: Fusion Model
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <AddCompetencyModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddNewCompetency}
      />
      {activeCompetency && (
        <EditCompetencyModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          competency={activeCompetency}
          onSave={handleUpdateCompetency}
        />
      )}
    </div>
  )
}
  

