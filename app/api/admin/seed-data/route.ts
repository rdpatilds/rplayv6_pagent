import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { logger } from "@/utils/logger"

// Path to the feedback and engagement log files
const NPS_FEEDBACK_FILE_PATH = path.join(process.cwd(), "tmp", "nps-feedback.json")
const ENGAGEMENT_LOG_FILE_PATH = path.join(process.cwd(), "tmp", "engagement-log.json")

// Ensure the directory exists
async function ensureDirectoryExists(filePath: string) {
  const directory = path.dirname(filePath)
  try {
    await fs.mkdir(directory, { recursive: true })
  } catch (error) {
    logger.error("Error creating directory:", error)
  }
}

// Generate a random date within the last 30 days
function getRandomRecentDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30) + 1 // 1-30 days ago
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

// Generate dates distributed across the last 30 days
function getDistributedDates(count: number) {
  const dates = []
  const now = new Date()

  // Create a distribution across the last 30 days
  // More recent dates should be more common
  for (let i = 0; i < count; i++) {
    // Bias towards more recent dates (last 10 days)
    let daysAgo
    const rand = Math.random()
    if (rand < 0.6) {
      // 60% chance of being in the last 10 days
      daysAgo = Math.floor(Math.random() * 10) + 1
    } else if (rand < 0.85) {
      // 25% chance of being 11-20 days ago
      daysAgo = Math.floor(Math.random() * 10) + 11
    } else {
      // 15% chance of being 21-30 days ago
      daysAgo = Math.floor(Math.random() * 10) + 21
    }

    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    dates.push(date.toISOString())
  }

  return dates
}

// Generate a random user ID
function generateUserId() {
  return `user_${Math.floor(Math.random() * 1000)}_${Math.random().toString(36).substring(2, 7)}`
}

// Generate a random simulation ID
function generateSimulationId() {
  return `sim_${Math.floor(Math.random() * 1000)}_${Math.random().toString(36).substring(2, 9)}`
}

