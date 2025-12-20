import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"

// Define the log file path
const LOG_FILE_PATH = "/tmp/engagement-log.json"

// Interface for engagement score response
interface EngagementScoreResponse {
  sessionId: string
  score: number
  engagementLevel: "Low" | "Moderate" | "High"
  details: {
    objectivesCompleted: number
    helpUsed: boolean
    durationSeconds: number
    messagesSent: number
    notesUsed: boolean
    expertModeUsed: boolean
    totalEvents: number
  }
}

// Read the engagement logs
const readLogs = (): any[] => {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      return []
    }

    const data = fs.readFileSync(LOG_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading logs:", error)
    return []
  }
}

// Calculate the engagement score based on session logs
const calculateEngagementScore = (sessionLogs: any[]): EngagementScoreResponse => {
  // Initialize score and metrics
  let score = 0
  let objectivesCompleted = 0
  let helpUsed = false
  let expertModeUsed = false
  let messagesSent = 0
  let notesUsed = false
  let durationSeconds = 0

  // Get the total number of events
  const totalEvents = sessionLogs.length

  // If there are fewer than 3 events, automatically classify as low engagement
  if (totalEvents < 3) {
    return {
      sessionId: sessionLogs[0]?.sessionId || "unknown",
      score: 0,
      engagementLevel: "Low",
      details: {
        objectivesCompleted: 0,
        helpUsed: false,
        durationSeconds: 0,
        messagesSent: 0,
        notesUsed: false,
        expertModeUsed: false,
        totalEvents,
      },
    }
  }

  // Sort logs by timestamp
  const sortedLogs = [...sessionLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Calculate session duration if there are at least two events
  if (sortedLogs.length >= 2) {
    const firstEvent = new Date(sortedLogs[0].timestamp).getTime()
    const lastEvent = new Date(sortedLogs[sortedLogs.length - 1].timestamp).getTime()
    durationSeconds = Math.round((lastEvent - firstEvent) / 1000)

    // Time spent > 5 mins = +30 pts
    if (durationSeconds > 300) {
      score += 30
    }
  }

  // Process each log entry to calculate metrics
  for (const log of sessionLogs) {
    switch (log.type) {
      case "objective_completed":
        objectivesCompleted++
        break
      case "help_opened":
        helpUsed = true
        break
      case "expert_mode_toggle":
        if (log.metadata?.enabled) {
          expertModeUsed = true
        }
        break
      case "message_sent":
        messagesSent++
        break
      case "note_created":
      case "note_updated":
        notesUsed = true
        break
    }
  }

  // Objectives completed = +10 pts each
  score += objectivesCompleted * 10

  // Help used = +10 pts
  if (helpUsed) {
    score += 10
  }

  // Expert toggle used = +10 pts
  if (expertModeUsed) {
    score += 10
  }

  // 10 messages sent = +10 pts (proportional)
  score += Math.floor(messagesSent / 10) * 10

  // Notes used = +10 pts (additional metric not in original requirements)
  if (notesUsed) {
    score += 10
  }

  // Cap the score at 100
  score = Math.min(score, 100)

  // Determine engagement level
  let engagementLevel: "Low" | "Moderate" | "High"
  if (score <= 40) {
    engagementLevel = "Low"
  } else if (score <= 70) {
    engagementLevel = "Moderate"
  } else {
    engagementLevel = "High"
  }

  return {
    sessionId: sessionLogs[0]?.sessionId || "unknown",
    score,
    engagementLevel,
    details: {
      objectivesCompleted,
      helpUsed,
      durationSeconds,
      messagesSent,
      notesUsed,
      expertModeUsed,
      totalEvents,
    },
  }
}

// Handle GET requests to calculate engagement score
export async function GET(request: NextRequest) {
  try {
    // Get the sessionId from query params
    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 })
    }

    // Read all logs
    const allLogs = readLogs()

    // Filter logs for the specified session
    const sessionLogs = allLogs.filter((log) => log.sessionId === sessionId)

    if (sessionLogs.length === 0) {
      return NextResponse.json({ error: "No logs found for the specified sessionId" }, { status: 404 })
    }

    // Calculate the engagement score
    const scoreResult = calculateEngagementScore(sessionLogs)

    // Return the result
    return NextResponse.json(scoreResult)
  } catch (error) {
    console.error("Error calculating engagement score:", error)
    return NextResponse.json({ error: "Failed to calculate engagement score" }, { status: 500 })
  }
}

// Handle POST requests to calculate engagement score
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId in request body" }, { status: 400 })
    }

    // Read all logs
    const allLogs = readLogs()

    // Filter logs for the specified session
    const sessionLogs = allLogs.filter((log) => log.sessionId === sessionId)

    if (sessionLogs.length === 0) {
      return NextResponse.json({ error: "No logs found for the specified sessionId" }, { status: 404 })
    }

    // Calculate the engagement score
    const scoreResult = calculateEngagementScore(sessionLogs)

    // Return the result
    return NextResponse.json(scoreResult)
  } catch (error) {
    console.error("Error calculating engagement score:", error)
    return NextResponse.json({ error: "Failed to calculate engagement score" }, { status: 500 })
  }
}
