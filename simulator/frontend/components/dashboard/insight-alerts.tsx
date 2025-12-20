"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface InsightAlertsProps {
  feedbackData: any[]
  sessionSummaries: any[]
}

export function InsightAlerts({ feedbackData, sessionSummaries }: InsightAlertsProps) {
  const [dismissed, setDismissed] = useState<string[]>([])

  // Generate alerts
  const alerts = generateAlerts(feedbackData, sessionSummaries).filter((alert) => !dismissed.includes(alert.id))

  if (alerts.length === 0) {
    return null
  }

  const handleDismiss = (id: string) => {
    setDismissed((prev) => [...prev, id])
  }

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-amber-800">Insight Alerts</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          System-detected patterns that may require attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} variant="default" className="bg-white border-amber-200">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-1" />
                  <div>
                    <AlertTitle className="text-amber-800 font-medium">{alert.title}</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      {alert.description}
                      <div className="mt-2">
                        <Badge variant="outline" className="mr-1 text-amber-700 border-amber-200">
                          {alert.count} sessions
                        </Badge>
                        <Badge variant="outline" className="text-amber-700 border-amber-200">
                          {alert.tag}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-amber-500 hover:text-amber-700 hover:bg-amber-100"
                  onClick={() => handleDismiss(alert.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Dismiss</span>
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to generate alerts
function generateAlerts(feedbackData, sessionSummaries) {
  const alerts = []

  // Create a map of simulationId to NPS score
  const npsMap = new Map()
  feedbackData.forEach((item) => {
    npsMap.set(item.simulationId, item.score || 0)
  })

  // Check for high engagement but low NPS
  const highEngLowNps = sessionSummaries.filter((session) => {
    const npsScore = npsMap.get(session.simulationId) || 0
    return (session.engagementScore || 0) > 70 && npsScore <= 6
  })

  if (highEngLowNps.length > 0) {
    alerts.push({
      id: "high-eng-low-nps",
      title: "High Engagement, Low NPS",
      description:
        "These sessions show high user engagement but received low NPS scores. This may indicate users are engaged but frustrated.",
      count: highEngLowNps.length,
      tag: "Engagement-NPS Mismatch",
    })
  }

  // Check for sessions with low message count
  const lowMessages = sessionSummaries.filter((session) => {
    return (session.messagesSent || 0) < 3 && (session.durationMinutes || 0) > 2
  })

  if (lowMessages.length > 0) {
    alerts.push({
      id: "low-messages",
      title: "Low Messages Sent",
      description:
        "These sessions have unusually low message counts despite reasonable duration. Users may be confused or experiencing issues.",
      count: lowMessages.length,
      tag: "Low Interaction",
    })
  }

  // Check for sessions with only 1 objective completed
  const lowObjectives = sessionSummaries.filter((session) => {
    return (session.objectivesCompleted || 0) === 1 && (session.durationMinutes || 0) > 5
  })

  if (lowObjectives.length > 0) {
    alerts.push({
      id: "low-objectives",
      title: "Only 1 Objective Completed",
      description:
        "These sessions lasted over 5 minutes but users only completed 1 objective. This may indicate difficulty progressing.",
      count: lowObjectives.length,
      tag: "Progress Blocker",
    })
  }

  return alerts
}