// Generate a random NPS score within a range
function generateNpsScore(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate a random comment
function generateComment(score: number) {
  const promoterComments = [
    "Great experience! I learned a lot from this simulation.",
    "Very realistic scenario. The advisor was helpful and knowledgeable.",
    "I would definitely recommend this to my colleagues. It was very insightful.",
    "Excellent simulation that helped me understand the concepts better.",
    "This was exactly what I needed to prepare for real client interactions.",
    "The simulation was engaging and the scenarios were realistic. I feel more confident now.",
    "I appreciated how the simulation adapted to my responses. Very well designed!",
    null, // Some users don't leave comments
  ]

  const passiveComments = [
    "It was good, but could use some improvements in the response time.",
    "Decent simulation. Some parts were a bit confusing though.",
    "The simulation was helpful, but I think it could be more challenging.",
    "Good experience overall. Would be better with more detailed feedback.",
    "It was fine. Not amazing, but definitely useful.",
    "The scenarios were realistic but the interface could be more intuitive.",
    "I learned some useful techniques, but some of the questions were repetitive.",
    null, // Some users don't leave comments
  ]

  const detractorComments = [
    "I found the simulation confusing and not very helpful.",
    "The advisor didn't seem to understand my questions.",
    "Too basic for my needs. I was expecting more advanced scenarios.",
    "The system was slow and frustrating to use.",
    "I wouldn't recommend this. It needs a lot of improvement.",
    "The simulation didn't address the specific challenges I'm facing in my role.",
    "I encountered several technical issues that made it difficult to complete.",
    "The scenarios weren't realistic enough for practical application.",
    null, // Some users don't leave comments
  ]

  if (score >= 9) {
    return promoterComments[Math.floor(Math.random() * promoterComments.length)]
  } else if (score >= 7) {
    return passiveComments[Math.floor(Math.random() * passiveComments.length)]
  } else {
    return detractorComments[Math.floor(Math.random() * detractorComments.length)]
  }
}

// Generate engagement logs for a simulation
function generateEngagementLogs(
  simulationId: string,
  userId: string,
  timestamp: string,
  engagementLevel: "Low" | "Moderate" | "High",
  npsScore?: number, // Optional NPS score to correlate with
) {
  const sessionId = simulationId // Using simulationId as sessionId for simplicity
  const baseTime = new Date(timestamp).getTime()

  // Determine engagement parameters based on level and optional NPS correlation
  let durationMinutes, messageCount, objectivesCompleted, usedHelp, usedNotes, usedExpertMode

  // If we have an NPS score, we can create more nuanced correlations
  if (npsScore !== undefined) {
    // For mismatches (high NPS, low engagement or vice versa)
    if ((npsScore >= 9 && engagementLevel === "Low") || (npsScore <= 6 && engagementLevel === "High")) {
      // These are our intentional mismatches - use the engagement level as specified
    }
    // For normal correlations, add some randomness but maintain general correlation
    else {
      // Add some randomness to make data more realistic
      const rand = Math.random()
      if (npsScore >= 9 && rand > 0.8) {
        engagementLevel = "Moderate" // 20% of high NPS have moderate engagement
      } else if (npsScore >= 7 && npsScore <= 8) {
        engagementLevel = rand > 0.7 ? "High" : rand > 0.3 ? "Moderate" : "Low"
        // Passives have more varied engagement
      } else if (npsScore <= 6 && rand > 0.8) {
        engagementLevel = "Moderate" // 20% of low NPS have moderate engagement
      }
    }
  }

  // Set parameters based on final engagement level
  switch (engagementLevel) {
    case "High":
      durationMinutes = Math.floor(Math.random() * 15) + 15 // 15-30 minutes
      messageCount = Math.floor(Math.random() * 15) + 15 // 15-30 messages
      objectivesCompleted = Math.floor(Math.random() * 2) + 3 // 3-4 objectives
      usedHelp = Math.random() > 0.3 // 70% chance
      usedNotes = Math.random() > 0.4 // 60% chance
      usedExpertMode = Math.random() > 0.5 // 50% chance
      break
    case "Moderate":
      durationMinutes = Math.floor(Math.random() * 10) + 5 // 5-15 minutes
      messageCount = Math.floor(Math.random() * 10) + 5 // 5-15 messages
      objectivesCompleted = Math.floor(Math.random() * 2) + 1 // 1-2 objectives
      usedHelp = Math.random() > 0.5 // 50% chance
      usedNotes = Math.random() > 0.7 // 30% chance
      usedExpertMode = Math.random() > 0.7 // 30% chance
      break
    case "Low":
      durationMinutes = Math.floor(Math.random() * 5) + 1 // 1-5 minutes
      messageCount = Math.floor(Math.random() * 5) + 1 // 1-5 messages
      objectivesCompleted = Math.random() > 0.7 ? 1 : 0 // 0-1 objectives
      usedHelp = Math.random() > 0.8 // 20% chance
      usedNotes = Math.random() > 0.9 // 10% chance
      usedExpertMode = Math.random() > 0.9 // 10% chance
      break
  }

  // Generate logs
  const logs = []

  // Simulation load event
  logs.push({
    type: "simulation_load",
    timestamp: new Date(baseTime).toISOString(),
    sessionId,
    simulationId,
    userId,
    metadata: {
      simulationType: ["insurance", "financial_planning", "retirement", "investment"][Math.floor(Math.random() * 4)],
    },
  })

  // Message events
  for (let i = 0; i < messageCount; i++) {
    const messageTime = new Date(baseTime + (i + 1) * 60000) // 1 minute between messages
    logs.push({
      type: "message_sent",
      timestamp: messageTime.toISOString(),
      sessionId,
      simulationId,
      userId,
      metadata: {
        messageLength: Math.floor(Math.random() * 200) + 50, // 50-250 characters
      },
    })
  }

  // Help usage events
  if (usedHelp) {
    const helpTime = new Date(baseTime + Math.floor(Math.random() * durationMinutes * 60000))
    logs.push({
      type: "help_opened",
      timestamp: helpTime.toISOString(),
      sessionId,
      simulationId,
      userId,
      metadata: {},
    })

    // Help closed event (1-3 minutes later)
    const helpClosedTime = new Date(helpTime.getTime() + (Math.floor(Math.random() * 3) + 1) * 60000)
    logs.push({
      type: "help_closed",
      timestamp: helpClosedTime.toISOString(),
      sessionId,
      simulationId,
      userId,
      metadata: {},
    })
  }

  // Expert mode toggle events
  if (usedExpertMode) {
    const expertModeTime = new Date(baseTime + Math.floor(Math.random() * durationMinutes * 60000))
    logs.push({
      type: "expert_mode_toggled",
      timestamp: expertModeTime.toISOString(),
      sessionId,
      simulationId,
      userId,
      metadata: {
        enabled: true,
      },
    })

    // Maybe toggle back
    if (Math.random() > 0.5) {
      const toggleBackTime = new Date(expertModeTime.getTime() + (Math.floor(Math.random() * 5) + 2) * 60000)
      logs.push({
        type: "expert_mode_toggled",
        timestamp: toggleBackTime.toISOString(),
        sessionId,
        simulationId,
        userId,
        metadata: {
          enabled: false,
        },
      })
    }
  }

  // Notes usage events
  if (usedNotes) {
    const noteTime = new Date(baseTime + Math.floor(Math.random() * durationMinutes * 60000))
    logs.push({
      type: "note_created",
      timestamp: noteTime.toISOString(),
      sessionId,
      simulationId,
      userId,
      metadata: {},
    })

    // Note update events (1-3 updates)
    const updateCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < updateCount; i++) {
      const updateTime = new Date(noteTime.getTime() + (i + 1) * 120000) // 2 minutes between updates
      logs.push({
        type: "note_updated",
        timestamp: updateTime.toISOString(),
        sessionId,
        simulationId,
        userId,
        metadata: {
          noteLength: Math.floor(Math.random() * 300) + 50, // 50-350 characters
          changeSize: Math.floor(Math.random() * 50) + 10, // 10-60 characters
        },
      })
    }
  }

  // Objective completion events
  for (let i = 0; i < objectivesCompleted; i++) {
    const objectiveTime = new Date(baseTime + Math.floor(Math.random() * durationMinutes * 60000))
    logs.push({
      type: "objective_completed",
      timestamp: objectiveTime.toISOString(),
      sessionId,
      simulationId,
      userId,
      metadata: {
        objectiveId: `obj_${i + 1}`,
        objectiveName: `Sample Objective ${i + 1}`,
      },
    })
  }

  // Simulation exit event
  logs.push({
    type: "simulation_exit",
    timestamp: new Date(baseTime + durationMinutes * 60000).toISOString(),
    sessionId,
    simulationId,
    userId,
    metadata: {
      isEngagementSummary: true,
      totalMessages: messageCount,
      timeInSimulationMinutes: durationMinutes,
      usedNeedsHelp: usedHelp,
      exitedEarly: durationMinutes < 5,
      objectivesCompleted,
      coachingInteractions: usedHelp ? 1 : 0,
      tookNotes: usedNotes,
      usedExpertMode: usedExpertMode,
      completionRate: objectivesCompleted > 0 ? (objectivesCompleted / 5) * 100 : 0, // Assuming 5 total objectives
    },
  })

  return logs
}

