import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { logger } from "@/utils/logger"

// Path to the feedback JSON file - using tmp directory which is writable in Vercel
const FEEDBACK_FILE_PATH = path.join(process.cwd(), "tmp", "nps-feedback.json")

// Helper function to ensure the directory exists
async function ensureDirectoryExists() {
  try {
    const dir = path.dirname(FEEDBACK_FILE_PATH)
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    logger.error("Error creating directory:", error)
    throw error
  }
}

// Helper function to read existing feedback data
async function readFeedbackData() {
  try {
    await ensureDirectoryExists()

    try {
      const data = await fs.readFile(FEEDBACK_FILE_PATH, "utf8")
      return JSON.parse(data)
    } catch (error) {
      // If file doesn't exist or is empty, return empty array
      if (error.code === "ENOENT" || error.message.includes("Unexpected end")) {
        return []
      }
      throw error
    }
  } catch (error) {
    logger.error("Error reading feedback data:", error)
    throw error
  }
}

// Helper function to write feedback data
async function writeFeedbackData(data) {
  try {
    await ensureDirectoryExists()
    await fs.writeFile(FEEDBACK_FILE_PATH, JSON.stringify(data, null, 2), "utf8")
  } catch (error) {
    logger.error("Error writing feedback data:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { simulationId, userId, score, comment, timestamp = new Date().toISOString() } = body

    // Validate required fields
    if (!simulationId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: simulationId and userId are required" },
        { status: 400 },
      )
    }

    // Validate score
    if (typeof score !== "number" || score < 0 || score > 10) {
      return NextResponse.json({ error: "Score must be a number between 0 and 10" }, { status: 400 })
    }

    // Prepare feedback entry
    const feedbackEntry = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      simulationId,
      userId,
      score,
      comment: comment || null,
      timestamp,
    }

    // Read existing feedback data
    const existingData = await readFeedbackData()

    // Append new feedback
    existingData.push(feedbackEntry)

    // Write updated data back to file
    await writeFeedbackData(existingData)

    logger.info(`NPS feedback submitted: User ${userId}, Simulation ${simulationId}, Score ${score}`)

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedbackEntry,
    })
  } catch (error) {
    logger.error("Error processing NPS feedback:", error)

    return NextResponse.json(
      { error: `Failed to process feedback: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}

// GET endpoint for admin access to view all feedback
export async function GET() {
  try {
    // Get all feedback entries from file
    const allFeedback = await readFeedbackData()

    return NextResponse.json({
      success: true,
      count: allFeedback.length,
      data: allFeedback,
    })
  } catch (error) {
    logger.error("Error retrieving NPS feedback:", error)

    return NextResponse.json(
      { error: `Failed to retrieve feedback: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
