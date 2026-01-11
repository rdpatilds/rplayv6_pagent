"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  role: string
  content: string
}

export function ConversationTab({ messages }: { messages: Message[] }) {
  // Filter out system messages unless they contain "EXPERT MODE"
  const filteredMessages = messages.filter((msg) => msg.role !== "system" || msg.content.includes("EXPERT MODE"))

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Conversation Transcript</h2>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {filteredMessages.map((message, index) => {
              // Determine the role label and style
              let roleLabel = ""
              let bgColor = ""
              let textColor = ""

              if (message.role === "user") {
                roleLabel = "Advisor"
                bgColor = "bg-blue-100"
                textColor = "text-blue-800"
              } else if (message.role === "assistant") {
                roleLabel = "Client"
                bgColor = "bg-green-100"
                textColor = "text-green-800"
              } else if (message.role === "system") {
                roleLabel = "System"
                bgColor = "bg-gray-100"
                textColor = "text-gray-800"
              }

              return (
                <div key={index} className={`p-4 rounded-lg ${bgColor}`}>
                  <div className={`font-bold mb-1 ${textColor}`}>{roleLabel}</div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
