"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { HelpCircle } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

interface DetractorReasonsChartProps {
  feedbackData: any[]
  onReasonClick?: (reason: string) => void
}

export function DetractorReasonsChart({ feedbackData, onReasonClick }: DetractorReasonsChartProps) {
  // Process data for the chart
  const reasonsData = processDetractorReasons(feedbackData)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleBarClick = (data, index) => {
    setActiveIndex(index === activeIndex ? null : index)
    if (onReasonClick) {
      onReasonClick(data.category)
    }
  }

  return (
    <TooltipProvider>
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Detractor Reasons</CardTitle>
            <TooltipWrapper content="Categorized reasons extracted from detractor comments (scores 0-6). These represent key pain points that should be prioritized for improvement. Click on a category to filter the feedback table below.">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <CardDescription>
            This chart groups negative feedback into common categories. Use this to identify recurring user concerns.
            Click on a bar to filter feedback by that reason.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {reasonsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={reasonsData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="category" />
                  <Tooltip
                    formatter={(value, name, props) => [`${value} comments`, props.payload.category]}
                    labelFormatter={() => ""}
                    cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                  />
                  <Bar dataKey="count" fill="#ff4d4f" onClick={handleBarClick} cursor="pointer">
                    {reasonsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === activeIndex ? "#ff1f1f" : getReasonColor(index)}
                        stroke={index === activeIndex ? "#000" : "none"}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No detractor feedback available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Helper function to process detractor reasons
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

// Helper function to get colors for reasons
function getReasonColor(index) {
  const colors = ["#ff4d4f", "#ff7a45", "#ffa940", "#ffec3d", "#73d13d"]
  return colors[index % colors.length]
}
