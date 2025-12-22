"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateSimulationId } from "@/app/api/simulation/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient } from "@/lib/api"

type FocusArea = {
  id: string
  name: string
  enabled: boolean
}

type DifficultyLevel = {
  key: string
  label: string
  description: string
}

type IndustryMetadata = {
  [key: string]: {
    subcategories: {
      [key: string]: {
        focusAreas: FocusArea[]
        displayName?: string
      }
    }
  }
}

type IndustryCompetencies = {
  [key: string]: {
    [key: string]: {
      competencies: string[]
    } | string[]
  }
}

interface IndustrySelectionClientProps {
  initialDifficultyLevels: DifficultyLevel[]
}

export default function IndustrySelectionClient({ initialDifficultyLevels }: IndustrySelectionClientProps) {
  const router = useRouter()
  const [selectedIndustry, setSelectedIndustry] = useState("insurance")
  const [selectedSubcategory, setSelectedSubcategory] = useState("life-health")
  const [selectedDifficulty, setSelectedDifficulty] = useState("beginner")
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])
  const [simulationId, setSimulationId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [industryCompetencies, setIndustryCompetencies] = useState<IndustryCompetencies>({})
  const [allCompetencies, setAllCompetencies] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState([
    { id: "life-health", name: "Life & Health" },
    { id: "property-casualty", name: "Property & Casualty" },
  ])
  const [industryMetadata, setIndustryMetadata] = useState<IndustryMetadata>({})

  const industries = [
    { id: "insurance", name: "Insurance", hasSubcategories: true },
    { id: "wealth-management", name: "Wealth Management", hasSubcategories: false },
    { id: "securities", name: "Securities", hasSubcategories: false },
  ]

  // Function to format focus area names
  const formatFocusAreaName = (id: string): string => {
    // First check if we have the focus area in the industry metadata
    if (
      industryMetadata &&
      industryMetadata[selectedIndustry] &&
      industryMetadata[selectedIndustry].subcategories &&
      industryMetadata[selectedIndustry].subcategories[selectedSubcategory] &&
      industryMetadata[selectedIndustry].subcategories[selectedSubcategory].focusAreas
    ) {
      const focusAreaMetadata = industryMetadata[selectedIndustry].subcategories[selectedSubcategory].focusAreas
      const focusArea = focusAreaMetadata.find((area: FocusArea) => area.id === id)
      if (focusArea && focusArea.name) {
        return focusArea.name
      }
    }

    // Fallback to the hardcoded map if not found in metadata
    const focusAreaNames: Record<string, string> = {
      "life-insurance": "Life Insurance",
      "annuities": "Annuities",
      "long-term-care": "Long-term Care Insurance",
      "medical-expense": "Medical Expense (including Medicare supplements)",
      "disability-insurance": "Disability Insurance",
      "homeowners-insurance": "Homeowners Insurance",
      "automobile-insurance": "Automobile Insurance",
    }

    // Return the mapped name if it exists, otherwise format the ID
    return (
      focusAreaNames[id] ||
      id
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
  }

  // Load industry competencies and all competencies
  useEffect(() => {
    const loadCompetencies = async () => {
      try {
        // Use server-side fetching for industry competencies
        const response = await apiClient.get("/api/competencies/industry")
        setIndustryCompetencies(response?.data?.industryCompetencies || response?.industryCompetencies || {})
        setIndustryMetadata(response?.data?.industryMetadata || response?.industryMetadata || {})

        // Fetch all competencies
        const compResponse = await apiClient.get("/api/competencies")
        // Handle both response formats: axios wrapped (.data.competencies) and direct (.competencies)
        const competencies = compResponse?.data?.competencies || compResponse?.competencies || []
        setAllCompetencies(competencies)
      } catch (error) {
        console.error("Error loading competencies:", error)
      }
    }

    loadCompetencies()
  }, [])

  // Load focus areas when industry or subcategory changes
  useEffect(() => {
    const loadFocusAreas = async () => {
      try {
        const response = await apiClient.get(
          `/api/industry-settings?industry=${selectedIndustry}&subcategory=${selectedSubcategory}`,
        )
        if (response.data.focusAreas && Array.isArray(response.data.focusAreas)) {
          // Only show enabled focus areas
          const enabledFocusAreas = response.data.focusAreas.filter((area: FocusArea) => area.enabled)

          // Map the focus areas to include proper display names
          const formattedFocusAreas = enabledFocusAreas.map((area: FocusArea) => ({
            ...area,
            name: formatFocusAreaName(area.id),
          }))

          setFocusAreas(formattedFocusAreas)

          // Clear selected focus areas when changing industry/subcategory
          setSelectedFocusAreas([])

          // Inside the loadFocusAreas function, after setting the focusAreas state
          console.log("Loaded focus areas:", formattedFocusAreas)
        } else {
          setFocusAreas([])
        }
      } catch (error) {
        console.error("Error loading focus areas:", error)
      }
    }

    if (selectedIndustry === "insurance") {
      loadFocusAreas()
    } else {
      setFocusAreas([])
      setSelectedFocusAreas([])
    }
  }, [selectedIndustry, selectedSubcategory, industryMetadata])

  useEffect(() => {
    const getSimulationId = async () => {
      const id = await generateSimulationId()
      setSimulationId(id)
      // Store in session storage for persistence across pages
      sessionStorage.setItem("currentSimulationId", id)
    }

    getSimulationId()
  }, [])

  const handleFocusAreaChange = (focusAreaId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFocusAreas((prev) => [...prev, focusAreaId])
    } else {
      setSelectedFocusAreas((prev) => prev.filter((id) => id !== focusAreaId))
    }
  }

  const handleSelectAllFocusAreas = () => {
    if (selectedFocusAreas.length === focusAreas.length) {
      // If all are selected, deselect all
      setSelectedFocusAreas([])
    } else {
      // Otherwise, select all
      setSelectedFocusAreas(focusAreas.map((area) => area.id))
    }
  }

  const handleContinue = () => {
    setIsLoading(true)

    // Get competencies for the selected industry/subcategory
    let competencyIds: string[] = []
    const subcategoryKey = selectedIndustry !== "insurance" ? "default" : selectedSubcategory

    if (industryCompetencies[selectedIndustry] && industryCompetencies[selectedIndustry][subcategoryKey]) {
      // Handle both old and new data structures
      if (Array.isArray(industryCompetencies[selectedIndustry][subcategoryKey])) {
        // Old structure - direct array of competency IDs
        competencyIds = industryCompetencies[selectedIndustry][subcategoryKey] as string[]
      } else if (typeof industryCompetencies[selectedIndustry][subcategoryKey] === 'object' && 
                'competencies' in industryCompetencies[selectedIndustry][subcategoryKey]) {
        // New structure - object with competencies array
        competencyIds = (industryCompetencies[selectedIndustry][subcategoryKey] as { competencies: string[] }).competencies
      }
    }

    // Map competency IDs to full competency objects
    const selectedCompetencies = competencyIds
      .map((id) => allCompetencies.find((comp) => comp.id === id))
      .filter(Boolean)

    // Store selected options in session storage
    sessionStorage.setItem("selectedIndustry", selectedIndustry)
    sessionStorage.setItem("selectedSubcategory", selectedSubcategory)
    sessionStorage.setItem("selectedDifficulty", selectedDifficulty)
    sessionStorage.setItem("selectedCompetencies", JSON.stringify(selectedCompetencies))

    // Store selected focus areas with proper names
    const selectedFocusAreasWithNames = selectedFocusAreas.map((id) => {
      const area = focusAreas.find((a) => a.id === id)
      return { id, name: area?.name || formatFocusAreaName(id) }
    })

    console.log("Storing selected focus areas:", selectedFocusAreasWithNames)
    sessionStorage.setItem("selectedFocusAreas", JSON.stringify(selectedFocusAreasWithNames))

    // Navigate to the preview page with the simulation ID
    router.push(
      `/simulation/setup?simulationId=${simulationId}&industry=${selectedIndustry}&subcategory=${selectedSubcategory}&difficulty=${selectedDifficulty}`,
    )
  }

  // Add this useEffect to load subcategories dynamically
  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedIndustry) {
        try {
          const response = await apiClient.get(`/api/industry-settings?industry=${selectedIndustry}`)
          const data = response.data
          if (data.subcategory && data.industry) {
            // Extract subcategories from the response
            const industryData = await apiClient.get("/api/competencies/industry")
            const industryMetadata = industryData.data.industryMetadata || {}

            if (industryMetadata[selectedIndustry] && industryMetadata[selectedIndustry].subcategories) {
              const subcategoryData = industryMetadata[selectedIndustry].subcategories
              const subcategoryList = Object.keys(subcategoryData)
                .filter((id) => id !== "default" && id !== "industry-level")
                .map((id) => ({
                  id,
                  name:
                    subcategoryData[id].displayName ||
                    id
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" "),
                }))

              setSubcategories(subcategoryList)
            }
          }
        } catch (error) {
          console.error("Error loading subcategories:", error)
        }
      }
    }

    loadSubcategories()
  }, [selectedIndustry])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Industry Selection</h1>
        <p className="text-gray-500 mt-2">Choose the industry and difficulty for your simulation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Parameters</CardTitle>
          <CardDescription>Select the industry and difficulty level for your training simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={selectedIndustry}
                onValueChange={(value) => {
                  setSelectedIndustry(value)
                  if (value !== "insurance") {
                    setSelectedSubcategory("")
                  } else {
                    setSelectedSubcategory("life-health")
                  }
                }}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select Industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedIndustry === "insurance" && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories?.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Focus Areas Selection */}
            {selectedIndustry === "insurance" && focusAreas.length > 0 && (
              <div className="space-y-2">
                <Label>Focus Areas</Label>
                <Card className="border-dashed">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm text-gray-500">Select focus areas for your simulation:</div>
                      <Button variant="outline" size="sm" onClick={handleSelectAllFocusAreas} className="text-xs h-8">
                        {selectedFocusAreas.length === focusAreas.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {focusAreas.map((area) => (
                        <div key={area.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`focus-${area.id}`}
                            checked={selectedFocusAreas.includes(area.id)}
                            onCheckedChange={(checked) => handleFocusAreaChange(area.id, checked === true)}
                          />
                          <Label htmlFor={`focus-${area.id}`} className="text-sm font-medium leading-none">
                            {area.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedFocusAreas.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dashed">
                        <div className="flex items-center text-sm text-[rgb(35,15,110)]">
                          <Check className="h-4 w-4 mr-2" />
                          {selectedFocusAreas.length} focus area{selectedFocusAreas.length !== 1 ? "s" : ""} selected
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Difficulty Level</Label>
            <RadioGroup value={selectedDifficulty} onValueChange={setSelectedDifficulty} className="space-y-4">
              {initialDifficultyLevels.map((level) => (
                <div key={level.key} className="flex items-start space-x-2">
                  <RadioGroupItem value={level.key} id={level.key} className="mt-1" />
                  <div className="grid gap-1.5">
                    <Label htmlFor={level.key} className="font-medium">
                      {level.label}
                    </Label>
                    <p className="text-sm text-gray-500">{level.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/simulation/attestation">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button
            onClick={handleContinue}
            className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
            disabled={isLoading || !simulationId}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-50 border-t-transparent"></div>
                Loading...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 