// Calculate engagement score based on the logs
function calculateEngagementScore(logs) {
  // Extract the summary event
  const summaryEvent = logs.find((log) => log.type === "simulation_exit" && log.metadata?.isEngagementSummary)

  if (!summaryEvent) return { score: 0, level: "Low" }

  const { timeInSimulationMinutes, objectivesCompleted, usedNeedsHelp, totalMessages, tookNotes, usedExpertMode } =
    summaryEvent.metadata

  let score = 0

  // Time spent > 5 mins = +30 pts
  if (timeInSimulationMinutes > 5) score += 30

  // Objectives completed = +10 pts each
  score += objectivesCompleted * 10

  // Help used = +10 pts
  if (usedNeedsHelp) score += 10

  // Expert toggle used = +10 pts
  if (usedExpertMode) score += 10

  // 10 messages sent = +10 pts
  score += Math.floor(totalMessages / 10) * 10

  // Notes used = +10 pts
  if (tookNotes) score += 10

  // Cap at 100
  score = Math.min(score, 100)

  // Determine level
  let level
  if (score <= 40) level = "Low"
  else if (score <= 70) level = "Moderate"
  else level = "High"

  return { score, level }
}

// Generate mock NPS feedback data with better distribution
function generateMockNpsFeedback(count = 30) {
  const feedbackEntries = []
  const dates = getDistributedDates(count)

  // Distribution: 40% promoters, 30% passives, 30% detractors
  const promoterCount = Math.floor(count * 0.4)
  const passiveCount = Math.floor(count * 0.3)
  const detractorCount = count - promoterCount - passiveCount

  // Generate promoters (9-10)
  for (let i = 0; i < promoterCount; i++) {
    const userId = generateUserId()
    const simulationId = generateSimulationId()
    const score = generateNpsScore(9, 10)
    const timestamp = dates.pop() || getRandomRecentDate()
    const comment = generateComment(score)

    // Determine if this should be a mismatch (10% chance)
    const isMismatch = Math.random() < 0.1

    feedbackEntries.push({
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      simulationId,
      userId,
      score,
      comment,
      timestamp,
      // This will be matched with appropriate engagement logs
      _specialCase: isMismatch ? "highNpsLowEngagement" : "normal",
    })
  }

  // Generate passives (7-8)
  for (let i = 0; i < passiveCount; i++) {
    const userId = generateUserId()
    const simulationId = generateSimulationId()
    const score = generateNpsScore(7, 8)
    const timestamp = dates.pop() || getRandomRecentDate()
    const comment = generateComment(score)

    feedbackEntries.push({
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      simulationId,
      userId,
      score,
      comment,
      timestamp,
      _specialCase: "normal",
    })
  }

  // Generate detractors (0-6)
  for (let i = 0; i < detractorCount; i++) {
    const userId = generateUserId()
    const simulationId = generateSimulationId()
    const score = generateNpsScore(0, 6)
    const timestamp = dates.pop() || getRandomRecentDate()
    const comment = generateComment(score)

    // Determine if this should be a mismatch (10% chance)
    const isMismatch = Math.random() < 0.1

    feedbackEntries.push({
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      simulationId,
      userId,
      score,
      comment,
      timestamp,
      // This will be matched with appropriate engagement logs
      _specialCase: isMismatch ? "lowNpsHighEngagement" : "normal",
    })
  }

  return feedbackEntries
}

