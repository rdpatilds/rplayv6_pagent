/**
 * Engagement Scorer Utility
 *
 * Calculates engagement scores based on session logs.
 */

// Engagement level types
export type EngagementLevel = "Low" | "Moderate" | "High"

// Interface for engagement score result
export interface EngagementScoreResult {
  sessionId: string
  score: number
  engagementLevel: EngagementLevel
  details: {
    objectivesCompleted: number
    helpUsed: boolean
    durationSeconds: number
    messagesSent: number
    notesUsed: boolean
    expertModeUsed: boolean
    totalEvents: number
  }
  predictedNPSCategory?: "Detractor" | "Passive" | "Promoter"
  confidenceScore?: number
}

// Interface for engagement log entry
export interface EngagementLogEntry {
  type: string
  timestamp: string
  sessionId: string
  simulationId?: string
  userId?: string
  metadata?: Record<string, any>
  receivedAt?: string
}

/**
 * Calculate an engagement score based on session logs
 *
 * @param sessionLogs Array of engagement log entries for a session
 * @returns Engagement score result
 */
export const calculateEngagementScore = (sessionLogs: EngagementLogEntry[]): EngagementScoreResult => {
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
  let engagementLevel: EngagementLevel
  if (score <= 40) {
    engagementLevel = "Low"
  } else if (score <= 70) {
    engagementLevel = "Moderate"
  } else {
    engagementLevel = "High"
  }

  // Calculate predicted NPS category and confidence
  const predictedNPSCategory = predictNPSCategory(score, {
    objectivesCompleted,
    helpUsed,
    durationSeconds,
    messagesSent,
    notesUsed,
  })

  const confidenceScore = calculateConfidenceScore(totalEvents, durationSeconds)

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
    predictedNPSCategory,
    confidenceScore,
  }
}

/**
 * Predict NPS category based on engagement metrics
 *
 * @param score Engagement score
 * @param metrics Engagement metrics
 * @returns Predicted NPS category
 */
export const predictNPSCategory = (
  score: number,
  metrics: {
    objectivesCompleted: number
    helpUsed: boolean
    durationSeconds: number
    messagesSent: number
    notesUsed: boolean
  },
): "Detractor" | "Passive" | "Promoter" => {
  // Simple heuristic for now - can be enhanced with ML later
  if (score < 30) {
    return "Detractor"
  } else if (score < 60) {
    return "Passive"
  } else {
    return "Promoter"
  }
}

/**
 * Calculate confidence score for the prediction
 *
 * @param totalEvents Total number of events
 * @param durationSeconds Session duration in seconds
 * @returns Confidence score (0-100)
 */
export const calculateConfidenceScore = (totalEvents: number, durationSeconds: number): number => {
  // More events and longer duration = higher confidence
  const eventFactor = Math.min(totalEvents / 20, 1) // Max out at 20 events
  const durationFactor = Math.min(durationSeconds / 600, 1) // Max out at 10 minutes

  return Math.round((eventFactor * 0.6 + durationFactor * 0.4) * 100)
}
