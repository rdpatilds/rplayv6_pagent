"use client"

import { useEffect } from "react"
// Import Phase 4-6 components (commented out for now)
// import { InsightsSummary } from "@/components/dashboard/insights-summary"
// import { SimulationTypeBreakdown } from "@/components/dashboard/simulation-type-breakdown"
// import { InsightAlerts } from "@/components/dashboard/insight-alerts"

import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function FeedbackSummaryPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/feedback")
  }, [router])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Redirecting...</h1>
      <p className="mb-6">The Analytics Dashboard has moved. Redirecting you to the new location.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="w-full h-[200px]" />
        ))}
      </div>
    </div>
  )
}

// Helper functions for processing engagement data
function processEngagementData(engagementData) {
  const sessionSummaries = []
  const sessionMap = new Map()

  // Group logs by session ID
  engagementData.forEach((log) => {
    if (!sessionMap.has(log.sessionId)) {
      sessionMap.set(log.sessionId, [])
    }
    sessionMap.get(log.sessionId).push(log)
  })

  // Process each session
  sessionMap.forEach((logs, sessionId) => {
    // Find the summary event
    const summaryEvent = logs.find((log) => log.type === "simulation_exit" && log.metadata?.isEngagementSummary)

    if (summaryEvent) {
      sessionSummaries.push({
        sessionId,
        simulationId: summaryEvent.simulationId,
        userId: summaryEvent.userId,
        timestamp: summaryEvent.timestamp,
        durationMinutes: summaryEvent.metadata.timeInSimulationMinutes || 0,
        messagesSent: summaryEvent.metadata.totalMessages || 0,
        objectivesCompleted: summaryEvent.metadata.objectivesCompleted || 0,
        usedHelp: summaryEvent.metadata.usedNeedsHelp || false,
        usedNotes: summaryEvent.metadata.tookNotes || false,
        usedExpertMode: summaryEvent.metadata.usedExpertMode || false,
        exitedEarly: summaryEvent.metadata.exitedEarly || false,
        // Calculate engagement score
        engagementScore: calculateEngagementScoreFromSummary(summaryEvent.metadata),
      })
    }
  })

  return sessionSummaries
}

function calculateEngagementScoreFromSummary(metadata) {
  let score = 0

  // Time spent > 5 mins = +30 pts
  if ((metadata.timeInSimulationMinutes || 0) > 5) score += 30

  // Objectives completed = +10 pts each
  score += (metadata.objectivesCompleted || 0) * 10

  // Help used = +10 pts
  if (metadata.usedNeedsHelp) score += 10

  // Expert toggle used = +10 pts
  if (metadata.usedExpertMode) score += 10

  // 10 messages sent = +10 pts
  score += Math.floor((metadata.totalMessages || 0) / 10) * 10

  // Notes used = +10 pts
  if (metadata.tookNotes) score += 10

  // Cap at 100
  score = Math.min(score, 100)

  return score
}

// Helper functions for NPS calculations
function calculateAverageNPS(data) {
  if (data.length === 0) return 0
  const sum = data.reduce((acc, item) => acc + (item.score || 0), 0)
  return sum / data.length
}

function calculateNPSDistribution(data) {
  const total = data.length
  if (total === 0) return { promoters: 0, passives: 0, detractors: 0 }

  const promoters = data.filter((item) => (item.score || 0) >= 9).length
  const passives = data.filter((item) => (item.score || 0) >= 7 && (item.score || 0) <= 8).length
  const detractors = data.filter((item) => (item.score || 0) <= 6).length

  return {
    promoters: Math.round((promoters / total) * 100),
    passives: Math.round((passives / total) * 100),
    detractors: Math.round((detractors / total) * 100),
  }
}

// Helper functions for engagement calculations
function calculateAverageSessionDuration(sessionSummaries) {
  if (sessionSummaries.length === 0) return 0
  const sum = sessionSummaries.reduce((acc, session) => acc + (session.durationMinutes || 0), 0)
  return Math.round(sum / sessionSummaries.length)
}

function calculateEngagementDistribution(sessionSummaries) {
  const total = sessionSummaries.length
  if (total === 0) return { high: 0, moderate: 0, low: 0 }

  const high = sessionSummaries.filter((session) => (session.engagementScore || 0) > 70).length
  const moderate = sessionSummaries.filter(
    (session) => (session.engagementScore || 0) > 40 && (session.engagementScore || 0) <= 70,
  ).length
  const low = sessionSummaries.filter((session) => (session.engagementScore || 0) <= 40).length

  return {
    high: Math.round((high / total) * 100),
    moderate: Math.round((moderate / total) * 100),
    low: Math.round((low / total) * 100),
  }
}

