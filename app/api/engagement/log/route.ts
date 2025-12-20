import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { logger } from "@/utils/logger"

// Path to the engagement log file
const ENGAGEMENT_LOG_FILE_PATH = path.join(process.cwd(), "tmp", "engagement-log.json")

// Helper function to read engagement logs
async function readEngagementLogs() {
  try {
    // Check if file exists
    try {
      await fs.promises.access(ENGAGEMENT_LOG_FILE_PATH)
    } catch (error) {
      // File doesn't exist, return empty array
      return []
    }

    // Read and parse the file
    const data = await fs.promises.readFile(ENGAGEMENT_LOG_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    logger.error("Error reading engagement logs:", error)
    return []
  }
}

// GET endpoint to retrieve engagement logs
export async function GET(request: NextRequest) {
  try {
    const logs = await readEngagementLogs()

    // Check if we need to filter by sessionId
    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (sessionId) {
      // Filter logs by sessionId
      const filteredLogs = logs.filter((log: any) => log.sessionId === sessionId)

      return NextResponse.json({
        success: true,
        count: filteredLogs.length,
        data: filteredLogs,
      })
    }

    // Return all logs if no sessionId provided
    return NextResponse.json({
      success: true,
      count: logs.length,
      data: logs,
    })
  } catch (error: any) {
    logger.error("Error retrieving engagement logs:", error)

    return NextResponse.json(
      { error: `Failed to retrieve engagement logs: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
