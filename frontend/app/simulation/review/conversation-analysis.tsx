"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ConversationAnalysis({ analysis }: { analysis?: string }) {
  if (!analysis) return null

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Conversation Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{analysis}</p>
      </CardContent>
    </Card>
  )
}