function calculateAverageMessagesSent(sessionSummaries) {
  if (sessionSummaries.length === 0) return 0
  const sum = sessionSummaries.reduce((acc, session) => acc + (session.messagesSent || 0), 0)
  return Math.round(sum / sessionSummaries.length)
}

function calculateHelpUsagePercentage(sessionSummaries) {
  if (sessionSummaries.length === 0) return 0
  const usedHelp = sessionSummaries.filter((session) => session.usedHelp).length
  return Math.round((usedHelp / sessionSummaries.length) * 100)
}

function calculateNotesUsagePercentage(sessionSummaries) {
  if (sessionSummaries.length === 0) return 0
  const usedNotes = sessionSummaries.filter((session) => session.usedNotes).length
  return Math.round((usedNotes / sessionSummaries.length) * 100)
}

function calculateAverageObjectivesCompleted(sessionSummaries) {
  if (sessionSummaries.length === 0) return 0
  const sum = sessionSummaries.reduce((acc, session) => acc + (session.objectivesCompleted || 0), 0)
  return (sum / sessionSummaries.length).toFixed(1)
}

// Helper functions for correlation calculations
function calculateAvgEngagementByNPSCategory(feedbackData, sessionSummaries, category) {
  // Create a map of simulationId to engagement score
  const engagementMap = new Map()
  sessionSummaries.forEach((session) => {
    engagementMap.set(session.simulationId, session.engagementScore || 0)
  })

  // Filter feedback by NPS category
  let filteredFeedback
  if (category === "promoter") {
    filteredFeedback = feedbackData.filter((item) => (item.score || 0) >= 9)
  } else if (category === "passive") {
    filteredFeedback = feedbackData.filter((item) => (item.score || 0) >= 7 && (item.score || 0) <= 8)
  } else {
    // detractor
    filteredFeedback = feedbackData.filter((item) => (item.score || 0) <= 6)
  }

  // Calculate average engagement score for this category
  let totalScore = 0
  let count = 0

  filteredFeedback.forEach((item) => {
    if (engagementMap.has(item.simulationId)) {
      totalScore += engagementMap.get(item.simulationId)
      count++
    }
  })

  return count > 0 ? Math.round(totalScore / count) : 0
}

function calculateMismatchPercentage(feedbackData, sessionSummaries) {
  // Create a map of simulationId to engagement score
  const engagementMap = new Map()
  sessionSummaries.forEach((session) => {
    engagementMap.set(session.simulationId, session.engagementScore || 0)
  })

  let mismatchCount = 0
  let totalWithBoth = 0

  feedbackData.forEach((item) => {
    if (engagementMap.has(item.simulationId)) {
      totalWithBoth++
      const npsScore = item.score || 0
      const engagementScore = engagementMap.get(item.simulationId)

      // Check for mismatches
      if ((npsScore >= 9 && engagementScore <= 40) || (npsScore <= 6 && engagementScore > 70)) {
        mismatchCount++
      }
    }
  })

  return totalWithBoth > 0 ? Math.round((mismatchCount / totalWithBoth) * 100) : 0
}

function calculateSpecificMismatch(feedbackData, sessionSummaries, type) {
  // Create a map of simulationId to engagement score
  const engagementMap = new Map()
  sessionSummaries.forEach((session) => {
    engagementMap.set(session.simulationId, session.engagementScore || 0)
  })

  let mismatchCount = 0
  let totalWithBoth = 0

  feedbackData.forEach((item) => {
    if (engagementMap.has(item.simulationId)) {
      totalWithBoth++
      const npsScore = item.score || 0
      const engagementScore = engagementMap.get(item.simulationId)

      // Check for specific mismatch type
      if (type === "highNpsLowEngagement" && npsScore >= 9 && engagementScore <= 40) {
        mismatchCount++
      } else if (type === "lowNpsHighEngagement" && npsScore <= 6 && engagementScore > 70) {
        mismatchCount++
      }
    }
  })

  return totalWithBoth > 0 ? Math.round((mismatchCount / totalWithBoth) * 100) : 0
}

function calculateNPS(data) {
  const total = data.length
  if (total === 0) return 0

  const promoters = data.filter((item) => (item.score || 0) >= 9).length
  const detractors = data.filter((item) => (item.score || 0) <= 6).length

  const promoterPercentage = promoters / total
  const detractorPercentage = detractors / total

  // NPS formula: (% Promoters - % Detractors) × 100
  const nps = Math.round((promoterPercentage - detractorPercentage) * 100)

  return nps
}
