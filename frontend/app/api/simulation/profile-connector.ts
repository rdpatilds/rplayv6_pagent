// This file connects the simulation system to the profile generator
// It handles retrieving or generating profiles for simulations

import { generateProfile } from "@/app/profile-generator/actions"

// Cache profiles to avoid regenerating them unnecessarily
const profileCache = new Map()

export async function getProfileForSimulation(
  industry: string,
  subcategory: string | null,
  difficulty: string,
  focusAreas?: { id: string; name: string }[],
) {
  // Create a cache key based on the parameters
  const cacheKey = JSON.stringify({ industry, subcategory, difficulty, focusAreas })

  // Check if we have a cached profile
  if (profileCache.has(cacheKey)) {
    console.log("Using cached profile for simulation")
    return profileCache.get(cacheKey)
  }

  console.log("Generating new profile for simulation", {
    industry,
    subcategory,
    difficulty,
    focusAreas: focusAreas ? focusAreas.map((area) => area.name).join(", ") : "none",
  })

  try {
    // Generate a profile using the profile generator
    const profile = await generateProfile({
      industry,
      subIndustry: subcategory,
      difficulty,
      complexity: difficulty === "beginner" ? 40 : difficulty === "intermediate" ? 70 : 90,
      includeFinancialDetails: true,
      includeFamilyDetails: true,
      includePersonalityTraits: true,
      includeRecentEvents: true,
      includeQuirks: true,
      // Pass the focus areas to the profile generator
      focusAreas: focusAreas || [],
    })

    // Add the difficulty level and focus areas to the profile for reference
    const enhancedProfile = {
      ...profile,
      difficulty,
      focusAreas: focusAreas || [],
    }

    // Cache the profile for future use
    profileCache.set(cacheKey, enhancedProfile)

    return enhancedProfile
  } catch (error) {
    console.error("Error generating profile:", error)

    // Create a fallback profile based on difficulty
    const fallbackProfile = {
      name:
        difficulty === "beginner" ? "John Smith" : difficulty === "intermediate" ? "Sarah Johnson" : "Michael Torres",
      age: difficulty === "beginner" ? 42 : difficulty === "intermediate" ? 58 : 35,
      occupation:
        difficulty === "beginner"
          ? "High School Teacher"
          : difficulty === "intermediate"
            ? "Marketing Executive"
            : "Entrepreneur",
      income:
        difficulty === "beginner"
          ? "$65,000"
          : difficulty === "intermediate"
            ? "$95,000"
            : "Variable ($120,000-$200,000)",
      incomeLevel: difficulty === "beginner" ? "Moderate" : "High",
      family:
        difficulty === "beginner"
          ? "Married with 2 children (ages 10 and 8)"
          : difficulty === "intermediate"
            ? "Divorced, 1 adult child"
            : "Single, no children",
      familyStatus:
        difficulty === "beginner"
          ? "Married with 2 children (ages 10 and 8)"
          : difficulty === "intermediate"
            ? "Divorced, 1 adult child"
            : "Single, no children",
      assets:
        difficulty === "beginner"
          ? ["$25,000 emergency fund", "403(b) with $120,000", "Home equity"]
          : difficulty === "intermediate"
            ? ["$150,000 in 401(k)", "$50,000 in savings", "Paid-off condo"]
            : ["Business equity", "Investment portfolio", "$30,000 in savings"],
      debts:
        difficulty === "beginner"
          ? ["$180,000 mortgage", "$15,000 auto loan"]
          : difficulty === "intermediate"
            ? ["$5,000 credit card debt"]
            : ["$40,000 business loan", "$15,000 student loans"],
      goals:
        difficulty === "beginner"
          ? [
              "Protect family financially",
              "Save for children's college education",
              "Ensure adequate retirement savings",
            ]
          : difficulty === "intermediate"
            ? ["Plan for retirement in 7-10 years", "Maximize investment returns", "Minimize tax burden"]
            : ["Business expansion", "Personal financial security", "Future retirement planning"],
      fusionModelTraits: {
        openness: difficulty === "beginner" ? 60 : difficulty === "intermediate" ? 50 : 40,
        conscientiousness: difficulty === "beginner" ? 70 : difficulty === "intermediate" ? 65 : 60,
        extraversion: difficulty === "beginner" ? 50 : difficulty === "intermediate" ? 45 : 60,
        agreeableness: difficulty === "beginner" ? 75 : difficulty === "intermediate" ? 60 : 40,
        neuroticism: difficulty === "beginner" ? 30 : difficulty === "intermediate" ? 45 : 60,
        assertiveness: difficulty === "beginner" ? 40 : difficulty === "intermediate" ? 55 : 75,
        honestyHumility: difficulty === "beginner" ? 80 : difficulty === "intermediate" ? 70 : 50,
      },
      difficulty,
      focusAreas: focusAreas || [],
    }

    return fallbackProfile
  }
}
