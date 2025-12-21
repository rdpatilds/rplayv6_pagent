import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { HelpCircle } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

interface NPSParticipationCardProps {
  feedbackData: any[]
  sessionSummaries: any[]
}

export function NPSParticipationCard({ feedbackData, sessionSummaries }: NPSParticipationCardProps) {
  // Calculate participation rate
  const participationRate = calculateParticipationRate(feedbackData, sessionSummaries)

  // Determine color based on rate
  let color = "bg-gray-500"
  if (participationRate >= 70) color = "bg-green-500"
  else if (participationRate >= 40) color = "bg-yellow-500"
  else if (participationRate > 0) color = "bg-red-500"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>NPS Participation Rate</CardTitle>
          <TooltipProvider>
            <TooltipWrapper content="Percentage of completed simulations that collected NPS feedback. Rates below 40% may indicate survey fatigue or poor timing. Aim for >70% to ensure representative feedback.">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </TooltipProvider>
        </div>
        <CardDescription>Percentage of simulations that collected NPS feedback from users.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-bold mb-2">{participationRate}%</div>
          <Badge className={color + " text-white"}>{getParticipationLabel(participationRate)}</Badge>
          <div className="text-sm text-muted-foreground mt-2">of simulations provided feedback</div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to calculate participation rate
function calculateParticipationRate(feedbackData, sessionSummaries) {
  if (!sessionSummaries || sessionSummaries.length === 0) return 0

  // Count unique simulation IDs in feedback data
  const feedbackSimulationIds = new Set(feedbackData.map((item) => item.simulationId))

  // Count unique simulation IDs in session summaries
  const totalSimulationIds = new Set(sessionSummaries.map((session) => session.simulationId))

  // Calculate rate
  const rate = (feedbackSimulationIds.size / totalSimulationIds.size) * 100

  return Math.round(rate)
}

// Helper function to get label based on rate
function getParticipationLabel(rate) {
  if (rate >= 70) return "High Participation"
  if (rate >= 40) return "Moderate Participation"
  if (rate > 0) return "Low Participation"
  return "No Participation"
}
