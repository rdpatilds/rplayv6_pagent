import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { HelpCircle } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

interface TimeToSubmitCardProps {
  feedbackData: any[]
  sessionSummaries: any[]
}

export function TimeToSubmitCard({ feedbackData, sessionSummaries }: TimeToSubmitCardProps) {
  // Calculate average time to submit
  const avgTimeMinutes = calculateAverageTimeToSubmit(feedbackData, sessionSummaries)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Time to Submit NPS</CardTitle>
          <TooltipProvider>
            <TooltipWrapper content="Average time between simulation end and NPS form submission. Immediate feedback (0-2 minutes) captures in-the-moment reactions, while delayed responses may reflect more considered opinions.">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </TooltipProvider>
        </div>
        <CardDescription>Average time between simulation end and NPS form submission.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center mb-2">
            <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
            <div className="text-4xl font-bold">{avgTimeMinutes}</div>
          </div>
          <div className="text-sm text-muted-foreground">avg. minutes after simulation</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to calculate average time to submit
function calculateAverageTimeToSubmit(feedbackData, sessionSummaries) {
  if (!feedbackData || !sessionSummaries || feedbackData.length === 0 || sessionSummaries.length === 0) return "N/A"

  // Create a map of simulation end times
  const simulationEndTimes = new Map()

  sessionSummaries.forEach((session) => {
    // Find the simulation exit event
    if (session.timestamp) {
      simulationEndTimes.set(session.simulationId, new Date(session.timestamp))
    }
  })

  // Calculate time differences
  let totalMinutes = 0
  let count = 0

  feedbackData.forEach((feedback) => {
    if (simulationEndTimes.has(feedback.simulationId) && feedback.timestamp) {
      const endTime = simulationEndTimes.get(feedback.simulationId)
      const submitTime = new Date(feedback.timestamp)

      // Only count if submission is after simulation end
      if (submitTime > endTime) {
        const diffMs = submitTime.getTime() - endTime.getTime()
        const diffMinutes = Math.round(diffMs / (1000 * 60))

        // Only count reasonable times (less than 1 day)
        if (diffMinutes < 1440) {
          totalMinutes += diffMinutes
          count++
        }
      }
    }
  })

  if (count === 0) return "N/A"

  return Math.round(totalMinutes / count)
}
