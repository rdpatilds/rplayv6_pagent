"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import { useState } from "react"

type CompetencyScore = {
  name: string
  score: number
  strengths: string[]
  improvements: string[]
  expectation?: string
  specificExamples?: string[]
  criteria?: string[]
}

export function CompetencyCard({ competency }: { competency: CompetencyScore }) {
  const [isOpen, setIsOpen] = useState(false)

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-red-600"
    if (score <= 6) return "text-yellow-600"
    return "text-green-600"
  }

  const getProgressColor = (score: number) => {
    if (score <= 3) return "bg-red-600"
    if (score <= 6) return "bg-yellow-600"
    return "bg-green-600"
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{competency.name}</CardTitle>
          <div className={`text-2xl font-bold ${getScoreColor(competency.score)}`}>{competency.score}/10</div>
        </div>
        <Progress
          value={competency.score * 10}
          className="h-2 mt-2"
          indicatorClassName={getProgressColor(competency.score)}
        />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-gray-500 mb-2">
          Performance Level:
          <span className="font-medium ml-1">{competency.expectation}</span>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-left text-blue-600 hover:text-blue-800">
            View Details
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            {competency.strengths.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-sm mb-1">Strengths:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {competency.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {competency.improvements.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-sm mb-1">Areas for Improvement:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {competency.improvements.map((improvement, i) => (
                    <li key={i}>{improvement}</li>
                  ))}
                </ul>
              </div>
            )}

            {competency.specificExamples && competency.specificExamples.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-sm mb-1">Specific Examples:</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {competency.specificExamples.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {competency.criteria && competency.criteria.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-sm mb-1">Evaluation Criteria:</h4>
                <ul className="pl-5 text-sm space-y-1">
                  {competency.criteria.map((criterion, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
