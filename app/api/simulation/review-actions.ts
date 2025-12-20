"use server"

import { OpenAI } from "openai"
import fs from "fs"
import path from "path"
import { getCompetencyCriteria } from "./rubrics"
import { getRubrics } from "./data-store"
import { ChatMessage, ChatMessageWithMetadata } from './types';

export type Competency = {
  id: string;
  name: string;
  description: string;
  criteria: string[];
};

export type CompetencyScore = {
  score: number;
  feedback: string;
  decreaseReason?: string;
  criteria?: string[];
  expectation?: string;
};

export type PerformanceReview = {
  competencyScores: {
    [key: string]: CompetencyScore;
  };
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
};

// Helper function to get API key
function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY
}

// Helper function to safely process difficulty level
function processDifficultyLevel(difficultyLevel: any): string {
  if (difficultyLevel === undefined || difficultyLevel === null) {
    return "beginner"
  }

  if (typeof difficultyLevel === "string") {
    return difficultyLevel.toLowerCase() // Only call toLowerCase() if it's a string
  }

  if (typeof difficultyLevel === "object") {
    const strValue = String(difficultyLevel)
    return strValue.toLowerCase() // Convert to string first, then lowercase
  }

  return "beginner" // Default fallback
}

export async function generatePerformanceReview(
  messages: ChatMessage[],
  competencies: Competency[],
  difficultyLevel: string | null | undefined,
): Promise<PerformanceReview> {
  try {
    const apiKey = getApiKey()
    if (!apiKey) {
      console.warn("No API key found, using fallback review")
      return generateFallbackReview(competencies)
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Add this option to allow browser usage
    })

    // Filter out system messages and keep only the conversation
    const conversationMessages = messages.filter((msg) => msg.role !== "system" || msg.content.includes("EXPERT MODE"))

    // Use the helper function to safely handle the difficulty level
    const safeDifficultyLevel = processDifficultyLevel(difficultyLevel)

    // Also, let's add a debug log to help diagnose the issue
    console.log("Difficulty level (raw):", difficultyLevel)
    console.log("Difficulty level (processed):", safeDifficultyLevel)

    // Count the number of user messages to determine engagement level
    const userMessageCount = conversationMessages.filter((msg) => msg.role === "user").length

    // Extract client messages to analyze what the client was asking for
    const clientMessages = conversationMessages
      .filter((msg) => msg.role === "assistant")
      .map((msg) => msg.content)
      .join("\n")

    // Get the rubrics for each competency
    const rubrics = getRubrics()

    // Create competency-specific evaluation criteria
    const competencyEvaluationCriteria = competencies.map((comp) => {
      const rubric = rubrics.find((r) => r.id === comp.id)
      const criteriaByLevel = rubric?.rubric?.[safeDifficultyLevel as keyof typeof rubric.rubric] || []

      return {
        id: comp.id,
        name: comp.name,
        description: comp.description,
        criteria: criteriaByLevel.map((level) => ({
          range: level.range,
          description: level.description,
          criteria: level.criteria || [],
        })),
      }
    })

    // Create a more critical and accurate prompt for the AI to analyze the conversation
    const prompt = `
  You are an expert financial advisor trainer evaluating a simulation conversation between an advisor and a client.
  Your evaluation must be HONEST, CRITICAL, and ACCURATE. Do not be overly positive if the performance was poor.
  
  Difficulty level: ${safeDifficultyLevel}
  
  Competencies being evaluated:
  ${competencies.map((comp) => `- ${comp.name || "Unnamed"}: ${comp.description || comp.name || "No description"}`).join("\n")}
  
  COMPETENCY-SPECIFIC EVALUATION CRITERIA:
  ${competencyEvaluationCriteria
    .map(
      (comp) => `
  ${comp.name}:
  ${comp.criteria
    .map(
      (c) => `  - Score ${c.range}: ${c.description}
    ${c.criteria.map((criterion) => `    * ${criterion}`).join("\n")}`,
    )
    .join("\n")}
  `,
    )
    .join("\n")}
  
  GENERAL EVALUATION GUIDELINES:
  - If the advisor sent very few messages (less than 3), they should receive a low score (1-3) as this indicates minimal engagement.
  - If the advisor did not ask discovery questions, they should receive a low score in the Needs Assessment competency.
  - If the advisor did not address client concerns, they should receive a low score in the Objection Handling competency.
  - If the advisor did not demonstrate product knowledge, they should receive a low score in relevant competencies.
  - If the advisor did not build rapport, they should receive a low score in the Communication competency.
  - Do NOT give credit for skills that were not demonstrated in the conversation.
  - Be specific about what the advisor did well and what they need to improve.
  - Provide actionable feedback that the advisor can use to improve.
  - If the advisor made inappropriate recommendations (like "just invest in bitcoin" without context), they should receive a very low score (1-2) in Solution Recommendations.
  - If the advisor used unprofessional language or tone, they should receive a low score in Communication.
  - If the advisor ignored the client's repeated requests to discuss a specific topic, they should receive a low score in Needs Assessment and Objection Handling.
  
  IMPORTANT: The advisor sent ${userMessageCount} messages in this conversation. If this number is low (less than 3), this indicates minimal engagement and should result in low scores.
  
  IMPORTANT: The client was specifically asking about: "${clientMessages.substring(0, 300)}..."
  
  Please analyze the conversation and provide a detailed performance review with the following:
  
  1. An overall score from 1-10 (be honest - use the FULL range from 1-10, do NOT inflate scores)
  2. Individual scores for each competency from 1-10 (again, use the FULL range and be critical)
  3. For each competency, list specific strengths demonstrated and areas for improvement
  4. For each competency, provide 1-2 specific examples from the conversation that justify your score
  5. For each competency, include the specific criteria from the rubric that apply to the score given
  6. General strengths across all competencies (if any)
  7. General areas for improvement across all competencies
  8. A summary paragraph of the overall performance that is honest and direct
  9. A brief analysis of the conversation highlighting key moments where the advisor succeeded or failed
  
  If the advisor performed poorly, the scores should reflect this (e.g., scores in the 1-4 range).
  If the advisor didn't listen to the client, provided poor advice, or missed key opportunities, this MUST be reflected in your evaluation.
  
  Format your response as a JSON object with the following structure:
  {
    "overallScore": number,
    "competencyScores": [
      {
        "name": "competency name",
        "score": number,
        "strengths": ["strength 1", "strength 2"],
        "improvements": ["improvement 1", "improvement 2"],
        "specificExamples": ["example 1", "example 2"],
        "criteria": ["criterion 1", "criterion 2"]
      }
    ],
    "generalStrengths": ["strength 1", "strength 2"],
    "generalImprovements": ["improvement 1", "improvement 2"],
    "summary": "summary paragraph",
    "conversationAnalysis": "analysis of key moments"
  }
  `

    console.log("Generating performance review with OpenAI...")

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        ...conversationMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.2, // Even lower temperature for more consistent and critical evaluations
      response_format: { type: "json_object" },
    })

    // Parse the response
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("No content in response")
    }

    try {
      const reviewData = JSON.parse(content)

      // Transform the competency scores to match our type
      const transformedScores: { [key: string]: CompetencyScore } = {}
      reviewData.competencyScores.forEach((comp: any) => {
        const score: CompetencyScore = {
          score: comp.score,
          feedback: comp.feedback,
          decreaseReason: comp.decreaseReason,
          criteria: comp.criteria
        }

        // Add expectation based on score
        if (score.score >= 9) {
          score.expectation = "Outstanding performance that exceeds expectations."
        } else if (score.score >= 7) {
          score.expectation = "Strong performance that meets expectations."
        } else if (score.score >= 5) {
          score.expectation = "Satisfactory performance with room for improvement."
        } else if (score.score >= 3) {
          score.expectation = "Below expectations. Significant improvement needed."
        } else {
          score.expectation = "Critical improvement required. Performance is unacceptable."
        }

        // If criteria weren't provided by the AI, add them based on the score
        if (!score.criteria || score.criteria.length === 0) {
          const competencyId = competencies.find((c) => c.name === comp.name)?.id || ""
          const scoreRange =
            score.score <= 2
              ? "1-2"
              : score.score <= 4
                ? "3-4"
                : score.score <= 6
                  ? "5-6"
                  : score.score <= 8
                    ? "7-8"
                    : "9-10"
          score.criteria = getCompetencyCriteria(competencyId, scoreRange)
        }

        transformedScores[comp.name] = score
      })

      // For debugging, save the review to a file (only in development)
      if (process.env.NODE_ENV === "development") {
        try {
          const debugDir = path.join(process.cwd(), "debug")
          if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true })
          }
          fs.writeFileSync(
            path.join(debugDir, `review-${Date.now()}.json`),
            JSON.stringify({ prompt, messages: conversationMessages, review: transformedScores }, null, 2),
          )
        } catch (err) {
          console.error("Error saving debug review:", err)
        }
      }

      return {
        competencyScores: transformedScores,
        overallScore: reviewData.overallScore,
        strengths: reviewData.strengths,
        areasForImprovement: reviewData.areasForImprovement,
        detailedFeedback: reviewData.detailedFeedback
      }
    } catch (e) {
      console.error("Error parsing review data:", e)
      throw new Error("Invalid review data format")
    }
  } catch (error) {
    console.error("Error generating performance review:", error)
    return generateFallbackReview(competencies)
  }
}

// Update the fallback function to include criteria
function generateFallbackReview(competencies: Competency[]): PerformanceReview {
  const competencyScores: { [key: string]: CompetencyScore } = {}
  
  competencies.forEach((comp) => {
    competencyScores[comp.name] = {
      score: 5,
      feedback: "No detailed feedback available due to API key issues.",
      criteria: comp.criteria,
      expectation: "Satisfactory performance with room for improvement."
    }
  })

  return {
    competencyScores,
    overallScore: 5,
    strengths: ["Unable to generate strengths due to API key issues."],
    areasForImprovement: ["Unable to generate areas for improvement due to API key issues."],
    detailedFeedback: "A detailed performance review could not be generated due to API key issues. Please ensure your API key is properly configured."
  }
}
