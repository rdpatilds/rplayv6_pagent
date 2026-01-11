import { type NextRequest, NextResponse } from "next/server"
import { generatePerformanceReview } from "../review-actions"
import { getSafeDifficultyLevel } from "@/utils/difficulty-utils"

// Mark this as a server-only route
export const runtime = "nodejs" // 'edge' or 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch((err) => {
      console.error("Error parsing request body:", err)
      return {}
    })

    const { messages, competencies, difficultyLevel } = body

    if (!messages || !competencies) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Add debug logging
    console.log("API route received difficulty:", difficultyLevel)

    // Use the utility function to safely handle the difficulty level
    const safeDifficultyLevel = getSafeDifficultyLevel(difficultyLevel)

    // Add debug logging
    console.log("API route processed difficulty:", safeDifficultyLevel)

    const reviewData = await generatePerformanceReview(messages, competencies, safeDifficultyLevel)
    return NextResponse.json(reviewData)
  } catch (error) {
    console.error("Error in generate-review API route:", error)
    return NextResponse.json(
      { error: `Failed to generate performance review: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
