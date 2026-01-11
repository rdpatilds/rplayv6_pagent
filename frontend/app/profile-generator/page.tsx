"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { generateProfile } from "./actions" // Server action that handles the AI generation
import { Copy, Check, Download, ChevronDown, ChevronUp, Settings, User, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"

// Add these imports at the top of the file
import { quirksTaxonomy } from "./quirks-taxonomy"
import { mapTraitsToProfiles } from "./trait-behavior-mapping"

export default function ProfileGenerator() {
  // ===== STATE MANAGEMENT =====
  // These state variables store the user-selected parameters that will be sent to the AI
  // In a production environment, these could be initialized from a database or API
  const [selectedIndustry, setIndustry] = useState("insurance") // Default industry selection
  const [selectedSubcategory, setSubIndustry] = useState("life-health") // Default subcategory
  const [subProduct, setProduct] = useState("Long-term Care") // Default sub-product for insurance
  const [difficulty, setDifficulty] = useState("beginner") // Default difficulty level
  const [complexity, setComplexity] = useState(50) // Profile complexity percentage (10-100)

  // Toggle switches for including different types of details in the generated profile
  const [includeFinancialDetails, setIncludeFinancialDetails] = useState(true)
  const [includeFamilyDetails, setIncludeFamilyDetails] = useState(true)
  const [includePersonalityTraits, setIncludePersonalityTraits] = useState(true)
  const [includeRecentEvents, setIncludeRecentEvents] = useState(true)

  // Add these new state variables after the existing ones
  const [ageGroup, setAgeGroup] = useState("any")
  const [communicationStyle, setCommunicationStyle] = useState("any")
  const [emotionalReactivity, setEmotionalReactivity] = useState(50)
  const [lifeStageContext, setLifeStageContext] = useState("any")
  const [culturalContext, setCulturalContext] = useState("any")

  // Add these state variables after the existing ones
  const [includeQuirks, setIncludeQuirks] = useState(true)
  const [selectedQuirks, setSelectedQuirks] = useState<string[]>([])
  const [autoSelectQuirks, setAutoSelectQuirks] = useState(true)
  const [quirkIntensity, setQuirkIntensity] = useState(50)

  // Industry settings state
  const [industryTraits, setIndustryTraits] = useState(null)
  const [isLoadingIndustryTraits, setIsLoadingIndustryTraits] = useState(false)

  // Focus areas state
  const [availableFocusAreas, setAvailableFocusAreas] = useState<{ id: string; name: string; enabled: boolean }[]>([])
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])
  const [isLoadingFocusAreas, setIsLoadingFocusAreas] = useState(false)
  const [subcategories, setSubcategories] = useState([
    { id: "life-health", name: "Life & Health" },
    { id: "property-casualty", name: "Property & Casualty" },
  ])

  // UI state management
  const [isGenerating, setIsGenerating] = useState(false) // Controls loading state during generation
  const [generatedProfile, setGeneratedProfile] = useState(null) // Stores the AI-generated profile
  const [showDetailedInfo, setShowDetailedInfo] = useState(true) // Controls visibility of detailed profile info
  const [isParametersPanelOpen, setIsParametersPanelOpen] = useState(true) // Controls parameters panel collapse state
  const [copied, setCopied] = useState(false) // Tracks if JSON has been copied to clipboard

  // Chat functionality state
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]) // Stores chat messages
  const [chatInput, setChatInput] = useState("") // Stores current chat input
  const [isSending, setIsSending] = useState(false) // Controls loading state during chat
  const messagesEndRef = useRef<HTMLDivElement>(null) // Reference for auto-scrolling chat

  // Inside the ProfileGenerator component, add these state variables
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState("")
  const [useCache, setUseCache] = useState(true)
  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([
    { id: "insurance", name: "Insurance" },
    { id: "wealth-management", name: "Wealth Management" },
    { id: "securities", name: "Securities" },
  ])

  // Add these new options
  const ageGroups = [
    { id: "young-adult", name: "Young Adult (20s-30s)" },
    { id: "midlife", name: "Midlife (40s-50s)" },
    { id: "pre-retirement", name: "Pre-Retirement (50s-60s)" },
    { id: "retired", name: "Retired (65+)" },
  ]

  const communicationStyles = [
    { id: "rambler", name: "The Rambler (Verbose, Tangential)" },
    { id: "sniper", name: "The Sniper (Direct, Blunt)" },
    { id: "overthinker", name: "The Overthinker (Hesitant, Analytical)" },
    { id: "optimist", name: "The Optimist (Positive, Enthusiastic)" },
    { id: "mistrustful", name: "The Mistrustful (Cautious, Questioning)" },
    { id: "balanced", name: "Balanced (Moderate, Adaptable)" },
  ]

  const lifeStageContexts = [
    { id: "career-focused", name: "Career-Focused" },
    { id: "family-building", name: "Family-Building" },
    { id: "empty-nester", name: "Empty-Nester" },
    { id: "retirement-planning", name: "Retirement Planning" },
    { id: "legacy-focused", name: "Legacy-Focused" },
  ]

  const culturalContexts = [
    { id: "mainstream", name: "Mainstream" },
    { id: "traditional", name: "Traditional Values" },
    { id: "progressive", name: "Progressive Outlook" },
    { id: "international", name: "International Perspective" },
    { id: "technical", name: "Technical Background" },
    { id: "academic", name: "Academic Background" },
  ]

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // Load industry data, traits and focus areas when industry or subIndustry changes
  useEffect(() => {
    const loadIndustryData = async () => {
      setIsLoadingIndustryTraits(true)
      setIsLoadingFocusAreas(true)

      try {
        // First, load all industries and their metadata
        const industryResponse = await fetch("/api/industry-settings")

        if (industryResponse.ok) {
          const data = await industryResponse.json()
          console.log("Industry settings response:", data)

          // Check if we have the expected data structure
          if (data && data.metadata && data.metadata.industry) {
            const industryMetadata = data.metadata.industry

            // Format industries for dropdown
            const industryList = Object.keys(industryMetadata).map((id) => ({
              id,
              name:
                industryMetadata[id]?.displayName ||
                id
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" "),
            }))

            console.log("Processed industry list:", industryList)
            setIndustries(industryList)

            // If we have a selected industry, load its subcategories
            if (selectedIndustry && industryMetadata[selectedIndustry]) {
              const subcategoryData = industryMetadata[selectedIndustry].subcategories || {}
              const subcategoryList = Object.keys(subcategoryData)
                .filter((id) => id !== "default" && id !== "industry-level")
                .map((id) => ({
                  id,
                  name:
                    subcategoryData[id]?.displayName ||
                    id
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" "),
                }))

              setSubcategories(subcategoryList)

              // If no subcategory is selected or the current selection is invalid, select the first one
              if (
                subcategoryList.length > 0 &&
                (!selectedSubcategory || !subcategoryList.some((s) => s.id === selectedSubcategory))
              ) {
                setSubIndustry(subcategoryList[0].id)
              } else if (subcategoryList.length === 0) {
                setSubIndustry(null)
              }
            }
          } else {
            // Fallback to direct API call if the structure is different
            const directIndustryResponse = await fetch("/api/competencies/industry")
            if (directIndustryResponse.ok) {
              const industryData = await directIndustryResponse.json()
              console.log("Direct industry API response:", industryData)

              if (industryData && industryData.industryMetadata) {
                const industryMetadata = industryData.industryMetadata

                // Format industries for dropdown
                const industryList = Object.keys(industryMetadata)
                  .filter((id) => id !== "default") // Filter out any default entries
                  .map((id) => ({
                    id,
                    name:
                      industryMetadata[id]?.displayName ||
                      id
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" "),
                  }))

                console.log("Processed industry list (fallback):", industryList)
                setIndustries(industryList)

                // Handle subcategories as before...
                if (selectedIndustry && industryMetadata[selectedIndustry]) {
                  const subcategoryData = industryMetadata[selectedIndustry].subcategories || {}
                  const subcategoryList = Object.keys(subcategoryData)
                    .filter((id) => id !== "default" && id !== "industry-level")
                    .map((id) => ({
                      id,
                      name:
                        subcategoryData[id]?.displayName ||
                        id
                          .split("-")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" "),
                    }))

                  setSubcategories(subcategoryList)

                  if (
                    subcategoryList.length > 0 &&
                    (!selectedSubcategory || !subcategoryList.some((s) => s.id === selectedSubcategory))
                  ) {
                    setSubIndustry(subcategoryList[0].id)
                  } else if (subcategoryList.length === 0) {
                    setSubIndustry(null)
                  }
                }
              } else {
                console.error("No industry metadata found in API response")
                // Use default industries as fallback
                setIndustries([
                  { id: "insurance", name: "Insurance" },
                  { id: "wealth-management", name: "Wealth Management" },
                  { id: "securities", name: "Securities" },
                ])
              }
            } else {
              throw new Error("Failed to fetch industry data from both endpoints")
            }
          }
        } else {
          throw new Error("Failed to fetch industry settings")
        }
      } catch (error) {
        console.error("Error loading industry data:", error)
        // Set default industries if API fails
        setIndustries([
          { id: "insurance", name: "Insurance" },
          { id: "wealth-management", name: "Wealth Management" },
          { id: "securities", name: "Securities" },
        ])
      } finally {
        setIsLoadingIndustryTraits(false)
      }

      // Load industry traits and focus areas in a separate try-catch block
      try {
        // Make sure we have the correct subcategory key
        const subcategoryKey =
          selectedIndustry !== "insurance" || !selectedSubcategory ? "default" : selectedSubcategory

        console.log(`Fetching focus areas for ${selectedIndustry}/${subcategoryKey}`)

        const response = await fetch(
          `/api/industry-settings?industry=${selectedIndustry}&subcategory=${subcategoryKey}`,
        )

        if (response.ok) {
          const data = await response.json()
          console.log("Industry settings data:", data)

          setIndustryTraits(data.traits)

          // Load focus areas if available
          if (data.focusAreas && Array.isArray(data.focusAreas)) {
            console.log("Focus areas found:", data.focusAreas)
            const enabledFocusAreas = data.focusAreas.filter((area) => area.enabled)

            // Format focus area names
            const formattedFocusAreas = enabledFocusAreas.map((area) => ({
              ...area,
              name:
                area.name ||
                area.displayName ||
                area.id
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" "),
            }))

            console.log("Formatted focus areas:", formattedFocusAreas)
            setAvailableFocusAreas(formattedFocusAreas)
            setSelectedFocusAreas([]) // Reset selected focus areas when industry/subcategory changes
          } else {
            console.log("No focus areas found in response")
            setAvailableFocusAreas([])
            setSelectedFocusAreas([])
          }
        } else {
          console.error("Failed to fetch industry settings:", response.status)
          setAvailableFocusAreas([])
          setSelectedFocusAreas([])
        }
      } catch (error) {
        console.error("Error loading industry traits and focus areas:", error)
        setAvailableFocusAreas([])
        setSelectedFocusAreas([])
      } finally {
        setIsLoadingFocusAreas(false)
      }
    }

    loadIndustryData()
  }, [selectedIndustry, selectedSubcategory])

  // ===== UTILITY FUNCTIONS =====

  // Copies the generated profile JSON to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // Downloads the generated profile as a JSON file
  const downloadJson = () => {
    if (!generatedProfile) return

    const dataStr = JSON.stringify(generatedProfile, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "generated_profile.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Handles sending a chat message to the AI
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !generatedProfile) return

    // Add user message
    const userMessage = chatInput.trim()
    const updatedMessages = [...chatMessages, { role: "user", content: userMessage }]
    setChatMessages(updatedMessages)
    setChatInput("")

    // Simulate AI thinking
    setIsSending(true)

    try {
      // Import the chat action at the top of the file
      // NOTE: This is dynamically imported to reduce initial load time
      // In a production environment, this could be pre-imported
      const { generateProfileResponse } = await import("./chat-actions")

      // Call the OpenAI API via our server action
      // This passes the generated profile and chat history to create a contextual response
      const response = await generateProfileResponse(generatedProfile, updatedMessages)

      if (response.success) {
        setChatMessages([...updatedMessages, { role: "assistant", content: response.message }])
      } else {
        setChatMessages([
          ...updatedMessages,
          { role: "assistant", content: "I'm sorry, I'm having trouble with that. Let's continue our conversation." },
        ])
      }
    } catch (error) {
      console.error("Error generating response:", error)
      setChatMessages([
        ...updatedMessages,
        { role: "assistant", content: "I'm sorry, I'm having trouble with that. Let's continue our conversation." },
      ])
    }

    setIsSending(false)
  }

  // Handles keyboard shortcuts for chat
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Resets the chat to start a new conversation
  const startNewChat = () => {
    setChatMessages([])
  }

  // Add this function to handle quirk selection
  const handleQuirkSelection = (quirk: string) => {
    if (selectedQuirks.includes(quirk)) {
      setSelectedQuirks(selectedQuirks.filter((q) => q !== quirk))
    } else {
      // Limit to 3 quirks maximum
      if (selectedQuirks.length < 3) {
        setSelectedQuirks([...selectedQuirks, quirk])
      }
    }
  }

  // Function to handle focus area selection
  const handleFocusAreaSelection = (focusAreaId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFocusAreas((prev) => [...prev, focusAreaId])
    } else {
      setSelectedFocusAreas((prev) => prev.filter((id) => id !== focusAreaId))
    }
  }

  // Function to select/deselect all focus areas
  const handleSelectAllFocusAreas = () => {
    if (selectedFocusAreas.length === availableFocusAreas.length) {
      // If all are selected, deselect all
      setSelectedFocusAreas([])
    } else {
      // Otherwise, select all
      setSelectedFocusAreas(availableFocusAreas.map((area) => area.id))
    }
  }

  // Update the handleGenerate function
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStage("Initializing profile generation...")

    // Start progress simulation
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        // Cap at 90% until we actually get the response
        const newProgress = prev + Math.random() * 5
        return Math.min(newProgress, 90)
      })

      // Update the stage based on progress
      if (generationProgress < 20) {
        setGenerationStage("Preparing profile parameters...")
      } else if (generationProgress < 40) {
        setGenerationStage("Generating life narrative...")
      } else if (generationProgress < 60) {
        setGenerationStage("Creating financial details...")
      } else if (generationProgress < 80) {
        setGenerationStage("Finalizing personality traits...")
      } else {
        setGenerationStage("Polishing profile details...")
      }
    }, 300)

    try {
      // Prepare focus areas with names for the profile generator
      const focusAreasWithNames = selectedFocusAreas.map((id) => {
        const area = availableFocusAreas.find((a) => a.id === id)
        return { id, name: area?.name || id }
      })

      console.log("Generating profile with focus areas:", focusAreasWithNames)

      // Call the server action to generate a profile
      const profile = await generateProfile({
        industry: selectedIndustry,
        subIndustry: selectedSubcategory,
        difficulty,
        complexity,
        includeFinancialDetails,
        includeFamilyDetails,
        includePersonalityTraits,
        includeRecentEvents,
        // Add the new parameters
        ageGroup: ageGroup === "any" ? undefined : ageGroup,
        communicationStyle: communicationStyle === "any" ? undefined : communicationStyle,
        emotionalReactivity: emotionalReactivity,
        lifeStageContext: lifeStageContext === "any" ? undefined : lifeStageContext,
        culturalContext: culturalContext === "any" ? undefined : culturalContext,
        // Add quirks parameters
        includeQuirks,
        selectedQuirks: autoSelectQuirks ? undefined : selectedQuirks,
        // Add industry traits
        industryTraits,
        // Add focus areas
        focusAreas: focusAreasWithNames.length > 0 ? focusAreasWithNames : undefined,
        // Add cache control
        useCache,
      })

      // Add industry information to the profile for reference
      const enhancedProfile = {
        ...profile,
        industry: selectedIndustry,
        subIndustry: selectedSubcategory,
        // Add focus areas to the profile for reference
        focusAreas: focusAreasWithNames.length > 0 ? focusAreasWithNames : undefined,
      }

      setGeneratedProfile(enhancedProfile)
      // Auto-collapse the parameters panel after generating
      setIsParametersPanelOpen(false)

      // Complete the progress
      setGenerationProgress(100)
      setGenerationStage("Profile generation complete!")
    } catch (error) {
      console.error("Error generating profile:", error)
      setGenerationStage("Error generating profile. Please try again.")
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
    }
  }

  // Function to get trait behavior profiles for display
  const getTraitProfiles = (traits) => {
    if (!traits) return null
    return mapTraitsToProfiles(traits)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2 text-[rgb(35,15,110)]">AI Profile Generator</h1>
      <p className="text-gray-500 mb-6">Generate realistic client profiles for financial services simulations</p>

      {/* Parameters Panel - Collapsible */}
      <Collapsible open={isParametersPanelOpen} onOpenChange={setIsParametersPanelOpen} className="mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Generation Parameters
                </CardTitle>
                <CardDescription>Configure the profile generation settings</CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isParametersPanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              <Tabs defaultValue="industry" className="mb-4">
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="industry">Industry</TabsTrigger>
                  <TabsTrigger value="personality">Personality</TabsTrigger>
                  <TabsTrigger value="quirks">Quirks</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="industry-traits">Industry Traits</TabsTrigger>
                </TabsList>

                {/* Industry & Complexity Tab */}
                <TabsContent value="industry" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Industry Settings */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Industry Settings</h3>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        {industries.length > 0 ? (
                          <Select value={selectedIndustry} onValueChange={setIndustry}>
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
                        ) : (
                          <div className="flex items-center justify-between p-2 border rounded-md">
                            <span className="text-sm text-gray-500">Loading industries...</span>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[rgb(35,15,110)]"></div>
                          </div>
                        )}
                      </div>

                      {/* Subcategory dropdown - shown when subcategories are available */}
                      <div className="space-y-2">
                        <Label htmlFor="subIndustry">Subcategory</Label>
                        {subcategories.length > 0 ? (
                          <Select value={selectedSubcategory} onValueChange={setSubIndustry}>
                            <SelectTrigger id="subIndustry">
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
                        ) : (
                          <div className="text-sm text-gray-500 p-2 border rounded-md">
                            No subcategories available for this industry
                          </div>
                        )}
                      </div>

                      {/* Focus Areas - Now part of Industry Settings */}
                      <div className="space-y-2">
                        <Label htmlFor="focus-areas">Focus Areas</Label>
                        {isLoadingFocusAreas ? (
                          <div className="flex justify-center items-center p-4 border rounded-md">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[rgb(35,15,110)]"></div>
                          </div>
                        ) : availableFocusAreas.length > 0 ? (
                          <div className="border rounded-md p-3 space-y-3">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs text-gray-500">Select focus areas for this profile:</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAllFocusAreas}
                                className="text-xs h-7"
                              >
                                {selectedFocusAreas.length === availableFocusAreas.length
                                  ? "Deselect All"
                                  : "Select All"}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {availableFocusAreas.map((area) => (
                                <div key={area.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`focus-${area.id}`}
                                    checked={selectedFocusAreas.includes(area.id)}
                                    onCheckedChange={(checked) => handleFocusAreaSelection(area.id, checked === true)}
                                  />
                                  <Label htmlFor={`focus-${area.id}`} className="text-sm font-medium leading-none">
                                    {area.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {selectedFocusAreas.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-dashed">
                                <div className="flex items-center text-sm text-[rgb(35,15,110)]">
                                  <Check className="h-4 w-4 mr-2" />
                                  {selectedFocusAreas.length} focus area{selectedFocusAreas.length !== 1 ? "s" : ""}{" "}
                                  selected
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 p-2 border rounded-md">
                            No focus areas available for this{" "}
                            {selectedIndustry === "insurance" ? "subcategory" : "industry"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger id="difficulty">
                            <SelectValue placeholder="Select Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Complexity Settings */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Complexity Settings</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="complexity">Profile Complexity</Label>
                          <span className="text-sm text-gray-500">{complexity}%</span>
                        </div>
                        <Slider
                          id="complexity"
                          min={10}
                          max={100}
                          step={10}
                          value={[complexity]}
                          onValueChange={(value) => setComplexity(value[0])}
                        />
                        <p className="text-xs text-gray-500">
                          {complexity < 30
                            ? "Simple profile with basic details"
                            : complexity < 70
                              ? "Moderate complexity with balanced details"
                              : "Highly detailed and nuanced profile"}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Personality Tab */}
                <TabsContent value="personality" className="space-y-6">
                  {includePersonalityTraits ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Age & Communication</h3>
                        <div className="space-y-2">
                          <Label htmlFor="age-group">Age Group</Label>
                          <Select value={ageGroup} onValueChange={setAgeGroup}>
                            <SelectTrigger id="age-group">
                              <SelectValue placeholder="Select Age Group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Auto-Generate</SelectItem>
                              {ageGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Influences vocabulary, cultural references, and communication patterns
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="communication-style">Communication Style</Label>
                          <Select value={communicationStyle} onValueChange={setCommunicationStyle}>
                            <SelectTrigger id="communication-style">
                              <SelectValue placeholder="Select Communication Style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Auto-Generate</SelectItem>
                              {communicationStyles.map((style) => (
                                <SelectItem key={style.id} value={style.id}>
                                  {style.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Determines how the client structures thoughts and expresses themselves
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Context & Reactivity</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="emotional-reactivity">Emotional Reactivity</Label>
                            <span className="text-sm text-gray-500">{emotionalReactivity}%</span>
                          </div>
                          <Slider
                            id="emotional-reactivity"
                            min={0}
                            max={100}
                            step={10}
                            value={[emotionalReactivity]}
                            onValueChange={(value) => setEmotionalReactivity(value[0])}
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Stable (Consistent)</span>
                            <span>Volatile (Reactive)</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="life-stage-context">Life Stage Context</Label>
                          <Select value={lifeStageContext} onValueChange={setLifeStageContext}>
                            <SelectTrigger id="life-stage-context">
                              <SelectValue placeholder="Select Life Stage Context" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Auto-Generate</SelectItem>
                              {lifeStageContexts.map((context) => (
                                <SelectItem key={context.id} value={context.id}>
                                  {context.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Influences priorities, concerns, and decision-making framework
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cultural-context">Cultural Context</Label>
                          <Select value={culturalContext} onValueChange={setCulturalContext}>
                            <SelectTrigger id="cultural-context">
                              <SelectValue placeholder="Select Cultural Context" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Auto-Generate</SelectItem>
                              {culturalContexts.map((context) => (
                                <SelectItem key={context.id} value={context.id}>
                                  {context.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            Influences value system, communication norms, and approach to financial matters
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">
                        Enable Personality Traits in the Details tab to configure these settings.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Quirks Tab */}
                <TabsContent value="quirks" className="space-y-6">
                  {includeQuirks ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-select-quirks" className="text-sm">
                          Auto-select quirks
                        </Label>
                        <Switch
                          id="auto-select-quirks"
                          checked={autoSelectQuirks}
                          onCheckedChange={setAutoSelectQuirks}
                        />
                      </div>

                      {!autoSelectQuirks && (
                        <div className="space-y-2">
                          <Label className="text-sm">Select up to 3 quirks:</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {quirksTaxonomy.quirks.map((quirk) => (
                              <div
                                key={quirk.name}
                                className={`text-xs p-2 border rounded-md cursor-pointer ${
                                  selectedQuirks.includes(quirk.name)
                                    ? "bg-[rgb(35,15,110)] text-white"
                                    : "bg-white hover:bg-gray-50"
                                }`}
                                onClick={() => handleQuirkSelection(quirk.name)}
                                title={quirk.description}
                              >
                                {quirk.name}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">Selected: {selectedQuirks.length}/3</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="quirk-intensity">Quirk Intensity</Label>
                          <span className="text-sm text-gray-500">
                            {quirkIntensity < 40 ? "Subtle" : quirkIntensity > 70 ? "Strong" : "Moderate"}
                          </span>
                        </div>
                        <Slider
                          id="quirk-intensity"
                          min={10}
                          max={100}
                          step={10}
                          value={[quirkIntensity]}
                          onValueChange={(value) => setQuirkIntensity(value[0])}
                        />
                        <p className="text-xs text-gray-500">
                          Controls how strongly the quirks influence communication
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">
                        Enable Communication Quirks in the Details tab to configure these settings.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Include Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="financial-details" className="text-sm">
                            Financial Details
                          </Label>
                          <Switch
                            id="financial-details"
                            checked={includeFinancialDetails}
                            onCheckedChange={setIncludeFinancialDetails}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="family-details" className="text-sm">
                            Family Details
                          </Label>
                          <Switch
                            id="family-details"
                            checked={includeFamilyDetails}
                            onCheckedChange={setIncludeFamilyDetails}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="personality-traits" className="text-sm">
                            Personality Traits
                          </Label>
                          <Switch
                            id="personality-traits"
                            checked={includePersonalityTraits}
                            onCheckedChange={setIncludePersonalityTraits}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="recent-events" className="text-sm">
                            Recent Life Events
                          </Label>
                          <Switch
                            id="recent-events"
                            checked={includeRecentEvents}
                            onCheckedChange={setIncludeRecentEvents}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Communication Features</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="include-quirks" className="text-sm">
                            Communication Quirks
                          </Label>
                          <Switch id="include-quirks" checked={includeQuirks} onCheckedChange={setIncludeQuirks} />
                        </div>
                        <p className="text-xs text-gray-500">
                          Quirks add realistic communication patterns like interrupting, using jargon, or asking
                          frequent questions
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Industry Traits Tab */}
                <TabsContent value="industry-traits" className="space-y-6">
                  {isLoadingIndustryTraits ? (
                    <div className="flex justify-center items-center p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(35,15,110)]"></div>
                    </div>
                  ) : industryTraits ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-medium text-blue-800">Industry-Specific Profile</h3>
                            <p className="text-xs text-blue-700 mt-1">
                              These traits are automatically loaded from your industry settings and will be incorporated
                              into the generated profile.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium">Knowledge Areas</h3>
                            <ul className="mt-2 space-y-1 text-sm">
                              {industryTraits.knowledgeAreas.map((area: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{area}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium">Common Concerns</h3>
                            <ul className="mt-2 space-y-1 text-sm">
                              {industryTraits.commonConcerns.map((concern: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium">Typical Goals</h3>
                            <ul className="mt-2 space-y-1 text-sm">
                              {industryTraits.typicalGoals.map((goal: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{goal}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium">Industry Terminology</h3>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {industryTraits.industryTerminology.map((term: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium">Regulatory Considerations</h3>
                            <ul className="mt-2 space-y-1 text-sm">
                              {industryTraits.regulatoryConsiderations.map((reg: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{reg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">No industry traits available.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center justify-between mt-4">
                <Label htmlFor="use-cache" className="text-sm">
                  Use cached profiles when available (faster)
                </Label>
                <Switch id="use-cache" checked={useCache} onCheckedChange={setUseCache} />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
              >
                {isGenerating ? "Generating Profile..." : "Generate Client Profile"}
              </Button>
            </CardFooter>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Generated Profile Section */}
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-md mb-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-[rgb(35,15,110)] rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-gray-500">{generationStage}</p>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(35,15,110)] mb-4"></div>
          <p className="text-gray-500">Generating a detailed client profile...</p>
        </div>
      ) : generatedProfile ? (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  {generatedProfile ? generatedProfile.name : "Generating Profile..."}
                </CardTitle>
                {generatedProfile && (
                  <CardDescription>
                    {generatedProfile.age} years old, {generatedProfile.occupation} | {generatedProfile.familyStatus}
                  </CardDescription>
                )}
              </div>
              {generatedProfile && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(generatedProfile, null, 2))}
                  >
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadJson}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <div className="flex items-center space-x-2 ml-4 border-l pl-4">
                    <Label htmlFor="show-details" className="text-xs">
                      {showDetailedInfo ? "Hide Details" : "Show Details"}
                    </Label>
                    <Switch id="show-details" checked={showDetailedInfo} onCheckedChange={setShowDetailedInfo} />
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-full max-w-md mb-4">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-[rgb(35,15,110)] rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center mt-2 text-gray-500">{generationStage}</p>
                </div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(35,15,110)] mb-4"></div>
                <p className="text-gray-500">Generating a detailed client profile...</p>
              </div>
            ) : generatedProfile ? (
              <Tabs defaultValue="complete">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="complete">Complete Profile</TabsTrigger>
                  <TabsTrigger value="json">Raw JSON</TabsTrigger>
                  <TabsTrigger value="chat">Test Chat</TabsTrigger>
                </TabsList>

                {/* Complete Profile Tab */}
                <TabsContent value="complete" className="space-y-6">
                  <div className="mb-2 text-sm text-gray-500">
                    <p>
                      This profile shows a {generatedProfile.difficulty} level client for {selectedIndustry}
                      {selectedSubcategory ? ` (${selectedSubcategory})` : ""} simulations.
                    </p>

                    {/* Display focus areas if any */}
                    {generatedProfile.focusAreas && generatedProfile.focusAreas.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-sm font-medium">Focus Areas:</span>
                        {generatedProfile.focusAreas.map((area, index) => (
                          <span
                            key={index}
                            className="inline-block bg-[rgb(35,15,110)]/10 text-[rgb(35,15,110)] text-xs px-2 py-1 rounded-full"
                          >
                            {area.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm mb-6">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Basic Information</h4>
                          <ul className="mt-2 space-y-1">
                            <li className="text-sm">
                              <span className="font-medium">Age:</span> {generatedProfile.age}
                            </li>
                            <li className="text-sm">
                              <span className="font-medium">Occupation:</span> {generatedProfile.occupation}
                            </li>
                            <li className="text-sm">
                              <span className="font-medium">Family Status:</span> {generatedProfile.familyStatus}
                            </li>
                            <li className="text-sm">
                              <span className="font-medium">Income Level:</span> {generatedProfile.incomeLevel}
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Simulation Context</h4>
                          <ul className="mt-2 space-y-1">
                            <li className="text-sm">
                              <span className="font-medium">Difficulty:</span>{" "}
                              {generatedProfile.difficulty || difficulty}
                            </li>
                            <li className="text-sm">
                              <span className="font-medium">Industry:</span> {selectedIndustry}{" "}
                              {selectedSubcategory ? `(${selectedSubcategory})` : ""}
                            </li>
                            <li className="text-sm">
                              <span className="font-medium">Profile Complexity:</span> {complexity}%
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Life Narrative Section */}
                  {generatedProfile.lifeNarrative && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Life Narrative</h3>
                      <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                        <CardContent className="pt-4">
                          <p className="text-sm">{generatedProfile.lifeNarrative}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Goals and Concerns Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Goals */}
                    {generatedProfile.goals && generatedProfile.goals.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Goals</h3>
                        <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                          <CardContent className="pt-4">
                            <ul className="list-disc pl-5 space-y-1">
                              {generatedProfile.goals.map((goal, index) => (
                                <li key={index} className="text-sm">
                                  {goal}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Concerns */}
                    {generatedProfile.concerns && generatedProfile.concerns.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Concerns</h3>
                        <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                          <CardContent className="pt-4">
                            <ul className="list-disc pl-5 space-y-1">
                              {generatedProfile.concerns.map((concern, index) => (
                                <li key={index} className="text-sm">
                                  {concern}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* Financial Details Section */}
                  {generatedProfile.financialDetails && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Financial Details</h3>
                      <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Income */}
                            <div className="bg-gray-50 p-4 rounded-md">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Income</h4>
                              <p className="text-sm">{generatedProfile.financialDetails.income}</p>
                            </div>

                            {/* Assets */}
                            {generatedProfile.financialDetails.assets &&
                              generatedProfile.financialDetails.assets.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-md">
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Assets</h4>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {generatedProfile.financialDetails.assets.map((asset, index) => (
                                      <li key={index} className="text-sm">
                                        {asset}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {/* Debts */}
                            {generatedProfile.financialDetails.debts &&
                              generatedProfile.financialDetails.debts.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-md">
                                  <h4 className="text-sm font-medium text-gray-500 mb-2">Debts</h4>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {generatedProfile.financialDetails.debts.map((debt, index) => (
                                      <li key={index} className="text-sm">
                                        {debt}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Recent Events Section */}
                  {generatedProfile.recentEvents && generatedProfile.recentEvents.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Recent Events</h3>
                      <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                        <CardContent className="pt-4">
                          <ul className="list-disc pl-5 space-y-1">
                            {generatedProfile.recentEvents.map((event, index) => (
                              <li key={index} className="text-sm">
                                {event}
                              </li>
                            ))}
                          </ul>
                          {generatedProfile.eventImpact && (
                            <div className="mt-3 pt-3 border-t">
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Impact on Financial Decisions</h4>
                              <p className="text-sm">{generatedProfile.eventImpact}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Personality Traits Section */}
                  {generatedProfile.personalityTraits && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Personality Traits</h3>
                      <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Basic Traits */}
                            <div className="bg-gray-50 p-4 rounded-md">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Financial Personality</h4>
                              <ul className="space-y-2">
                                <li className="text-sm">
                                  <span className="font-medium">Risk Tolerance:</span>{" "}
                                  {generatedProfile.personalityTraits.riskTolerance}
                                </li>
                                <li className="text-sm">
                                  <span className="font-medium">Spending Habits:</span>{" "}
                                  {generatedProfile.personalityTraits.spendingHabits}
                                </li>
                                <li className="text-sm">
                                  <span className="font-medium">Financial Priorities:</span>{" "}
                                  {generatedProfile.personalityTraits.financialPriorities}
                                </li>
                              </ul>
                            </div>

                            {/* Communication Style */}
                            <div className="bg-gray-50 p-4 rounded-md">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Communication Style</h4>
                              <ul className="space-y-2">
                                <li className="text-sm">
                                  <span className="font-medium">Communication Style:</span>{" "}
                                  {generatedProfile.personalityTraits.communicationStyle}
                                </li>
                                <li className="text-sm">
                                  <span className="font-medium">Decision Making:</span>{" "}
                                  {generatedProfile.personalityTraits.decisionMaking}
                                </li>
                                <li className="text-sm">
                                  <span className="font-medium">Response to Advice:</span>{" "}
                                  {generatedProfile.personalityTraits.responseToAdvice}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Quirks Section */}
                  {generatedProfile.quirks && generatedProfile.quirks.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Communication Quirks</h3>
                      <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                        <CardContent className="pt-4">
                          <ul className="list-disc pl-5 space-y-1">
                            {generatedProfile.quirks.map((quirk, index) => (
                              <li key={index} className="text-sm">
                                {quirk}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Raw JSON Tab */}
                <TabsContent value="json">
                  <Card className="border-t-4 border-t-[rgb(35,15,110)] shadow-sm">
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(generatedProfile, null, 2)}</pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Test Chat Tab */}
                <TabsContent value="chat">
                  <div className="space-y-4">
                    <div className="rounded-md bg-gray-100 p-4">
                      <p className="text-sm text-gray-600">
                        Test the profile by chatting with an AI that embodies this persona.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Note: This feature uses OpenAI and may take a few seconds to respond.
                      </p>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-2">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md ${message.role === "user" ? "bg-blue-100" : "bg-gray-100"}`}
                        >
                          <p className="text-sm font-medium">
                            {message.role === "user" ? "You:" : generatedProfile.name + ":"}
                          </p>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))}
                      <div ref={messagesEndRef} /> {/* Scroll anchor */}
                    </div>

                    {/* Chat Input */}
                    <div className="flex items-center space-x-2">
                      <textarea
                        rows={1}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="flex-grow p-2 border rounded-md focus:outline-none focus:ring focus:border-[rgb(35,15,110)] text-sm"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending}
                        className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)] text-sm"
                      >
                        {isSending ? "Sending..." : "Send"}
                      </Button>
                    </div>

                    {/* New Chat Button */}
                    {chatMessages.length > 0 && (
                      <Button variant="ghost" onClick={startNewChat} className="text-sm">
                        Start New Chat
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center p-6">
                <p className="text-gray-500">Generate a profile to view details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center p-6">
          <p className="text-gray-500">Click "Generate Client Profile" to create a new profile.</p>
        </div>
      )}
    </div>
  )
}
