"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { HelpCircle } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

interface SimulationTypeBreakdownProps {
  feedbackData: any[]
  sessionSummaries: any[]
}

export function SimulationTypeBreakdown({ feedbackData, sessionSummaries }: SimulationTypeBreakdownProps) {
  // Process data for the chart
  const typeData = processSimulationTypeData(feedbackData, sessionSummaries)

  return (
    <TooltipProvider>
      <Card className="col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>NPS by Simulation Type</CardTitle>
            <TooltipWrapper content="Comparison of NPS scores across different simulation types">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <CardDescription>This chart shows how NPS scores vary across different simulation types.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgNPS" fill="#8884d8" name="Avg NPS Score" />
                  <Bar dataKey="avgEngagement" fill="#82ca9d" name="Avg Engagement Score (scaled)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Not enough data to display simulation type breakdown
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Helper function to process data by simulation type
function processSimulationTypeData(feedbackData, sessionSummaries) {
  if (!feedbackData || feedbackData.length === 0 || !sessionSummaries || sessionSummaries.length === 0) return []

  // Create a map of simulationId to type
  // Note: In a real implementation, you would need to fetch simulation type data
  // This is a placeholder that assumes simulation type is stored in metadata
  const simulationTypes = new Map()
  sessionSummaries.forEach((session) => {
    // Extract type from simulationId for demo purposes
    // In a real implementation, you would use actual type data
    const type = session.simulationId.includes("basic")
      ? "Basic"
      : session.simulationId.includes("advanced")
        ? "Advanced"
        : session.simulationId.includes("expert")
          ? "Expert"
          : "Standard"

    simulationTypes.set(session.simulationId, type)
  })

  // Group feedback by simulation type
  const typeMap = new Map()

  feedbackData.forEach((item) => {
    if (simulationTypes.has(item.simulationId)) {
      const type = simulationTypes.get(item.simulationId)

      if (!typeMap.has(type)) {
        typeMap.set(type, { npsTotal: 0, npsCount: 0, engTotal: 0, engCount: 0 })
      }

      const data = typeMap.get(type)
      data.npsTotal += item.score || 0
      data.npsCount += 1
      typeMap.set(type, data)
    }
  })

  // Add engagement data
  sessionSummaries.forEach((session) => {
    if (simulationTypes.has(session.simulationId)) {
      const type = simulationTypes.get(session.simulationId)

      if (!typeMap.has(type)) {
        typeMap.set(type, { npsTotal: 0, npsCount: 0, engTotal: 0, engCount: 0 })
      }

      const data = typeMap.get(type)
      data.engTotal += session.engagementScore || 0
      data.engCount += 1
      typeMap.set(type, data)
    }
  })

  // Convert to array and calculate averages
  const result = []
  typeMap.forEach((data, type) => {
    result.push({
      type,
      avgNPS: data.npsCount > 0 ? Number.parseFloat((data.npsTotal / data.npsCount).toFixed(1)) : 0,
      avgEngagement: data.engCount > 0 ? Number.parseFloat((data.engTotal / data.engCount / 10).toFixed(1)) : 0, // Scale to 0-10
    })
  })

  return result
}
