import { NextResponse } from "next/server"
import { generateProfile } from "@/app/profile-generator/actions"

// Common profile configurations that might be used
const commonConfigurations = [
  {
    industry: "insurance",
    subIndustry: "life-health",
    difficulty: "beginner",
    complexity: 50,
    includeFinancialDetails: true,
    includeFamilyDetails: true,
    includePersonalityTraits: true,
    includeRecentEvents: true,
  },
  {
    industry: "insurance",
    subIndustry: "property-casualty",
    difficulty: "beginner",
    complexity: 50,
    includeFinancialDetails: true,
    includeFamilyDetails: true,
    includePersonalityTraits: true,
    includeRecentEvents: true,
  },
  {
    industry: "wealth-management",
    subIndustry: null,
    difficulty: "beginner",
    complexity: 50,
    includeFinancialDetails: true,
    includeFamilyDetails: true,
    includePersonalityTraits: true,
    includeRecentEvents: true,
  },
  {
    industry: "securities",
    subIndustry: null,
    difficulty: "beginner",
    complexity: 50,
    includeFinancialDetails: true,
    includeFamilyDetails: true,
    includePersonalityTraits: true,
    includeRecentEvents: true,
  },
]

export async function GET() {
  try {
    // Generate profiles for common configurations
    const generationPromises = commonConfigurations.map((config) =>
      generateProfile({
        ...config,
        useCache: false, // Force regeneration
      }).catch((err) => {
        console.error(`Error pre-generating profile for ${config.industry}:`, err)
        return null
      }),
    )

    await Promise.all(generationPromises)

    return NextResponse.json({
      success: true,
      message: `Pre-generated ${commonConfigurations.length} profiles`,
    })
  } catch (error) {
    console.error("Error in profile pre-generation:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to pre-generate profiles",
      },
      { status: 500 },
    )
  }
}
