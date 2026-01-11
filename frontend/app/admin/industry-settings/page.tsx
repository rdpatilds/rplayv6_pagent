"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Plus, Edit, Trash2, MoreHorizontal, Wand2 } from "lucide-react"
import {
  fetchCompetencies,
  fetchIndustryCompetencies,
  saveCompetenciesForIndustry,
  fetchFocusAreas,
  createNewIndustry,
  createNewSubcategory,
  createNewFocusArea,
  modifyIndustry,
  removeIndustry,
  modifySubcategory,
  removeSubcategory,
  modifyFocusArea,
  removeFocusArea,
  fetchDifficultySettings,
  saveDifficultySettingsForIndustry,
  generateDifficultySettings,
  saveVisibleClientDetails,
} from "./actions"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Competency = {
  id: string
  name: string
  description: string
}

type FocusArea = {
  id: string
  name: string
  enabled: boolean
}

type VisibleClientDetails = {
  name: boolean
  age: boolean
  familyStatus: boolean
  occupation: boolean
  income: boolean
  assets: boolean
  debt: boolean
  primaryGoals: boolean
}

type DifficultyLevel = {
  description: string
  objectives: string
  clientBehavior: string
  sampleScenario: string
  visibleDetails: VisibleClientDetails
}

type DifficultySettings = {
  [industry: string]: {
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  }
}

