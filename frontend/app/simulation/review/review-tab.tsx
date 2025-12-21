"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompetencyCard } from "./competency-card"
import { ConversationAnalysis } from "./conversation-analysis"
import type { PerformanceReview } from "@/app/api/simulation/review-actions"

export function ReviewTab({ review }: { review: PerformanceReview }) {
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Overall Score</h3>
            <div className="text-4xl font-bold">{review.overallScore}/10</div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700">{review.summary}</p>
          </div>

          {review.conversationAnalysis && <ConversationAnalysis analysis={review.conversationAnalysis} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                {review.generalStrengths.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {review.generalStrengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No strengths identified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {review.generalImprovements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Competency Scores</h3>
        {review.competencyScores.map((competency, i) => (
          <CompetencyCard key={i} competency={competency} />
        ))}
      </div>
    </div>
  )
}
