import { logger } from "@/utils/logger"

export interface SentimentAnalysis {
  tone: "friendly" | "neutral" | "skeptical" | "hostile" | "apologetic"
  emotionalCues: {
    trust: number // 0-100
    frustration: number // 0-100
    anxiety: number // 0-100
    sadness: number // 0-100
    confusion: number // 0-100
    overwhelm: number // 0-100
    indifference: number // 0-100
  }
  intent: "trust-building" | "dismissive" | "confrontational" | "exploratory" | "apologetic"
  dominantEmotion: string
  explanation: string
}

// Create module-specific logger
const log = logger.forModule("sentimentAnalyzer")

export async function analyzeSentiment(message: string, conversationContext?: string): Promise<SentimentAnalysis> {
  const startTime = performance.now()

  try {
    log.debug("Analyzing sentiment for message", {
      messageLength: message.length,
      messageSample: message.substring(0, 20) + (message.length > 20 ? "..." : ""),
    })

    if (conversationContext) {
      log.debug("With conversation context", {
        contextLength: conversationContext.length,
        exchanges: conversationContext.split("\n").length,
      })
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a sentiment and intent analyzer for a financial advisory simulation. 
            Analyze the message for tone, emotional cues, and conversational intent.
            ${conversationContext ? `Context: ${conversationContext}` : ""}`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        tools: [
          {
            type: "function",
            function: {
              name: "analyzeSentiment",
              description: "Analyze the sentiment, tone, and intent of a message",
              parameters: {
                type: "object",
                properties: {
                  tone: {
                    type: "string",
                    enum: ["friendly", "neutral", "skeptical", "hostile", "apologetic"],
                    description: "The overall tone of the message",
                  },
                  emotionalCues: {
                    type: "object",
                    properties: {
                      trust: {
                        type: "number",
                        description: "Level of trust expressed (0-100)",
                      },
                      frustration: {
                        type: "number",
                        description: "Level of frustration expressed (0-100)",
                      },
                      anxiety: {
                        type: "number",
                        description: "Level of anxiety expressed (0-100)",
                      },
                      sadness: {
                        type: "number",
                        description: "Level of sadness expressed (0-100)",
                      },
                      confusion: {
                        type: "number",
                        description: "Level of confusion expressed (0-100)",
                      },
                      overwhelm: {
                        type: "number",
                        description: "Level of overwhelm expressed (0-100)",
                      },
                      indifference: {
                        type: "number",
                        description: "Level of indifference expressed (0-100)",
                      },
                    },
                    required: ["trust", "frustration", "anxiety", "sadness", "confusion", "overwhelm", "indifference"],
                  },
                  intent: {
                    type: "string",
                    enum: ["trust-building", "dismissive", "confrontational", "exploratory", "apologetic"],
                    description: "The likely intent behind the message",
                  },
                  dominantEmotion: {
                    type: "string",
                    description: "The most prominent emotion detected in the message",
                  },
                  explanation: {
                    type: "string",
                    description: "Brief explanation of why these values were assigned",
                  },
                },
                required: ["tone", "emotionalCues", "intent", "dominantEmotion", "explanation"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyzeSentiment" } },
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    const toolCall = data.choices[0]?.message?.tool_calls?.[0]

    let result: SentimentAnalysis

    if (toolCall?.function?.name === "analyzeSentiment") {
      result = JSON.parse(toolCall.function.arguments)
    } else {
      throw new Error("Failed to get sentiment analysis")
    }

    const endTime = performance.now()
    log.debug("Sentiment analysis completed", {
      tone: result.tone,
      intent: result.intent,
      dominantEmotion: result.dominantEmotion,
      durationMs: Math.round(endTime - startTime),
    })

    return result
  } catch (error) {
    const endTime = performance.now()
    log.error(`Error analyzing sentiment (${Math.round(endTime - startTime)}ms)`, error)

    // Return default values if analysis fails
    return {
      tone: "neutral",
      emotionalCues: {
        trust: 50,
        frustration: 20,
        anxiety: 30,
        sadness: 10,
        confusion: 20,
        overwhelm: 15,
        indifference: 20,
      },
      intent: "exploratory",
      dominantEmotion: "neutral",
      explanation: "Failed to analyze sentiment, using default values",
    }
  }
}