export default function IndustrySettings() {
  const [selectedIndustry, setSelectedIndustry] = useState("insurance")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>("life-health")
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([])
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [industries, setIndustries] = useState<{ id: string; name: string }[]>([])
  const [subcategories, setSubcategories] = useState<{ id: string; name: string }[]>([])
  const [difficultySettings, setDifficultySettings] = useState<DifficultySettings>({})
  const [selectedDifficultyTab, setSelectedDifficultyTab] = useState("beginner")
  const [isEditingDifficulty, setIsEditingDifficulty] = useState(false)
  const [editedDifficultySettings, setEditedDifficultySettings] = useState<{
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  } | null>(null)

  // New industry form state
  const [newIndustryName, setNewIndustryName] = useState("")
  const [isAddingIndustry, setIsAddingIndustry] = useState(false)
  const [newIndustryDifficultySettings, setNewIndustryDifficultySettings] = useState<{
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  } | null>(null)

  // New subcategory form state
  const [newSubcategoryName, setNewSubcategoryName] = useState("")
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false)

  // New focus area form state
  const [newFocusAreaName, setNewFocusAreaName] = useState("")
  const [isAddingFocusArea, setIsAddingFocusArea] = useState(false)

  // Edit industry form state
  const [editIndustryId, setEditIndustryId] = useState("")
  const [editIndustryName, setEditIndustryName] = useState("")
  const [isEditingIndustry, setIsEditingIndustry] = useState(false)
  const [industryToEdit, setIndustryToEdit] = useState("")

  // Edit subcategory form state
  const [editSubcategoryId, setEditSubcategoryId] = useState("")
  const [editSubcategoryName, setEditSubcategoryName] = useState("")
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false)
  const [subcategoryToEdit, setSubcategoryToEdit] = useState("")

  // Edit focus area form state
  const [editFocusAreaId, setEditFocusAreaId] = useState("")
  const [editFocusAreaName, setEditFocusAreaName] = useState("")
  const [isEditingFocusArea, setIsEditingFocusArea] = useState(false)
  const [focusAreaToEdit, setFocusAreaToEdit] = useState("")

  // Add these new state variables near the top with the other state declarations
  const [isIndustryDialogOpen, setIsIndustryDialogOpen] = useState(false)
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false)
  const [isFocusAreaDialogOpen, setIsFocusAreaDialogOpen] = useState(false)
  const [isGeneratingDifficulty, setIsGeneratingDifficulty] = useState(false)

  // New state for visible client details
  const [visibleDetailsBeingEdited, setVisibleDetailsBeingEdited] = useState(false)

  const { toast } = useToast()

  // Load competencies and industry settings
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [allCompetencies, industryCompetencies, diffSettings] = await Promise.all([
          fetchCompetencies(),
          fetchIndustryCompetencies(),
          fetchDifficultySettings(),
        ])

        setCompetencies(allCompetencies)
        setDifficultySettings(diffSettings)

        // Extract industries from the data
        const industryList = Object.keys(industryCompetencies).map((id) => {
          // Convert ID to display name if no metadata
          const displayName = id
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")

          return { id, name: displayName }
        })
        setIndustries(industryList)

        // Extract subcategories for the selected industry
        if (industryCompetencies[selectedIndustry]) {
          const subcategoryList = Object.keys(industryCompetencies[selectedIndustry])
            .filter((id) => id !== "default" && id !== "industry-level") // Filter out the default subcategory
            .map((id) => {
              // Convert ID to display name
              const displayName = id
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")

              return { id, name: displayName }
            })
          setSubcategories(subcategoryList)

          // If no subcategories or only default, set selectedSubcategory to null
          if (subcategoryList.length === 0) {
            setSelectedSubcategory(null)
          } else if (selectedSubcategory === null || !subcategoryList.some((s) => s.id === selectedSubcategory)) {
            // If there are subcategories but the current selection is invalid, select the first one
            setSelectedSubcategory(subcategoryList[0].id)
          }
        } else {
          setSubcategories([])
          setSelectedSubcategory(null)
        }

        // Set selected competencies based on industry and subcategory
        if (
          selectedSubcategory &&
          industryCompetencies[selectedIndustry] &&
          industryCompetencies[selectedIndustry][selectedSubcategory] &&
          industryCompetencies[selectedIndustry][selectedSubcategory].competencies
        ) {
          setSelectedCompetencies(industryCompetencies[selectedIndustry][selectedSubcategory].competencies)
        } else if (
          selectedSubcategory &&
          industryCompetencies[selectedIndustry] &&
          industryCompetencies[selectedIndustry][selectedSubcategory] &&
          Array.isArray(industryCompetencies[selectedIndustry][selectedSubcategory])
        ) {
          // Handle legacy data format
          setSelectedCompetencies(industryCompetencies[selectedIndustry][selectedSubcategory] as unknown as string[])
        } else if (
          industryCompetencies[selectedIndustry] &&
          industryCompetencies[selectedIndustry]["industry-level"] &&
          industryCompetencies[selectedIndustry]["industry-level"].competencies
        ) {
          // Load industry-level competencies when no subcategory is selected
          setSelectedCompetencies(industryCompetencies[selectedIndustry]["industry-level"].competencies)
        } else {
          setSelectedCompetencies([])
        }

        // Load focus areas only if a subcategory is selected
        if (selectedSubcategory) {
          const areas = await fetchFocusAreas(selectedIndustry, selectedSubcategory)
          setFocusAreas(areas)
        } else {
          setFocusAreas([])
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load competencies. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedIndustry, selectedSubcategory, toast])

  // Handle industry change
  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value)
    setSelectedSubcategory(null) // Reset subcategory selection when industry changes
  }

  // Handle subcategory change
  const handleSubcategoryChange = (value: string) => {
    setSelectedSubcategory(value)
  }

  // Handle competency selection
  const handleCompetencyChange = (competencyId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedCompetencies((prev) => [...prev, competencyId])
    } else {
      setSelectedCompetencies((prev) => prev.filter((id) => id !== competencyId))
    }
  }

  // Save settings
  const handleSave = async () => {
    setIsSaving(true)
    try {
      let result

      if (selectedSubcategory) {
        // Save at subcategory level
        console.log(`Saving competencies for ${selectedIndustry}/${selectedSubcategory}:`, selectedCompetencies)
        result = await saveCompetenciesForIndustry(selectedIndustry, selectedSubcategory, selectedCompetencies)
      } else {
        // Save at industry level - use "industry-level" as the subcategory key
        console.log(`Saving industry-level competencies for ${selectedIndustry}:`, selectedCompetencies)
        result = await saveCompetenciesForIndustry(selectedIndustry, "industry-level", selectedCompetencies)
      }

      console.log("Save result:", result)

      if (result && result.success) {
        toast({
          title: "Settings Saved",
          description: selectedSubcategory
            ? `Competencies for ${selectedSubcategory} have been updated successfully.`
            : `Industry-level competencies for ${selectedIndustry} have been updated successfully.`,
        })

        // Refresh data after successful save
        const industryCompetencies = await fetchIndustryCompetencies()

        // Update selected competencies based on the refreshed data
        if (
          selectedSubcategory &&
          industryCompetencies[selectedIndustry] &&
          industryCompetencies[selectedIndustry][selectedSubcategory]
        ) {
          if (industryCompetencies[selectedIndustry][selectedSubcategory].competencies) {
            setSelectedCompetencies(industryCompetencies[selectedIndustry][selectedSubcategory].competencies)
          } else if (Array.isArray(industryCompetencies[selectedIndustry][selectedSubcategory])) {
            setSelectedCompetencies(industryCompetencies[selectedIndustry][selectedSubcategory] as unknown as string[])
          }
        } else if (
          !selectedSubcategory &&
          industryCompetencies[selectedIndustry] &&
          industryCompetencies[selectedIndustry]["industry-level"]
        ) {
          setSelectedCompetencies(industryCompetencies[selectedIndustry]["industry-level"].competencies || [])
        }
      } else {
        throw new Error(result?.message || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle adding a new industry
  const handleAddIndustry = async () => {
    if (!newIndustryName) {
      toast({
        title: "Validation Error",
        description: "Industry name is required.",
        variant: "destructive",
      })
      return
    }

    setIsAddingIndustry(true)
    try {
      const industryId = newIndustryName.toLowerCase().replace(/\s+/g, "-")
      const { success } = await createNewIndustry(
        industryId,
        newIndustryName,
        newIndustryDifficultySettings || undefined,
      )

      if (success) {
        toast({
          title: "Industry Added",
          description: `${newIndustryName} has been added successfully.`,
        })

        // Reset form
        setNewIndustryName("")
        setNewIndustryDifficultySettings(null)

        // Close the dialog
        setIsIndustryDialogOpen(false)

        // Refresh data
        const [industryCompetencies, diffSettings] = await Promise.all([
          fetchIndustryCompetencies(),
          fetchDifficultySettings(),
        ])

        setDifficultySettings(diffSettings)

        // Extract industries from the data
        const industryList = Object.keys(industryCompetencies).map((id) => {
          // Convert ID to display name if no metadata
          const displayName = id
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")

          return { id, name: displayName }
        })
        setIndustries(industryList)
      } else {
        throw new Error("Failed to add industry")
      }
    } catch (error) {
      console.error("Error adding industry:", error)
      toast({
        title: "Error",
        description: "Failed to add industry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingIndustry(false)
    }
  }

  // Handle adding a new subcategory
  const handleAddSubcategory = async () => {
    if (!newSubcategoryName) {
      toast({
        title: "Validation Error",
        description: "Subcategory name is required.",
        variant: "destructive",
      })
      return
    }

    setIsAddingSubcategory(true)
    try {
      const subcategoryId = newSubcategoryName.toLowerCase().replace(/\s+/g, "-")
      const { success } = await createNewSubcategory(selectedIndustry, subcategoryId, newSubcategoryName)

      if (success) {
        toast({
          title: "Subcategory Added",
          description: `${newSubcategoryName} has been added to ${selectedIndustry}.`,
        })

        // Reset form
        setNewSubcategoryName("")

        // Close the dialog
        setIsSubcategoryDialogOpen(false)

        // Refresh data
        const industryCompetencies = await fetchIndustryCompetencies()

        // Extract subcategories for the selected industry
        if (industryCompetencies[selectedIndustry]) {
          const subcategoryList = Object.keys(industryCompetencies[selectedIndustry])
            .filter((id) => id !== "default" && id !== "industry-level") // Filter out the default subcategory
            .map((id) => {
              // Convert ID to display name
              const displayName = id
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")

              return { id, name: displayName }
            })
          setSubcategories(subcategoryList)

          // Select the newly added subcategory
          setSelectedSubcategory(subcategoryId)
        }
      } else {
        throw new Error("Failed to add subcategory")
      }
    } catch (error) {
      console.error("Error adding subcategory:", error)
      toast({
        title: "Error",
        description: "Failed to add subcategory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingSubcategory(false)
    }
  }

  // Handle adding a new focus area
  const handleAddFocusArea = async () => {
    if (!selectedSubcategory) {
      toast({
        title: "No Subcategory Selected",
        description: "Please select a subcategory before adding a focus area.",
        variant: "destructive",
      })
      return
    }

    if (!newFocusAreaName) {
      toast({
        title: "Validation Error",
        description: "Focus area name is required.",
        variant: "destructive",
      })
      return
    }

    setIsAddingFocusArea(true)
    try {
      const focusAreaId = newFocusAreaName.toLowerCase().replace(/\s+/g, "-")
      const { success } = await createNewFocusArea(selectedIndustry, selectedSubcategory, focusAreaId, newFocusAreaName)

      if (success) {
        toast({
          title: "Focus Area Added",
          description: `${newFocusAreaName} has been added to ${selectedSubcategory}.`,
        })

        // Reset form
        setNewFocusAreaName("")

        // Close the dialog
        setIsFocusAreaDialogOpen(false)

        // Refresh focus areas
        const areas = await fetchFocusAreas(selectedIndustry, selectedSubcategory)
        setFocusAreas(areas)
      } else {
        throw new Error("Failed to add focus area")
      }
    } catch (error) {
      console.error("Error adding focus area:", error)
      toast({
        title: "Error",
        description: "Failed to add focus area. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingFocusArea(false)
    }
  }

  // Industry handlers
  const handleEditIndustry = (industry: { id: string; name: string }) => {
    setIndustryToEdit(industry.id)
    setEditIndustryId(industry.id)
    setEditIndustryName(industry.name)
    setIsEditingIndustry(true)
  }

  const handleUpdateIndustry = async () => {
    if (!editIndustryId || !editIndustryName) {
      toast({
        title: "Validation Error",
        description: "Industry ID and name are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const { success } = await modifyIndustry(editIndustryName)

      if (success) {
        toast({
          title: "Industry Updated",
          description: `Industry has been updated successfully.`,
        })

        // Update local state
        setIndustries((prev) =>
          prev.map((ind) => (ind.id === industryToEdit ? { id: industryToEdit, name: editIndustryName } : ind)),
        )

        // Reset form
        setEditIndustryId("")
        setEditIndustryName("")
        setIndustryToEdit("")
        setIsEditingIndustry(false)

        // Refresh data
        const industryCompetencies = await fetchIndustryCompetencies()
        const industryList = Object.keys(industryCompetencies).map((id) => {
          const displayName = id
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
          return { id, name: displayName }
        })
        setIndustries(industryList)
      } else {
        throw new Error("Failed to update industry")
      }
    } catch (error) {
      console.error("Error updating industry:", error)
      toast({
        title: "Error",
        description: "Failed to update industry. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteIndustry = async (id: string) => {
    if (confirm(`Are you sure you want to delete this industry? This action cannot be undone.`)) {
      try {
        const { success } = await removeIndustry(id)

        if (success) {
          toast({
            title: "Industry Deleted",
            description: `Industry has been deleted successfully.`,
          })

          // Update local state
          setIndustries((prev) => prev.filter((ind) => ind.id !== id))

          // If the deleted industry was selected, reset selection
          if (selectedIndustry === id) {
            const remainingIndustries = industries.filter((ind) => ind.id !== id)
            setSelectedIndustry(remainingIndustries[0]?.id || "")
            setSelectedSubcategory(null)
          }

          // Refresh data
          const [industryCompetencies, diffSettings] = await Promise.all([
            fetchIndustryCompetencies(),
            fetchDifficultySettings(),
          ])

          setDifficultySettings(diffSettings)

          const industryList = Object.keys(industryCompetencies).map((id) => {
            const displayName = id
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
            return { id, name: displayName }
          })
          setIndustries(industryList)
        } else {
          throw new Error("Failed to delete industry")
        }
      } catch (error) {
        console.error("Error deleting industry:", error)
        toast({
          title: "Error",
          description: "Failed to delete industry. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Subcategory handlers
  const handleEditSubcategory = (subcategory: { id: string; name: string }) => {
    setSubcategoryToEdit(subcategory.id)
    setEditSubcategoryId(subcategory.id)
    setEditSubcategoryName(subcategory.name)
    setIsEditingSubcategory(true)
  }

  const handleUpdateSubcategory = async () => {
    if (!editSubcategoryId || !editSubcategoryName) {
      toast({
        title: "Validation Error",
        description: "Subcategory ID and name are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const { success } = await modifySubcategory(selectedIndustry, subcategoryToEdit, editSubcategoryName)

      if (success) {
        toast({
          title: "Subcategory Updated",
          description: `Subcategory has been updated successfully.`,
        })

        // Update local state
        setSubcategories((prev) =>
          prev.map((sub) =>
            sub.id === subcategoryToEdit ? { id: subcategoryToEdit, name: editSubcategoryName } : sub,
          ),
        )

        // Reset form
        setEditSubcategoryId("")
        setEditSubcategoryName("")
        setSubcategoryToEdit("")
        setIsEditingSubcategory(false)

        // Refresh data
        const industryCompetencies = await fetchIndustryCompetencies()
        if (industryCompetencies[selectedIndustry]) {
          const subcategoryList = Object.keys(industryCompetencies[selectedIndustry])
            .filter((id) => id !== "default" && id !== "industry-level") // Filter out the default subcategory
            .map((id) => {
              const displayName = id
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
              return { id, name: displayName }
            })
          setSubcategories(subcategoryList)
        }
      } else {
        throw new Error("Failed to update subcategory")
      }
    } catch (error) {
      console.error("Error updating subcategory:", error)
      toast({
        title: "Error",
        description: "Failed to update subcategory. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (confirm(`Are you sure you want to delete this subcategory? This action cannot be undone.`)) {
      try {
        const { success } = await removeSubcategory(selectedIndustry, id)

        if (success) {
          toast({
            title: "Subcategory Deleted",
            description: `Subcategory has been deleted successfully.`,
          })

          // Update local state
          const updatedSubcategories = subcategories.filter((sub) => sub.id !== id)
          setSubcategories(updatedSubcategories)

          // If the deleted subcategory was selected, reset selection
          if (selectedSubcategory === id) {
            setSelectedSubcategory(updatedSubcategories[0]?.id || null)
          }

          // Refresh data
          const industryCompetencies = await fetchIndustryCompetencies()
          if (industryCompetencies[selectedIndustry]) {
            const subcategoryList = Object.keys(industryCompetencies[selectedIndustry])
              .filter((id) => id !== "default" && id !== "industry-level") // Filter out the default subcategory
              .map((id) => {
                const displayName = id
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
                return { id, name: displayName }
              })
            setSubcategories(subcategoryList)
          }
        } else {
          throw new Error("Failed to delete subcategory")
        }
      } catch (error) {
        console.error("Error deleting subcategory:", error)
        toast({
          title: "Error",
          description: "Failed to delete subcategory. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Focus Area handlers
  const handleEditFocusArea = (focusArea: { id: string; name: string }) => {
    setFocusAreaToEdit(focusArea.id)
    setEditFocusAreaId(focusArea.id)
    setEditFocusAreaName(focusArea.name)
    setIsEditingFocusArea(true)
  }

  const handleUpdateFocusArea = async () => {
    if (!selectedSubcategory) {
      toast({
        title: "No Subcategory Selected",
        description: "Please select a subcategory before updating a focus area.",
        variant: "destructive",
      })
      return
    }

    if (!editFocusAreaId || !editFocusAreaName) {
      toast({
        title: "Validation Error",
        description: "Focus area ID and name are required.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get the enabled status from the current focus area
      const currentFocusArea = focusAreas.find((area) => area.id === focusAreaToEdit)
      const enabled = currentFocusArea?.enabled ?? true

      const { success } = await modifyFocusArea(
        selectedIndustry,
        selectedSubcategory,
        focusAreaToEdit,
        editFocusAreaId.toLowerCase().replace(/\s+/g, "-"),
        enabled,
      )

      if (success) {
        toast({
          title: "Focus Area Updated",
          description: `Focus area has been updated successfully.`,
        })

        // Reset form
        setEditFocusAreaId("")
        setEditFocusAreaName("")
        setFocusAreaToEdit("")
        setIsEditingFocusArea(false)

        // Refresh focus areas
        const areas = await fetchFocusAreas(selectedIndustry, selectedSubcategory)
        setFocusAreas(areas)
      } else {
        throw new Error("Failed to update focus area")
      }
    } catch (error) {
      console.error("Error updating focus area:", error)
      toast({
        title: "Error",
        description: "Failed to update focus area. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFocusArea = async (id: string) => {
    if (!selectedSubcategory) {
      toast({
        title: "No Subcategory Selected",
        description: "Please select a subcategory before deleting a focus area.",
        variant: "destructive",
      })
      return
    }

    if (confirm(`Are you sure you want to delete this focus area? This action cannot be undone.`)) {
      try {
        const { success } = await removeFocusArea(selectedIndustry, selectedSubcategory, id)

        if (success) {
          toast({
            title: "Focus Area Deleted",
            description: `Focus area has been deleted successfully.`,
          })

          // Refresh focus areas
          const areas = await fetchFocusAreas(selectedIndustry, selectedSubcategory)
          setFocusAreas(areas)
        } else {
          throw new Error("Failed to delete focus area")
        }
      } catch (error) {
        console.error("Error deleting focus area:", error)
        toast({
          title: "Error",
          description: "Failed to delete focus area. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Difficulty settings handlers
  const handleEditDifficulty = () => {
    if (!difficultySettings[selectedIndustry]) {
      toast({
        title: "Error",
        description: "No difficulty settings found for this industry.",
        variant: "destructive",
      })
      return
    }

    setEditedDifficultySettings({ ...difficultySettings[selectedIndustry] })
    setIsEditingDifficulty(true)
  }

  const handleSaveDifficulty = async () => {
    if (!editedDifficultySettings) {
      return
    }

    try {
      const { success } = await saveDifficultySettingsForIndustry(selectedIndustry, editedDifficultySettings)

      if (success) {
        toast({
          title: "Difficulty Settings Saved",
          description: `Difficulty settings for ${selectedIndustry} have been updated successfully.`,
        })

        // Update local state
        setDifficultySettings({
          ...difficultySettings,
          [selectedIndustry]: editedDifficultySettings,
        })

        // Reset form
        setEditedDifficultySettings(null)
        setIsEditingDifficulty(false)
      } else {
        throw new Error("Failed to save difficulty settings")
      }
    } catch (error) {
      console.error("Error saving difficulty settings:", error)
      toast({
        title: "Error",
        description: "Failed to save difficulty settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateDifficultySettings = async (forNewIndustry = false) => {
    setIsGeneratingDifficulty(true)
    try {
      const industryName = forNewIndustry
        ? newIndustryName
        : industries.find((i) => i.id === selectedIndustry)?.name || selectedIndustry

      const generatedSettings = await generateDifficultySettings(
        forNewIndustry ? newIndustryName.toLowerCase().replace(/\s+/g, "-") : selectedIndustry,
        industryName,
      )

      if (forNewIndustry) {
        setNewIndustryDifficultySettings(generatedSettings)
        toast({
          title: "Difficulty Settings Generated",
          description: `Difficulty settings for ${newIndustryName} have been generated. Please review before saving.`,
        })
      } else {
        setEditedDifficultySettings(generatedSettings)
        toast({
          title: "Difficulty Settings Generated",
          description: `Difficulty settings for ${selectedIndustry} have been generated. Please review before saving.`,
        })
      }
    } catch (error) {
      console.error("Error generating difficulty settings:", error)
      toast({
        title: "Error",
        description: "Failed to generate difficulty settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingDifficulty(false)
    }
  }

  // Handle saving visible client details
  const handleSaveVisibleDetails = async (
    level: "beginner" | "intermediate" | "advanced",
    details: VisibleClientDetails,
  ) => {
    try {
      const { success } = await saveVisibleClientDetails(selectedIndustry, level, details)

      if (success) {
        toast({
          title: "Visible Details Saved",
          description: `Visible client details for ${level} difficulty have been updated.`,
        })

        // Update local state
        if (editedDifficultySettings) {
          setEditedDifficultySettings({
            ...editedDifficultySettings,
            [level]: {
              ...editedDifficultySettings[level],
              visibleDetails: details,
            },
          })
        }

        // Refresh difficulty settings
        const diffSettings = await fetchDifficultySettings()
        setDifficultySettings(diffSettings)
      } else {
        throw new Error("Failed to save visible client details")
      }
    } catch (error) {
      console.error("Error saving visible client details:", error)
      toast({
        title: "Error",
        description: "Failed to save visible client details. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Industry Settings</h1>
          <p className="text-gray-500 mt-2">Configure industry-specific simulation parameters</p>
          <div className="text-sm text-gray-400 mt-1">Page ID: IS-001</div>
        </div>
        <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]" onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Industry Selection</CardTitle>
                <CardDescription>Choose the industry and subcategory</CardDescription>
              </div>
              <Dialog open={isIndustryDialogOpen} onOpenChange={setIsIndustryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Industry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Industry</DialogTitle>
                    <DialogDescription>Create a new industry for simulation scenarios.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="industry-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="industry-name"
                        value={newIndustryName}
                        onChange={(e) => setNewIndustryName(e.target.value)}
                        className="col-span-3"
                        placeholder="Accountancy"
                      />
                    </div>

                    <div className="col-span-4 mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Difficulty Settings</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateDifficultySettings(true)}
                          disabled={!newIndustryName || isGeneratingDifficulty}
                        >
                          <Wand2 className="h-4 w-4 mr-1" />
                          {isGeneratingDifficulty ? "Generating..." : "Generate with AI"}
                        </Button>
                      </div>

                      {newIndustryDifficultySettings && (
                        <Tabs defaultValue="beginner" className="mt-4">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="beginner">Beginner</TabsTrigger>
                            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced</TabsTrigger>
                          </TabsList>

                          <TabsContent value="beginner" className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-beginner-description">Description</Label>
                              <Textarea
                                id="new-beginner-description"
                                value={newIndustryDifficultySettings.beginner.description}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    beginner: {
                                      ...newIndustryDifficultySettings.beginner,
                                      description: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-beginner-objectives">Objectives</Label>
                              <Textarea
                                id="new-beginner-objectives"
                                value={newIndustryDifficultySettings.beginner.objectives}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    beginner: {
                                      ...newIndustryDifficultySettings.beginner,
                                      objectives: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-beginner-behavior">Client Behavior</Label>
                              <Textarea
                                id="new-beginner-behavior"
                                value={newIndustryDifficultySettings.beginner.clientBehavior}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    beginner: {
                                      ...newIndustryDifficultySettings.beginner,
                                      clientBehavior: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-beginner-scenario">Sample Scenario</Label>
                              <Textarea
                                id="new-beginner-scenario"
                                value={newIndustryDifficultySettings.beginner.sampleScenario}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    beginner: {
                                      ...newIndustryDifficultySettings.beginner,
                                      sampleScenario: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>

                            {/* Visible Client Details Section */}
                            <div className="space-y-2 pt-4 border-t">
                              <h4 className="font-medium">Visible Client Details</h4>
                              <p className="text-sm text-gray-500 mb-2">
                                Select which client details will be visible at this difficulty level
                              </p>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-name"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.name}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            name: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-name">Name</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-age"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.age}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            age: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-age">Age</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-family"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.familyStatus}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            familyStatus: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-family">Family Status</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-occupation"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.occupation}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            occupation: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-occupation">Occupation</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-income"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.income}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            income: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-income">Income</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-assets"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.assets}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            assets: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-assets">Assets</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-debt"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.debt}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            debt: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-debt">Debt</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-beginner-goals"
                                    checked={newIndustryDifficultySettings.beginner.visibleDetails.primaryGoals}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        beginner: {
                                          ...newIndustryDifficultySettings.beginner,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.beginner.visibleDetails,
                                            primaryGoals: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-beginner-goals">Primary Goals</Label>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="intermediate" className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-intermediate-description">Description</Label>
                              <Textarea
                                id="new-intermediate-description"
                                value={newIndustryDifficultySettings.intermediate.description}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    intermediate: {
                                      ...newIndustryDifficultySettings.intermediate,
                                      description: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-intermediate-objectives">Objectives</Label>
                              <Textarea
                                id="new-intermediate-objectives"
                                value={newIndustryDifficultySettings.intermediate.objectives}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    intermediate: {
                                      ...newIndustryDifficultySettings.intermediate,
                                      objectives: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-intermediate-behavior">Client Behavior</Label>
                              <Textarea
                                id="new-intermediate-behavior"
                                value={newIndustryDifficultySettings.intermediate.clientBehavior}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    intermediate: {
                                      ...newIndustryDifficultySettings.intermediate,
                                      clientBehavior: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-intermediate-scenario">Sample Scenario</Label>
                              <Textarea
                                id="new-intermediate-scenario"
                                value={newIndustryDifficultySettings.intermediate.sampleScenario}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    intermediate: {
                                      ...newIndustryDifficultySettings.intermediate,
                                      sampleScenario: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>

                            {/* Visible Client Details Section */}
                            <div className="space-y-2 pt-4 border-t">
                              <h4 className="font-medium">Visible Client Details</h4>
                              <p className="text-sm text-gray-500 mb-2">
                                Select which client details will be visible at this difficulty level
                              </p>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Similar checkboxes as above but for intermediate level */}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-name"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.name}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            name: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-name">Name</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-age"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.age}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            age: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-age">Age</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-family"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.familyStatus}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            familyStatus: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-family">Family Status</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-occupation"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.occupation}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            occupation: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-occupation">Occupation</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-income"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.income}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            income: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-income">Income</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-assets"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.assets}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            assets: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-assets">Assets</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-debt"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.debt}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            debt: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-debt">Debt</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-intermediate-goals"
                                    checked={newIndustryDifficultySettings.intermediate.visibleDetails.primaryGoals}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        intermediate: {
                                          ...newIndustryDifficultySettings.intermediate,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.intermediate.visibleDetails,
                                            primaryGoals: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-intermediate-goals">Primary Goals</Label>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="advanced" className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-advanced-description">Description</Label>
                              <Textarea
                                id="new-advanced-description"
                                value={newIndustryDifficultySettings.advanced.description}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    advanced: {
                                      ...newIndustryDifficultySettings.advanced,
                                      description: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-advanced-objectives">Objectives</Label>
                              <Textarea
                                id="new-advanced-objectives"
                                value={newIndustryDifficultySettings.advanced.objectives}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    advanced: {
                                      ...newIndustryDifficultySettings.advanced,
                                      objectives: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-advanced-behavior">Client Behavior</Label>
                              <Textarea
                                id="new-advanced-behavior"
                                value={newIndustryDifficultySettings.advanced.clientBehavior}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    advanced: {
                                      ...newIndustryDifficultySettings.advanced,
                                      clientBehavior: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-advanced-scenario">Sample Scenario</Label>
                              <Textarea
                                id="new-advanced-scenario"
                                value={newIndustryDifficultySettings.advanced.sampleScenario}
                                onChange={(e) =>
                                  setNewIndustryDifficultySettings({
                                    ...newIndustryDifficultySettings,
                                    advanced: {
                                      ...newIndustryDifficultySettings.advanced,
                                      sampleScenario: e.target.value,
                                    },
                                  })
                                }
                                className="min-h-[80px]"
                              />
                            </div>

                            {/* Visible Client Details Section */}
                            <div className="space-y-2 pt-4 border-t">
                              <h4 className="font-medium">Visible Client Details</h4>
                              <p className="text-sm text-gray-500 mb-2">
                                Select which client details will be visible at this difficulty level
                              </p>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Similar checkboxes as above but for advanced level */}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-name"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.name}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            name: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-name">Name</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-age"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.age}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            age: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-age">Age</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-family"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.familyStatus}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            familyStatus: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-family">Family Status</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-occupation"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.occupation}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            occupation: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-occupation">Occupation</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-income"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.income}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            income: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-income">Income</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-assets"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.assets}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            assets: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-assets">Assets</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-debt"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.debt}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            debt: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-debt">Debt</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="new-advanced-goals"
                                    checked={newIndustryDifficultySettings.advanced.visibleDetails.primaryGoals}
                                    onCheckedChange={(checked) =>
                                      setNewIndustryDifficultySettings({
                                        ...newIndustryDifficultySettings,
                                        advanced: {
                                          ...newIndustryDifficultySettings.advanced,
                                          visibleDetails: {
                                            ...newIndustryDifficultySettings.advanced.visibleDetails,
                                            primaryGoals: checked === true,
                                          },
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor="new-advanced-goals">Primary Goals</Label>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  </div>
                  <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t">
                    <Button onClick={handleAddIndustry} disabled={isAddingIndustry}>
                      {isAddingIndustry ? "Adding..." : "Add Industry"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Industry Selection section */}
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <div className="flex items-center space-x-2">
                  <Select value={selectedIndustry} onValueChange={handleIndustryChange} className="flex-1">
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.id} className="flex justify-between items-center">
                          {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const industry = industries.find((i) => i.id === selectedIndustry)
                          if (industry) handleEditIndustry(industry)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Industry
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteIndustry(selectedIndustry)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Industry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Subcategory Selection section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Subcategory</DialogTitle>
                        <DialogDescription>Create a new subcategory for the selected industry.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="subcategory-name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="subcategory-name"
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            className="col-span-3"
                            placeholder="High Net Worth"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddSubcategory} disabled={isAddingSubcategory}>
                          {isAddingSubcategory ? "Adding..." : "Add Subcategory"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {subcategories.length > 0 ? (
                  <div className="flex items-center space-x-2">
                    <Select
                      value={selectedSubcategory || ""}
                      onValueChange={handleSubcategoryChange}
                      className="flex-1"
                    >
                      <SelectTrigger id="subcategory">
                        <SelectValue placeholder="Select Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSubcategory && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const subcategory = subcategories.find((s) => s.id === selectedSubcategory)
                              if (subcategory) handleEditSubcategory(subcategory)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Subcategory
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSubcategory(selectedSubcategory)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Subcategory
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    No subcategories available for this industry.
                  </div>
                )}
              </div>

              {/* Focus Areas Section */}
              <div className="pt-4 mt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Focus Areas</h3>
                  {selectedSubcategory && (
                    <Dialog open={isFocusAreaDialogOpen} onOpenChange={setIsFocusAreaDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Focus Area</DialogTitle>
                          <DialogDescription>Create a new focus area for the selected subcategory.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="focus-area-name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="focus-area-name"
                              value={newFocusAreaName}
                              onChange={(e) => setNewFocusAreaName(e.target.value)}
                              className="col-span-3"
                              placeholder="Retirement Planning"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAddFocusArea} disabled={isAddingFocusArea}>
                            {isAddingFocusArea ? "Adding..." : "Add Focus Area"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">Available focus areas for this subcategory</p>

                {isLoading ? (
                  <div className="py-2 text-center text-gray-500 text-sm">Loading focus areas...</div>
                ) : !selectedSubcategory ? (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    No focus areas available for this industry.
                  </div>
                ) : focusAreas.length > 0 ? (
                  <ul className="space-y-2">
                    {focusAreas.map((area) => (
                      <li
                        key={area.id}
                        className="flex items-center justify-between text-sm px-2 py-1.5 bg-gray-50 rounded-md"
                      >
                        <span>{area.name}</span>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditFocusArea(area)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={() => handleDeleteFocusArea(area.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-2 text-gray-500 text-sm">
                    No focus areas available for this subcategory.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Competency Selection</CardTitle>
              <CardDescription>Select which competencies apply</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-4 text-center text-gray-500">Loading competencies...</div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">
                      {!selectedSubcategory
                        ? "Configuring competencies at the industry level. These will apply to all subcategories."
                        : `Configuring competencies for the selected ${selectedSubcategory} subcategory.`}
                    </p>
                  </div>
                  {competencies.map((competency) => (
                    <div key={competency.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={competency.id}
                        checked={selectedCompetencies.includes(competency.id)}
                        onCheckedChange={(checked) => handleCompetencyChange(competency.id, checked === true)}
                      />
                      <Label
                        htmlFor={competency.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {competency.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Difficulty Levels</CardTitle>
                <CardDescription>
                  Configure difficulty settings for{" "}
                  {selectedIndustry === "insurance"
                    ? `Insurance - ${selectedSubcategory === "life-health" ? "Life & Health" : "Property & Casualty"}`
                    : selectedIndustry}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleEditDifficulty}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="beginner" value={selectedDifficultyTab} onValueChange={setSelectedDifficultyTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="beginner">Beginner</TabsTrigger>
                  <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {difficultySettings[selectedIndustry] ? (
                  <>
                    <TabsContent value="beginner" className="space-y-4 pt-4">
                      <div>
                        <h3 className="font-medium">Description</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].beginner.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Objectives</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].beginner.objectives}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Client Behavior</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].beginner.clientBehavior}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Sample Scenario</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].beginner.sampleScenario}
                        </p>
                      </div>

                      {/* Visible Client Details Section */}
                      <div className="pt-4 mt-2 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Visible Client Details</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                handleSaveVisibleDetails("beginner", {
                                  ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                  name: true, // Name is always visible
                                  age: !difficultySettings[selectedIndustry].beginner.visibleDetails.age,
                                  familyStatus:
                                    !difficultySettings[selectedIndustry].beginner.visibleDetails.familyStatus,
                                  occupation: !difficultySettings[selectedIndustry].beginner.visibleDetails.occupation,
                                  income: !difficultySettings[selectedIndustry].beginner.visibleDetails.income,
                                  assets: !difficultySettings[selectedIndustry].beginner.visibleDetails.assets,
                                  debt: !difficultySettings[selectedIndustry].beginner.visibleDetails.debt,
                                  primaryGoals:
                                    !difficultySettings[selectedIndustry].beginner.visibleDetails.primaryGoals,
                                })
                              }
                            }}
                          >
                            Toggle All
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Select which client details will be visible at this difficulty level
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-name"
                              checked={difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.name ?? true}
                              disabled={true} // Name is always visible
                            />
                            <Label htmlFor="beginner-name">Name</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-age"
                              checked={difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.age ?? true}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                  handleSaveVisibleDetails("beginner", {
                                    ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                    age: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="beginner-age">Age</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-family"
                              checked={
                                difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.familyStatus ?? true
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                  handleSaveVisibleDetails("beginner", {
                                    ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                    familyStatus: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="beginner-family">Family Status</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-occupation"
                              checked={
                                difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.occupation ?? true
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                  handleSaveVisibleDetails("beginner", {
                                    ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                    occupation: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="beginner-occupation">Occupation</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-income"
                              checked={difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.income ?? true}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                  handleSaveVisibleDetails("beginner", {
                                    ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                    income: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="beginner-income">Income</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-assets"
                              checked={difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.assets ?? true}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                  handleSaveVisibleDetails("beginner", {
                                    ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                    assets: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="beginner-assets">Assets</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-debt"
                              checked={difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.debt ?? true}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                  handleSaveVisibleDetails("beginner", {
                                    ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                    debt: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="beginner-debt">Debt</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="beginner-goals"
                              checked={
                                difficultySettings[selectedIndustry]?.beginner?.visibleDetails?.primaryGoals ?? true
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.beginner?.visibleDetails) {
                                  handleSaveVisibleDetails("beginner", {
                                    ...difficultySettings[selectedIndustry].beginner.visibleDetails,
                                    primaryGoals: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="beginner-goals">Primary Goals</Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="intermediate" className="space-y-4 pt-4">
                      <div>
                        <h3 className="font-medium">Description</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].intermediate.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Objectives</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].intermediate.objectives}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Client Behavior</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].intermediate.clientBehavior}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Sample Scenario</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].intermediate.sampleScenario}
                        </p>
                      </div>

                      {/* Visible Client Details Section */}
                      <div className="pt-4 mt-2 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Visible Client Details</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                handleSaveVisibleDetails("intermediate", {
                                  ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                  name: true, // Name is always visible
                                  age: !difficultySettings[selectedIndustry].intermediate.visibleDetails.age,
                                  familyStatus:
                                    !difficultySettings[selectedIndustry].intermediate.visibleDetails.familyStatus,
                                  occupation:
                                    !difficultySettings[selectedIndustry].intermediate.visibleDetails.occupation,
                                  income: !difficultySettings[selectedIndustry].intermediate.visibleDetails.income,
                                  assets: !difficultySettings[selectedIndustry].intermediate.visibleDetails.assets,
                                  debt: !difficultySettings[selectedIndustry].intermediate.visibleDetails.debt,
                                  primaryGoals:
                                    !difficultySettings[selectedIndustry].intermediate.visibleDetails.primaryGoals,
                                })
                              }
                            }}
                          >
                            Toggle All
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Select which client details will be visible at this difficulty level
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-name"
                              checked={difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.name ?? true}
                              disabled={true} // Name is always visible
                            />
                            <Label htmlFor="intermediate-name">Name</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-age"
                              checked={difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.age ?? true}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                  handleSaveVisibleDetails("intermediate", {
                                    ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                    age: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="intermediate-age">Age</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-family"
                              checked={
                                difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.familyStatus ?? true
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                  handleSaveVisibleDetails("intermediate", {
                                    ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                    familyStatus: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="intermediate-family">Family Status</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-occupation"
                              checked={
                                difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.occupation ?? true
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                  handleSaveVisibleDetails("intermediate", {
                                    ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                    occupation: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="intermediate-occupation">Occupation</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-income"
                              checked={
                                difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.income ?? false
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                  handleSaveVisibleDetails("intermediate", {
                                    ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                    income: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="intermediate-income">Income</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-assets"
                              checked={
                                difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.assets ?? false
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                  handleSaveVisibleDetails("intermediate", {
                                    ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                    assets: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="intermediate-assets">Assets</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-debt"
                              checked={
                                difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.debt ?? false
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                  handleSaveVisibleDetails("intermediate", {
                                    ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                    debt: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="intermediate-debt">Debt</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="intermediate-goals"
                              checked={
                                difficultySettings[selectedIndustry]?.intermediate?.visibleDetails?.primaryGoals ??
                                false
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.intermediate?.visibleDetails) {
                                  handleSaveVisibleDetails("intermediate", {
                                    ...difficultySettings[selectedIndustry].intermediate.visibleDetails,
                                    primaryGoals: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="intermediate-goals">Primary Goals</Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4 pt-4">
                      <div>
                        <h3 className="font-medium">Description</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].advanced.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Objectives</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].advanced.objectives}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Client Behavior</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].advanced.clientBehavior}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-medium">Sample Scenario</h3>
                        <p className="text-sm text-gray-500">
                          {difficultySettings[selectedIndustry].advanced.sampleScenario}
                        </p>
                      </div>

                      {/* Visible Client Details Section */}
                      <div className="pt-4 mt-2 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Visible Client Details</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                handleSaveVisibleDetails("advanced", {
                                  ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                  name: true, // Name is always visible
                                  age: !difficultySettings[selectedIndustry].advanced.visibleDetails.age,
                                  familyStatus:
                                    !difficultySettings[selectedIndustry].advanced.visibleDetails.familyStatus,
                                  occupation: !difficultySettings[selectedIndustry].advanced.visibleDetails.occupation,
                                  income: !difficultySettings[selectedIndustry].advanced.visibleDetails.income,
                                  assets: !difficultySettings[selectedIndustry].advanced.visibleDetails.assets,
                                  debt: !difficultySettings[selectedIndustry].advanced.visibleDetails.debt,
                                  primaryGoals:
                                    !difficultySettings[selectedIndustry].advanced.visibleDetails.primaryGoals,
                                })
                              }
                            }}
                          >
                            Toggle All
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Select which client details will be visible at this difficulty level
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-name"
                              checked={difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.name ?? true}
                              disabled={true} // Name is always visible
                            />
                            <Label htmlFor="advanced-name">Name</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-age"
                              checked={difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.age ?? false}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                  handleSaveVisibleDetails("advanced", {
                                    ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                    age: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="advanced-age">Age</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-family"
                              checked={
                                difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.familyStatus ?? false
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                  handleSaveVisibleDetails("advanced", {
                                    ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                    familyStatus: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="advanced-family">Family Status</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-occupation"
                              checked={
                                difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.occupation ?? false
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                  handleSaveVisibleDetails("advanced", {
                                    ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                    occupation: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="advanced-occupation">Occupation</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-income"
                              checked={difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.income ?? false}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                  handleSaveVisibleDetails("advanced", {
                                    ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                    income: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="advanced-income">Income</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-assets"
                              checked={difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.assets ?? false}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                  handleSaveVisibleDetails("advanced", {
                                    ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                    assets: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="advanced-assets">Assets</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-debt"
                              checked={difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.debt ?? false}
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                  handleSaveVisibleDetails("advanced", {
                                    ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                    debt: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="advanced-debt">Debt</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="advanced-goals"
                              checked={
                                difficultySettings[selectedIndustry]?.advanced?.visibleDetails?.primaryGoals ?? false
                              }
                              onCheckedChange={(checked) => {
                                if (difficultySettings[selectedIndustry]?.advanced?.visibleDetails) {
                                  handleSaveVisibleDetails("advanced", {
                                    ...difficultySettings[selectedIndustry].advanced.visibleDetails,
                                    primaryGoals: checked === true,
                                  })
                                }
                              }}
                            />
                            <Label htmlFor="advanced-goals">Primary Goals</Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">No difficulty settings found for this industry.</div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Industry Edit Dialog */}
      <Dialog open={isEditingIndustry} onOpenChange={(open) => setIsEditingIndustry(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Industry</DialogTitle>
            <DialogDescription>Update the industry details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-industry-id" className="text-right">
                ID
              </Label>
              <Input
                id="edit-industry-id"
                value={editIndustryId}
                onChange={(e) => setEditIndustryId(e.target.value)}
                className="col-span-3"
                placeholder="accountancy"
                disabled={true} // ID cannot be changed after creation
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-industry-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-industry-name"
                value={editIndustryName}
                onChange={(e) => setEditIndustryName(e.target.value)}
                className="col-span-3"
                placeholder="Accountancy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateIndustry}>Update Industry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Edit Dialog */}
      <Dialog open={isEditingSubcategory} onOpenChange={(open) => setIsEditingSubcategory(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
            <DialogDescription>Update the subcategory details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subcategory-id" className="text-right">
                ID
              </Label>
              <Input
                id="edit-subcategory-id"
                value={editSubcategoryId}
                onChange={(e) => setEditSubcategoryId(e.target.value)}
                className="col-span-3"
                placeholder="high-net-worth"
                disabled={true} // ID cannot be changed after creation
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subcategory-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-subcategory-name"
                value={editSubcategoryName}
                onChange={(e) => setEditSubcategoryName(e.target.value)}
                className="col-span-3"
                placeholder="High Net Worth"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateSubcategory}>Update Subcategory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Focus Area Edit Dialog */}
      <Dialog open={isEditingFocusArea} onOpenChange={(open) => setIsEditingFocusArea(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Focus Area</DialogTitle>
            <DialogDescription>Update the focus area details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-focus-area-id" className="text-right">
                ID
              </Label>
              <Input
                id="edit-focus-area-id"
                value={editFocusAreaId}
                onChange={(e) => setEditFocusAreaId(e.target.value)}
                className="col-span-3"
                placeholder="retirement-planning"
                disabled={true} // ID cannot be changed after creation
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-focus-area-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-focus-area-name"
                value={editFocusAreaName}
                onChange={(e) => setEditFocusAreaName(e.target.value)}
                className="col-span-3"
                placeholder="Retirement Planning"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateFocusArea}>Update Focus Area</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Difficulty Settings Edit Dialog */}
      <Dialog open={isEditingDifficulty} onOpenChange={(open) => setIsEditingDifficulty(open)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Difficulty Settings</DialogTitle>
            <DialogDescription>Update the difficulty settings for this industry.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateDifficultySettings(false)}
              disabled={isGeneratingDifficulty}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              {isGeneratingDifficulty ? "Generating..." : "Generate with AI"}
            </Button>
          </div>
          {editedDifficultySettings && (
            <Tabs defaultValue="beginner" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="beginner">Beginner</TabsTrigger>
                <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="beginner" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-beginner-description">Description</Label>
                  <Textarea
                    id="edit-beginner-description"
                    value={editedDifficultySettings.beginner.description}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        beginner: {
                          ...editedDifficultySettings.beginner,
                          description: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-beginner-objectives">Objectives</Label>
                  <Textarea
                    id="edit-beginner-objectives"
                    value={editedDifficultySettings.beginner.objectives}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        beginner: {
                          ...editedDifficultySettings.beginner,
                          objectives: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-beginner-behavior">Client Behavior</Label>
                  <Textarea
                    id="edit-beginner-behavior"
                    value={editedDifficultySettings.beginner.clientBehavior}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        beginner: {
                          ...editedDifficultySettings.beginner,
                          clientBehavior: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-beginner-scenario">Sample Scenario</Label>
                  <Textarea
                    id="edit-beginner-scenario"
                    value={editedDifficultySettings.beginner.sampleScenario}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        beginner: {
                          ...editedDifficultySettings.beginner,
                          sampleScenario: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>

                {/* Visible Client Details Section */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Visible Client Details</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Select which client details will be visible at this difficulty level
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-name"
                        checked={editedDifficultySettings.beginner.visibleDetails?.name ?? true}
                        disabled={true} // Name is always visible
                      />
                      <Label htmlFor="edit-beginner-name">Name</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-age"
                        checked={editedDifficultySettings.beginner.visibleDetails?.age ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            beginner: {
                              ...editedDifficultySettings.beginner,
                              visibleDetails: {
                                ...editedDifficultySettings.beginner.visibleDetails,
                                age: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-beginner-age">Age</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-family"
                        checked={editedDifficultySettings.beginner.visibleDetails?.familyStatus ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            beginner: {
                              ...editedDifficultySettings.beginner,
                              visibleDetails: {
                                ...editedDifficultySettings.beginner.visibleDetails,
                                familyStatus: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-beginner-family">Family Status</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-occupation"
                        checked={editedDifficultySettings.beginner.visibleDetails?.occupation ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            beginner: {
                              ...editedDifficultySettings.beginner,
                              visibleDetails: {
                                ...editedDifficultySettings.beginner.visibleDetails,
                                occupation: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-beginner-occupation">Occupation</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-income"
                        checked={editedDifficultySettings.beginner.visibleDetails?.income ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            beginner: {
                              ...editedDifficultySettings.beginner,
                              visibleDetails: {
                                ...editedDifficultySettings.beginner.visibleDetails,
                                income: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-beginner-income">Income</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-assets"
                        checked={editedDifficultySettings.beginner.visibleDetails?.assets ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            beginner: {
                              ...editedDifficultySettings.beginner,
                              visibleDetails: {
                                ...editedDifficultySettings.beginner.visibleDetails,
                                assets: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-beginner-assets">Assets</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-debt"
                        checked={editedDifficultySettings.beginner.visibleDetails?.debt ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            beginner: {
                              ...editedDifficultySettings.beginner,
                              visibleDetails: {
                                ...editedDifficultySettings.beginner.visibleDetails,
                                debt: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-beginner-debt">Debt</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-beginner-goals"
                        checked={editedDifficultySettings.beginner.visibleDetails?.primaryGoals ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            beginner: {
                              ...editedDifficultySettings.beginner,
                              visibleDetails: {
                                ...editedDifficultySettings.beginner.visibleDetails,
                                primaryGoals: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-beginner-goals">Primary Goals</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="intermediate" className="space-y-4 pt-4">
                {/* Similar structure as beginner but for intermediate level */}
                <div className="space-y-2">
                  <Label htmlFor="edit-intermediate-description">Description</Label>
                  <Textarea
                    id="edit-intermediate-description"
                    value={editedDifficultySettings.intermediate.description}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        intermediate: {
                          ...editedDifficultySettings.intermediate,
                          description: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-intermediate-objectives">Objectives</Label>
                  <Textarea
                    id="edit-intermediate-objectives"
                    value={editedDifficultySettings.intermediate.objectives}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        intermediate: {
                          ...editedDifficultySettings.intermediate,
                          objectives: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-intermediate-behavior">Client Behavior</Label>
                  <Textarea
                    id="edit-intermediate-behavior"
                    value={editedDifficultySettings.intermediate.clientBehavior}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        intermediate: {
                          ...editedDifficultySettings.intermediate,
                          clientBehavior: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-intermediate-scenario">Sample Scenario</Label>
                  <Textarea
                    id="edit-intermediate-scenario"
                    value={editedDifficultySettings.intermediate.sampleScenario}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        intermediate: {
                          ...editedDifficultySettings.intermediate,
                          sampleScenario: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>

                {/* Visible Client Details Section for Intermediate */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Visible Client Details</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Select which client details will be visible at this difficulty level
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Similar checkboxes as beginner but for intermediate level */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-name"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.name ?? true}
                        disabled={true} // Name is always visible
                      />
                      <Label htmlFor="edit-intermediate-name">Name</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-age"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.age ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            intermediate: {
                              ...editedDifficultySettings.intermediate,
                              visibleDetails: {
                                ...editedDifficultySettings.intermediate.visibleDetails,
                                age: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-intermediate-age">Age</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-family"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.familyStatus ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            intermediate: {
                              ...editedDifficultySettings.intermediate,
                              visibleDetails: {
                                ...editedDifficultySettings.intermediate.visibleDetails,
                                familyStatus: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-intermediate-family">Family Status</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-occupation"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.occupation ?? true}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            intermediate: {
                              ...editedDifficultySettings.intermediate,
                              visibleDetails: {
                                ...editedDifficultySettings.intermediate.visibleDetails,
                                occupation: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-intermediate-occupation">Occupation</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-income"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.income ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            intermediate: {
                              ...editedDifficultySettings.intermediate,
                              visibleDetails: {
                                ...editedDifficultySettings.intermediate.visibleDetails,
                                income: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-intermediate-income">Income</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-assets"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.assets ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            intermediate: {
                              ...editedDifficultySettings.intermediate,
                              visibleDetails: {
                                ...editedDifficultySettings.intermediate.visibleDetails,
                                assets: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-intermediate-assets">Assets</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-debt"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.debt ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            intermediate: {
                              ...editedDifficultySettings.intermediate,
                              visibleDetails: {
                                ...editedDifficultySettings.intermediate.visibleDetails,
                                debt: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-intermediate-debt">Debt</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-intermediate-goals"
                        checked={editedDifficultySettings.intermediate.visibleDetails?.primaryGoals ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            intermediate: {
                              ...editedDifficultySettings.intermediate,
                              visibleDetails: {
                                ...editedDifficultySettings.intermediate.visibleDetails,
                                primaryGoals: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-intermediate-goals">Primary Goals</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                {/* Similar structure as beginner but for advanced level */}
                <div className="space-y-2">
                  <Label htmlFor="edit-advanced-description">Description</Label>
                  <Textarea
                    id="edit-advanced-description"
                    value={editedDifficultySettings.advanced.description}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        advanced: {
                          ...editedDifficultySettings.advanced,
                          description: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-advanced-objectives">Objectives</Label>
                  <Textarea
                    id="edit-advanced-objectives"
                    value={editedDifficultySettings.advanced.objectives}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        advanced: {
                          ...editedDifficultySettings.advanced,
                          objectives: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-advanced-behavior">Client Behavior</Label>
                  <Textarea
                    id="edit-advanced-behavior"
                    value={editedDifficultySettings.advanced.clientBehavior}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        advanced: {
                          ...editedDifficultySettings.advanced,
                          clientBehavior: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-advanced-scenario">Sample Scenario</Label>
                  <Textarea
                    id="edit-advanced-scenario"
                    value={editedDifficultySettings.advanced.sampleScenario}
                    onChange={(e) =>
                      setEditedDifficultySettings({
                        ...editedDifficultySettings,
                        advanced: {
                          ...editedDifficultySettings.advanced,
                          sampleScenario: e.target.value,
                        },
                      })
                    }
                    className="min-h-[80px]"
                  />
                </div>

                {/* Visible Client Details Section for Advanced */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Visible Client Details</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Select which client details will be visible at this difficulty level
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-name"
                        checked={editedDifficultySettings.advanced.visibleDetails?.name ?? true}
                        disabled={true} // Name is always visible
                      />
                      <Label htmlFor="edit-advanced-name">Name</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-age"
                        checked={editedDifficultySettings.advanced.visibleDetails?.age ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            advanced: {
                              ...editedDifficultySettings.advanced,
                              visibleDetails: {
                                ...editedDifficultySettings.advanced.visibleDetails,
                                age: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-advanced-age">Age</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-family"
                        checked={editedDifficultySettings.advanced.visibleDetails?.familyStatus ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            advanced: {
                              ...editedDifficultySettings.advanced,
                              visibleDetails: {
                                ...editedDifficultySettings.advanced.visibleDetails,
                                familyStatus: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-advanced-family">Family Status</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-occupation"
                        checked={editedDifficultySettings.advanced.visibleDetails?.occupation ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            advanced: {
                              ...editedDifficultySettings.advanced,
                              visibleDetails: {
                                ...editedDifficultySettings.advanced.visibleDetails,
                                occupation: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-advanced-occupation">Occupation</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-income"
                        checked={editedDifficultySettings.advanced.visibleDetails?.income ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            advanced: {
                              ...editedDifficultySettings.advanced,
                              visibleDetails: {
                                ...editedDifficultySettings.advanced.visibleDetails,
                                income: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-advanced-income">Income</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-assets"
                        checked={editedDifficultySettings.advanced.visibleDetails?.assets ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            advanced: {
                              ...editedDifficultySettings.advanced,
                              visibleDetails: {
                                ...editedDifficultySettings.advanced.visibleDetails,
                                assets: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-advanced-assets">Assets</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-debt"
                        checked={editedDifficultySettings.advanced.visibleDetails?.debt ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            advanced: {
                              ...editedDifficultySettings.advanced,
                              visibleDetails: {
                                ...editedDifficultySettings.advanced.visibleDetails,
                                debt: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-advanced-debt">Debt</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-advanced-goals"
                        checked={editedDifficultySettings.advanced.visibleDetails?.primaryGoals ?? false}
                        onCheckedChange={(checked) =>
                          setEditedDifficultySettings({
                            ...editedDifficultySettings,
                            advanced: {
                              ...editedDifficultySettings.advanced,
                              visibleDetails: {
                                ...editedDifficultySettings.advanced.visibleDetails,
                                primaryGoals: checked === true,
                              },
                            },
                          })
                        }
                      />
                      <Label htmlFor="edit-advanced-goals">Primary Goals</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t">
            <Button onClick={handleSaveDifficulty}>Save Difficulty Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
