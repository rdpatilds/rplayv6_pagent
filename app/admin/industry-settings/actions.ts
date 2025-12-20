"use server"

import {
  getCompetencies,
  getIndustryCompetencies,
  saveIndustrySubcategoryCompetencies,
  saveFocusAreaCompetencies,
  toggleFocusAreaEnabled,
  getFocusAreas,
  type Competency,
  type IndustryCompetencies,
  addNewIndustry,
  addNewSubcategory,
  addNewFocusArea,
  updateIndustry,
  updateSubcategory,
  updateFocusArea,
  deleteIndustry,
  deleteSubcategory,
  deleteFocusArea,
  getDifficultySettings,
  saveDifficultySettings,
  type DifficultyLevel,
  type DifficultySettings,
  type VisibleClientDetails,
  updateVisibleClientDetails,
  saveIndustryCompetencies,
} from "@/app/api/simulation/data-store"

export async function fetchCompetencies(): Promise<Competency[]> {
  return getCompetencies()
}

export async function fetchIndustryCompetencies(): Promise<IndustryCompetencies> {
  return getIndustryCompetencies()
}

export async function saveCompetenciesForIndustry(
  industry: string,
  subcategory: string,
  competencyIds: string[],
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Server action: Saving competencies for ${industry}/${subcategory}:`, competencyIds)

    if (!industry) {
      return { success: false, message: "Industry is required" }
    }

    if (!subcategory) {
      return { success: false, message: "Subcategory is required" }
    }

    if (!Array.isArray(competencyIds)) {
      return { success: false, message: "Competency IDs must be an array" }
    }

    // Get current industry competencies to check if the industry and subcategory exist
    const currentCompetencies = await getIndustryCompetencies()

    // Create industry if it doesn't exist
    if (!currentCompetencies[industry]) {
      console.log(`Creating new industry: ${industry}`)
      // Initialize with empty structure
      currentCompetencies[industry] = {}
      saveIndustryCompetencies(currentCompetencies)
    }

    const success = saveIndustrySubcategoryCompetencies(industry, subcategory, competencyIds)

    if (!success) {
      return { success: false, message: `Failed to save competencies for ${industry}/${subcategory}` }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveCompetenciesForIndustry:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

export async function saveCompetenciesForFocusArea(
  industry: string,
  subcategory: string,
  focusArea: string,
  competencyIds: string[],
  enabled = true,
): Promise<{ success: boolean }> {
  const success = saveFocusAreaCompetencies(industry, subcategory, focusArea, competencyIds, enabled)
  return { success }
}

export async function toggleFocusArea(
  industry: string,
  subcategory: string,
  focusArea: string,
  enabled: boolean,
): Promise<{ success: boolean }> {
  const success = toggleFocusAreaEnabled(industry, subcategory, focusArea, enabled)
  return { success }
}

export async function fetchFocusAreas(
  industry: string,
  subcategory: string,
): Promise<{ id: string; name: string; enabled: boolean }[]> {
  return getFocusAreas(industry, subcategory)
}

export async function createNewIndustry(
  industryId: string,
  displayName: string,
  difficultySettings?: {
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  },
): Promise<{ success: boolean }> {
  const success = addNewIndustry(industryId, displayName, difficultySettings)
  return { success }
}

export async function createNewSubcategory(
  industry: string,
  subcategoryId: string,
  displayName: string,
): Promise<{ success: boolean }> {
  const success = addNewSubcategory(industry, subcategoryId, displayName)
  return { success }
}

export async function createNewFocusArea(
  industry: string,
  subcategory: string,
  focusAreaId: string,
  displayName: string,
): Promise<{ success: boolean }> {
  const success = addNewFocusArea(industry, subcategory, focusAreaId, displayName)
  return { success }
}

export async function modifyIndustry(
  industryId: string,
  displayName: string,
  difficultySettings?: {
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  },
): Promise<{ success: boolean }> {
  const success = updateIndustry(industryId, displayName, difficultySettings)
  return { success }
}

export async function modifySubcategory(
  industry: string,
  subcategoryId: string,
  displayName: string,
): Promise<{ success: boolean }> {
  const success = updateSubcategory(industry, subcategoryId, displayName)
  return { success }
}

export async function modifyFocusArea(
  industry: string,
  subcategory: string,
  focusAreaId: string,
  newFocusAreaId: string,
  enabled: boolean,
): Promise<{ success: boolean }> {
  const success = updateFocusArea(industry, subcategory, focusAreaId, newFocusAreaId, enabled)
  return { success }
}

export async function removeIndustry(industryId: string): Promise<{ success: boolean }> {
  const success = deleteIndustry(industryId)
  return { success }
}

export async function removeSubcategory(industry: string, subcategoryId: string): Promise<{ success: boolean }> {
  const success = deleteSubcategory(industry, subcategoryId)
  return { success }
}

export async function removeFocusArea(
  industry: string,
  subcategory: string,
  focusAreaId: string,
): Promise<{ success: boolean }> {
  const success = deleteFocusArea(industry, subcategory, focusAreaId)
  return { success }
}

export async function fetchDifficultySettings(): Promise<DifficultySettings> {
  return getDifficultySettings()
}

export async function saveDifficultySettingsForIndustry(
  industry: string,
  settings: {
    beginner: DifficultyLevel
    intermediate: DifficultyLevel
    advanced: DifficultyLevel
  },
): Promise<{ success: boolean }> {
  const allSettings = getDifficultySettings()
  allSettings[industry] = settings
  const success = saveDifficultySettings(allSettings)
  return { success }
}

// New function to update visible client details
export async function saveVisibleClientDetails(
  industry: string,
  difficultyLevel: "beginner" | "intermediate" | "advanced",
  visibleDetails: VisibleClientDetails,
): Promise<{ success: boolean }> {
  const success = updateVisibleClientDetails(industry, difficultyLevel, visibleDetails)
  return { success }
}

// AI-assisted generation of difficulty settings
export async function generateDifficultySettings(
  industry: string,
  displayName: string,
): Promise<{
  beginner: DifficultyLevel
  intermediate: DifficultyLevel
  advanced: DifficultyLevel
}> {
  // In a real implementation, this would call an AI service
  // For now, we'll generate some reasonable defaults based on the industry name

  const industryLower = displayName.toLowerCase()

  return {
    beginner: {
      description: `Build foundational skills in ${industryLower}. All client details are provided upfront.`,
      objectives: `Active listening, rapport-building, confirming client details, and explaining basic ${industryLower} concepts to new clients.`,
      clientBehavior: "Friendly, cooperative, and open to guidance.",
      sampleScenario: `A first-time ${industryLower} client seeking basic services with straightforward needs and clear goals.`,
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: true,
        assets: true,
        debt: true,
        primaryGoals: true,
      },
    },
    intermediate: {
      description: `Requires deeper trust-building with partially hidden information in ${industryLower} scenarios.`,
      objectives: `Uncover hidden details, ask open-ended questions, and explain moderately complex ${industryLower} concepts to clients with some experience.`,
      clientBehavior: "Hesitant, reserved, and requiring reassurance before sharing complete information.",
      sampleScenario: `An experienced ${industryLower} client with some specific concerns and moderate complexity in their situation.`,
      visibleDetails: {
        name: true,
        age: true,
        familyStatus: true,
        occupation: true,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
    advanced: {
      description: `Involves uncooperative or skeptical clients in complex ${industryLower} scenarios.`,
      objectives: `Handle objections empathetically, uncover fully hidden details, and explain advanced ${industryLower} strategies to sophisticated clients.`,
      clientBehavior: "Skeptical, challenging, resistant, and testing your expertise and trustworthiness.",
      sampleScenario: `A highly knowledgeable ${industryLower} client with complex needs, previous negative experiences, and specific demands.`,
      visibleDetails: {
        name: true,
        age: false,
        familyStatus: false,
        occupation: false,
        income: false,
        assets: false,
        debt: false,
        primaryGoals: false,
      },
    },
  }
}
