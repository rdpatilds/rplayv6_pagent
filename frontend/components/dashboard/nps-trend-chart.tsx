"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { HelpCircle } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

interface NPSTrendChartProps {
  feedbackData: any[]
}

export function NPSTrendChart({ feedbackData }: NPSTrendChartProps) {
  // Process data for the chart
  const trendData = processNPSTrendData(feedbackData)

  return (
    <TooltipProvider>
      <Card className="col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>NPS Score Trend (Last 30 Days)</CardTitle>
            <TooltipWrapper content="Average NPS score trend over the last 30 days. Look for patterns related to product updates, marketing campaigns, or user cohorts. Consistent upward trends indicate improving user satisfaction.">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <CardDescription>
            This line graph shows how the average NPS score has changed over the past 30 days. Spikes or drops may
            indicate shifts in user experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Avg NPS Score"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Not enough data to display trend
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Helper function to process data for the NPS trend chart
function processNPSTrendData(feedbackData) {
  if (!feedbackData || feedbackData.length === 0) return []

  // Create a map to store daily averages
  const dailyScores = new Map()

  // Get date range (last 30 days)
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  // Initialize all dates in the range with null values
  for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    dailyScores.set(dateStr, { total: 0, count: 0 })
  }

  // Aggregate scores by date
  feedbackData.forEach((item) => {
    const date = new Date(item.timestamp)
    if (date >= thirtyDaysAgo && date <= today) {
      const dateStr = date.toISOString().split("T")[0]

      if (!dailyScores.has(dateStr)) {
        dailyScores.set(dateStr, { total: 0, count: 0 })
      }

      const current = dailyScores.get(dateStr)
      current.total += item.score || 0
      current.count += 1
      dailyScores.set(dateStr, current)
    }
  })

  // Convert to array and calculate averages
  const result = []
  dailyScores.forEach((value, key) => {
    result.push({
      date: key,
      avgScore: value.count > 0 ? Number.parseFloat((value.total / value.count).toFixed(1)) : null,
    })
  })

  // Sort by date
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Filter out days with no data and ensure we have at least some data points
  const filteredResult = result.filter((item) => item.avgScore !== null)

  // If we have very few data points, we might want to return an empty array
  return filteredResult.length > 1 ? filteredResult : []
}