// Generate engagement logs for all feedback entries
function generateMatchingEngagementLogs(feedbackEntries) {
  let allLogs = []

  for (const entry of feedbackEntries) {
    let engagementLevel: "Low" | "Moderate" | "High"

    // Handle special cases for mismatches
    if (entry._specialCase === "highNpsLowEngagement") {
      engagementLevel = "Low"
    } else if (entry._specialCase === "lowNpsHighEngagement") {
      engagementLevel = "High"
    } else {
      // Normal cases: determine engagement level based on NPS score
      if (entry.score >= 9) {
        engagementLevel = Math.random() > 0.8 ? "Moderate" : "High" // 80% High, 20% Moderate
      } else if (entry.score >= 7) {
        // More varied for passives
        const rand = Math.random()
        if (rand < 0.6) engagementLevel = "Moderate"
        else if (rand < 0.8) engagementLevel = "High"
        else engagementLevel = "Low"
      } else {
        engagementLevel = Math.random() > 0.8 ? "Moderate" : "Low" // 80% Low, 20% Moderate
      }
    }

    // Remove the special case marker
    delete entry._specialCase

    const logs = generateEngagementLogs(entry.simulationId, entry.userId, entry.timestamp, engagementLevel, entry.score)

    // Calculate and store the engagement score
    const { score, level } = calculateEngagementScore(logs)
    entry.engagementScore = score
    entry.engagementLevel = level

    allLogs = [...allLogs, ...logs]
  }

  return allLogs
}

// Generate additional engagement-only sessions (no NPS feedback)
function generateAdditionalEngagementSessions(count = 10) {
  let allLogs = []

  for (let i = 0; i < count; i++) {
    const userId = generateUserId()
    const simulationId = generateSimulationId()
    const timestamp = getRandomRecentDate()

    // Random engagement level
    const levels = ["Low", "Moderate", "High"]
    const engagementLevel = levels[Math.floor(Math.random() * levels.length)] as "Low" | "Moderate" | "High"

    const logs = generateEngagementLogs(simulationId, userId, timestamp, engagementLevel)
    allLogs = [...allLogs, ...logs]
  }

  return allLogs
}

export async function POST() {
  try {
    // Ensure directories exist
    await ensureDirectoryExists(NPS_FEEDBACK_FILE_PATH)
    await ensureDirectoryExists(ENGAGEMENT_LOG_FILE_PATH)

    // Generate mock NPS feedback (30 entries)
    const feedbackEntries = generateMockNpsFeedback(30)

    // Generate matching engagement logs
    const engagementLogs = generateMatchingEngagementLogs(feedbackEntries)

    // Generate additional engagement-only sessions (10 entries)
    const additionalLogs = generateAdditionalEngagementSessions(10)

    // Combine all logs
    const allLogs = [...engagementLogs, ...additionalLogs]

    // Write to files
    await fs.writeFile(NPS_FEEDBACK_FILE_PATH, JSON.stringify(feedbackEntries, null, 2))
    await fs.writeFile(ENGAGEMENT_LOG_FILE_PATH, JSON.stringify(allLogs, null, 2))

    return NextResponse.json({
      success: true,
      message: "Mock data seeded successfully",
      stats: {
        feedbackEntries: feedbackEntries.length,
        engagementLogs: allLogs.length,
        withNpsFeedback: engagementLogs.length,
        engagementOnly: additionalLogs.length,
      },
    })
  } catch (error) {
    logger.error("Error seeding mock data:", error)
    return NextResponse.json(
      { error: `Failed to seed mock data: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
