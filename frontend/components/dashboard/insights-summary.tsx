"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface InsightsSummaryProps {
  feedbackData: any[]
  sessionSummaries: any[]
}

export function InsightsSummary({ feedbackData, sessionSummaries }: InsightsSummaryProps) {
  // Generate insights based on the data
  const insights = generateInsights(feedbackData, sessionSummaries)

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dashboard Insights</CardTitle>
        </div>
        <CardDescription>Automatically generated insights based on your feedback and engagement data.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <p className="text-muted-foreground">{insights}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to generate insights
function generateInsights(feedbackData, sessionSummaries) {
  if (feedbackData.length === 0 || sessionSummaries.length === 0) {
    return "Not enough data to generate insights. As more users provide feedback, we'll identify patterns and trends."
  }

  // Calculate key metrics
  const avgNPS = calculateAverageNPS(feedbackData)
  const npsDistribution = calculateNPSDistribution(feedbackData)
  const engagementDistribution = calculateEngagementDistribution(sessionSummaries)

  // Get top detractor reason
  const detractorReasons = processDetractorReasons(feedbackData)
  const topReason = detractorReasons.length > 0 ? detractorReasons[0].category : null

  // Generate insights text
  let insights = `Over the last 30 days, the average NPS score has been ${avgNPS.toFixed(1)}. `

  if (npsDistribution.promoters > npsDistribution.detractors) {
    insights += `Most users (${npsDistribution.promoters}%) rated the simulation highly. `
  } else if (npsDistribution.detractors > npsDistribution.promoters) {
    insights += `A significant portion (${npsDistribution.detractors}%) of users gave low ratings. `
  } else {
    insights += `User ratings are evenly distributed across score ranges. `
  }

  if (topReason) {
    insights += `The most cited detractor reason is '${topReason}'. `
  }

  if (engagementDistribution.high > 50) {
    insights += `Engagement is generally high across sessions.`
  } else if (engagementDistribution.low > 50) {
    insights += `Many sessions show low engagement levels.`
  } else {
    insights += `Engagement levels vary across sessions.`
  }

  return insights
}

// Helper functions (simplified versions of those in the main page)
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

function processDetractorReasons(feedbackData) {
  if (!feedbackData || feedbackData.length === 0) return []

  // Filter for detractors with comments
  const detractors = feedbackData.filter((item) => (item.score || 0) <= 6 && item.comment)

  if (detractors.length === 0) return []

  // Define categories and keywords
  const categories = {
    Confusion: ["confus", "unclear", "didn't understand", "complex", "complicated", "hard to follow"],
    Relevance: ["irrelevant", "not relevant", "not applicable", "doesn't apply", "not useful"],
    "Technical Issues": ["bug", "error", "crash", "froze", "slow", "technical", "glitch"],
    "Content Quality": ["basic", "simple", "shallow", "not detailed", "not enough", "limited"],
    "User Experience": ["interface", "difficult to use", "frustrating", "annoying", "cumbersome", "UX"],
  }

  // Count occurrences of each category
  const categoryCounts = {}

  detractors.forEach((item) => {
    const comment = item.comment.toLowerCase()

    for (const [category, keywords] of Object.entries(categories)) {
      const hasKeyword = keywords.some((keyword) => comment.includes(keyword.toLowerCase()))

      if (hasKeyword) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      }
    }
  })

  // Convert to array and sort by count
  const result = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 categories

  return result
}
