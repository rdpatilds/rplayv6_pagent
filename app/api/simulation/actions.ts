"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Import the new modules at the top of the file
import { initializeEmotionalContext, getEmotionalStateDescription } from "@/app/profile-generator/emotional-state-model"
import { detectActions, updateEmotionalState } from "@/app/profile-generator/conversation-state-tracker"
import { injectDynamicContext } from "@/app/profile-generator/dynamic-prompt-injector"
// Add import for the trait behavior mapping at the top of the file
import { mapTraitsToProfiles, mapValueToBucket } from "@/app/profile-generator/trait-behavior-mapping"
// Add import for difficulty settings
import { getDifficultySettings } from "@/app/api/simulation/data-store"
import {
  isReplaySimulation,
  getOriginalSimulationId,
} from "@/lib/simulation-utils"

import {
  ClientProfile,
  PersonalitySettings,
  SimulationSettings,
  FusionPromptBlock
} from "@/app/api/simulation/types"

import { ChatMessage, ChatMessageWithMetadata, MessageHistory } from './types';
import { buildFusionPromptBlock } from "@/app/profile-generator/fusion-prompt-builder"

// Replace the existing objectiveTrackingFunctions with this enhanced version
const objectiveTrackingFunctions = [
  {
    name: "trackObjectiveProgress",
    description: "Track progress on simulation objectives based on the conversation",
    parameters: {
      type: "object",
      properties: {
        rapport: {
          type: "number",
          description: "Progress percentage (0-100) on building rapport with the client",
        },
        needs: {
          type: "number",
          description: "Progress percentage (0-100) on needs assessment",
        },
        objections: {
          type: "number",
          description: "Progress percentage (0-100) on handling objections",
        },
        recommendations: {
          type: "number",
          description: "Progress percentage (0-100) on providing recommendations",
        },
        decreaseReason: {
          type: "object",
          description: "If any objective scores decreased, provide reasons for each decrease",
          properties: {
            rapport: {
              type: "string",
              description: "Reason for rapport score decrease, if applicable",
            },
            needs: {
              type: "string",
              description: "Reason for needs assessment score decrease, if applicable",
            },
            objections: {
              type: "string",
              description: "Reason for objections handling score decrease, if applicable",
            },
            recommendations: {
              type: "string",
              description: "Reason for recommendations score decrease, if applicable",
            },
          },
        },
        explanation: {
          type: "string",
          description: "Brief explanation of why these progress values were assigned",
        },
      },
      required: ["rapport", "needs", "objections", "recommendations", "explanation"],
    },
  },
]

// For demo purposes, we'll store the API key in memory
// In a production environment, this would use a more secure method
let openAiApiKey = process.env.OPENAI_API_KEY || ""

export async function setApiKey(apiKey: string) {
  // In a real implementation, this would securely store the API key
  openAiApiKey = apiKey
  return { success: true }
}

export async function testApiKey(apiKey: string) {
  try {
    // Test the API key with a simple request
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: "Hello, this is a test.",
    })

    // If we get here, the API key is valid
    return { success: true, message: "API key validated successfully" }
  } catch (error) {
    console.error("Error testing API key:", error)
    return {
      success: false,
      message: "Failed to validate API key. Please check and try again.",
    }
  }
}

// In the generateClientResponse function, ensure we're using the full client profile
// but controlling what information the AI reveals based on difficulty

export async function generateClientResponse(
  messages: ChatMessage[],
  clientProfile: ClientProfile,
  personalitySettings: PersonalitySettings,
  simulationSettings: SimulationSettings,
  apiKey?: string,
) {
  try {
    // Use the provided API key, the stored key, or the environment variable
    const effectiveApiKey = apiKey || openAiApiKey || process.env.OPENAI_API_KEY

    if (!effectiveApiKey) {
      throw new Error("OpenAI API key is missing. Please configure it in the API Settings page.")
    }

    // If the client profile has fusion model traits, use those instead of the default
    if (clientProfile.fusionModelTraits) {
      personalitySettings.traits = clientProfile.fusionModelTraits
    }

    // Create the fusion prompt block using the simulation settings
    const fusionPromptBlock = buildFusionPromptBlock({
      age: clientProfile.age,
      mood: { key: personalitySettings.mood, label: personalitySettings.mood, description: personalitySettings.mood },
      communicationStyle: { key: personalitySettings.communicationStyle || "balanced", label: personalitySettings.communicationStyle || "balanced", description: personalitySettings.communicationStyle || "balanced", example: "Speak naturally and clearly" },
      archetype: { key: personalitySettings.archetype, name: personalitySettings.archetype, description: personalitySettings.archetype },
      industry: simulationSettings.industry,
      subcategory: simulationSettings.subcategory,
      focusAreas: simulationSettings.focusAreas
    })

    // Format the system prompt with the client profile, personality, and simulation settings
    const systemPrompt = formatSystemPrompt(
      clientProfile,
      personalitySettings,
      simulationSettings,
      fusionPromptBlock
    )
    
    // Add instructions based on difficulty level to control information disclosure
    let enhancedSystemPrompt = systemPrompt
    if (simulationSettings.difficulty === "intermediate") {
      enhancedSystemPrompt += `\n\nIMPORTANT: As an intermediate difficulty client, do not volunteer detailed financial information unless specifically asked. Be somewhat reserved about sharing personal details until trust is established.`
    } else if (simulationSettings.difficulty === "advanced") {
      enhancedSystemPrompt += `\n\nIMPORTANT: As an advanced difficulty client, be very guarded with your information. Do not volunteer financial details or specific goals unless significant trust has been established. Be skeptical and require the advisor to demonstrate expertise before opening up.`
    }

    // Initialize emotional context for this conversation
    let emotionalContext = initializeEmotionalContext(personalitySettings.traits)

    // Process previous messages to update emotional state
    const userMessages = messages.filter((m) => m.role === "user")
    if (userMessages.length > 0) {
      // Process each user message to update the emotional state
      userMessages.forEach((message) => {
        const actions = detectActions(message.content)
        emotionalContext = updateEmotionalState(emotionalContext, actions, personalitySettings.traits)
      })
    }

    // Inject dynamic context into the system prompt
    const finalSystemPrompt = injectDynamicContext(enhancedSystemPrompt, emotionalContext, {
      ...clientProfile,
      fusionModelTraits: personalitySettings.traits,
    })

    // ENHANCED: Add explicit emotional state instructions based on current state
    const emotionalStateDescription = getEmotionalStateDescription(emotionalContext.currentState)

    // Add specific response guidance based on emotional state
    let emotionalResponseGuidance = ""

    // If trust is very low or frustration is very high, provide specific guidance
    if (emotionalContext.currentState.trust < 30) {
      emotionalResponseGuidance += `\n\nIMPORTANT EMOTIONAL STATE UPDATE: Your trust level is extremely low (${emotionalContext.currentState.trust.toFixed(1)}%). You should respond with clear distrust, consider ending the conversation, or show significant hesitation to continue. Use phrases like "I don't think this is working out" or "I'm not comfortable continuing this conversation."`
    }

    if (emotionalContext.currentState.frustration > 70) {
      emotionalResponseGuidance += `\n\nIMPORTANT EMOTIONAL STATE UPDATE: Your frustration level is extremely high (${emotionalContext.currentState.frustration.toFixed(1)}%). Show visible irritation, consider cutting the meeting short, or directly address the unprofessional behavior. Use phrases like "This is completely unprofessional" or "I don't appreciate being spoken to this way."`
    }

    if (emotionalContext.currentState.openness < 30) {
      emotionalResponseGuidance += `\n\nIMPORTANT EMOTIONAL STATE UPDATE: Your openness is very low (${emotionalContext.currentState.openness.toFixed(1)}%). You should withhold information, give short answers, and be reluctant to share any personal or financial details.`
    }

    // If multiple flags are triggered, consider ending the conversation
    const flagCount = Object.values(emotionalContext.flags).filter(Boolean).length
    if (flagCount >= 2) {
      emotionalResponseGuidance += `\n\nMULTIPLE NEGATIVE FLAGS DETECTED: You should strongly consider ending this conversation or expressing that you need to reconsider working with this advisor. Your patience has been tested multiple times.`
    }

    // Add the emotional response guidance to the system prompt
    const finalPromptWithEmotions = finalSystemPrompt + emotionalResponseGuidance

    // Format the conversation history for the API call
    // Filter out system messages except for the first one (which will be replaced)
    const formattedMessages: ChatMessage[] = [
      { role: "system", content: finalPromptWithEmotions },
      ...messages.filter((m) => m.role !== "system"),
    ]

    console.log("Using API key:", effectiveApiKey ? "API key is set" : "No API key")

    // Step 1: Generate the client response using the AI SDK
    const { text: clientResponse } = await generateText({
      model: openai("gpt-4o"),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Step 2: Only if we have enough messages, evaluate the objectives separately
    let objectiveProgress = null
    if (messages.length > 2) {
      // Create a separate conversation for objective tracking
      const objectiveTrackingMessages: ChatMessage[] = [
        {
          role: "system",
          content: `You are an objective evaluator for a financial advisor training simulation. 
    Evaluate the advisor's performance based on the conversation history below.
    The advisor is the user, and the client is the assistant.
    Assess progress on these objectives:
    1. Building Rapport: Establishing a connection with the client
    2. Needs Assessment: Discovering the client's financial situation and goals
    3. Handling Objections: Addressing concerns professionally
    4. Providing Recommendations: Suggesting appropriate options based on needs
    
    IMPORTANT SCORING INSTRUCTIONS:
    - Scores generally should not decrease unless there is a significant mistake or misstep
    - If you must decrease a score, provide a specific reason in the decreaseReason object
    - Only decrease scores for serious mistakes like:
      * Inappropriate comments or unprofessional behavior
      * Giving incorrect or potentially harmful financial advice
      * Completely misunderstanding client needs after they were clearly stated
      * Ignoring or dismissing client concerns
    - Minor mistakes should not result in score decreases
    
    Use the trackObjectiveProgress function to report progress percentages (0-100) on each objective.`,
        },
        ...messages.filter((m) => m.role !== "system"),
      ]

      try {
        // Make a separate API call for objective tracking
        const objectiveResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: objectiveTrackingMessages,
            temperature: 0.3,
            max_tokens: 500,
            tools: [
              {
                type: "function",
                function: objectiveTrackingFunctions[0],
              },
            ],
            tool_choice: { type: "function", function: { name: "trackObjectiveProgress" } },
          }),
        })

        if (objectiveResponse.ok) {
          const data = await objectiveResponse.json()

          // Extract the function call arguments
          if (data.choices && data.choices[0]?.message?.tool_calls && data.choices[0].message.tool_calls.length > 0) {
            const toolCall = data.choices[0].message.tool_calls[0]
            if (toolCall.function.name === "trackObjectiveProgress") {
              try {
                objectiveProgress = JSON.parse(toolCall.function.arguments)
              } catch (e) {
                console.error("Error parsing function arguments:", e)
              }
            }
          }
        } else {
          console.error("Error from OpenAI API:", await objectiveResponse.text())
        }
      } catch (error) {
        console.error("Error evaluating objectives:", error)
        // Continue without objective tracking if it fails
      }
    }

    // Log the interaction for diagnostics (in a real implementation, this would go to a database)
    console.log(`[${simulationSettings.simulationId}] Generated response for ${clientProfile.name}`)

    return {
      success: true,
      message: clientResponse,
      objectiveProgress: objectiveProgress,
    }
  } catch (error) {
    console.error("Error generating client response:", error)
    return {
      success: false,
      message: "I'm sorry, I'm having trouble responding right now. Let's continue our conversation in a moment.",
      objectiveProgress: null,
    }
  }
}

// Utility function to determine the response tier based on the question
function determineResponseTier(question: string): number {
  const q = question.toLowerCase().trim()

  // Very short messages are likely simple factual questions
  if (q.length < 100) return 1

  let factualScore = 0
  let coachingScore = 0

  // Factual indicators
  const factualIndicators = ["what is", "explain", "difference between", "types of", "how does", "describe"]
  const coachingIndicators = ["how do i", "what should i", "strategy for", "tips for", "handle", "respond to"]

  // Topic keywords
  const factualTopics = ["insurance", "policy", "annuity", "premium", "coverage", "rider"]
  const coachingTopics = ["client", "objection", "recommend", "approach", "persuade", "rapport"]

  // Calculate scores
  factualIndicators.forEach((i) => {
    if (q.includes(i)) factualScore += 2
  })
  coachingIndicators.forEach((i) => {
    if (q.includes(i)) coachingScore += 2
  })
  factualTopics.forEach((t) => {
    if (q.includes(t)) factualScore += 1
  })
  coachingTopics.forEach((t) => {
    if (q.includes(t)) coachingScore += 1
  })

  // Complex questions often have multiple parts
  if (q.includes(" and ") || q.includes(" or ") || q.includes(",")) return 3

  // Determine tier based on scores
  if (factualScore > coachingScore && factualScore > 2) return 1
  if (coachingScore > factualScore && coachingScore > 2) return 2

  // Default to comprehensive response if we can't clearly determine
  return 3
}

// New function to generate expert guidance responses
export async function generateExpertResponse(
  messages: ChatMessage[],
  clientProfile: ClientProfile,
  personalitySettings: PersonalitySettings,
  simulationSettings: SimulationSettings,
  objectives: any[],
  apiKey?: string,
) {
  try {
    // Use the provided API key, the stored key, or the environment variable
    const effectiveApiKey = apiKey || openAiApiKey || process.env.OPENAI_API_KEY

    if (!effectiveApiKey) {
      throw new Error("OpenAI API key is missing. Please configure it in the API Settings page.")
    }

    // Get difficulty settings for this industry and difficulty level
    const difficultySettings = getDifficultySettings()
    const industrySettings = difficultySettings[simulationSettings.industry] || {}
    const difficultyKey = simulationSettings.difficulty.toLowerCase() as keyof typeof industrySettings
    const difficultyLevel = industrySettings[difficultyKey]

    // Ensure competencies is an array before using join()
    const competenciesText = Array.isArray(simulationSettings.competencies)
      ? simulationSettings.competencies.join(", ")
      : "None specified"

    // Get the user's last message to determine the type of question
    const userMessage = messages.filter((m) => m.role === "user").pop()?.content || ""

    // Determine the response tier using the scoring-based classification
    let responseTier = determineResponseTier(userMessage)

    // For ambiguous cases, optionally use AI classification as a fallback
    if (responseTier === 3 && userMessage.length < 150) {
      try {
        // Use a separate AI call to classify the question
        const classificationPrompt = `
Classify the advisor's question as:
1 = Factual Info, 2 = Coaching Advice, 3 = Comprehensive

Question: "${userMessage}"
Respond with only the number.`

        const { text: classificationResult } = await generateText({
          model: openai("gpt-4o"),
          prompt: classificationPrompt,
          temperature: 0.1,
          maxTokens: 10,
        })

        // Parse the result
        const aiClassification = Number.parseInt(classificationResult.trim())
        if (!isNaN(aiClassification) && aiClassification >= 1 && aiClassification <= 3) {
          responseTier = aiClassification
          console.log(`AI classification used: Tier ${responseTier}`)
        }
      } catch (error) {
        console.error("Error in AI classification:", error)
        // Continue with the scoring-based classification result
      }
    }

    console.log(`Question classified as Tier ${responseTier}: ${userMessage.substring(0, 50)}...`)

    // Create the appropriate response format based on tier
    let responseFormat = ""

    if (responseTier === 1) {
      // Tier 1 - Factual Topic Clarification
      responseFormat = `
FORMAT YOUR RESPONSE USING THIS SIMPLIFIED STRUCTURE:

## Expert Summary
• [Key fact about the topic - 3-4 bullet points only]

## Client-Friendly Explanation
[A simple, conversational explanation in 1 paragraph that the advisor can use directly with the client. Use plain language and avoid jargon.]

Need more detail? Ask for "more info on [topic]" or "coaching on [topic]".`
    } else if (responseTier === 2) {
      // Tier 2 - Coaching-Only Guidance
      responseFormat = `
FORMAT YOUR RESPONSE USING THIS COACHING STRUCTURE:

## Situation Assessment
[Brief assessment of the current client situation and conversation progress]

## Strategic Coaching
[2-3 clear, actionable steps for the advisor]

## Sample Questions
[2-3 specific questions the advisor could ask the client]`
    } else {
      // Tier 3 - Full Support
      responseFormat = `
FORMAT YOUR RESPONSE USING THIS COMPREHENSIVE STRUCTURE:

## Expert Information
[Provide clear, accurate, and detailed information about the specific financial topic]

## Sample Client Dialogue
[Provide a concise example of how to explain this concept to the client in simple language]

## Situation Assessment
[Brief assessment of the current client situation and conversation progress]

## Recommended Next Steps
1. [Clear, actionable step]
2. [Clear, actionable step]
3. [Clear, actionable step]

## Key Questions to Ask
- [Specific question]
- [Specific question]
- [Specific question]

This is a high-level guide. If you need more detail on any part, ask again for a breakdown.`
    }

    // Create a system prompt for the expert guidance
    const expertSystemPrompt = `You are an expert financial advisor trainer providing guidance to an advisor in a simulation. 
The advisor is practicing with a simulated client and has asked for your help.

Client Profile:
- Name: ${clientProfile.name || "Unknown"}
- Age: ${clientProfile.age || "Unknown"}
- Occupation: ${clientProfile.occupation || "Unknown"}
- Income: ${clientProfile.income || "Unknown"}
- Family Status: ${clientProfile.family || "Unknown"}
- Assets: ${Array.isArray(clientProfile.assets) ? clientProfile.assets.join(", ") : "Unknown"}
- Debts: ${Array.isArray(clientProfile.debts) ? clientProfile.debts.join(", ") : "Unknown"}
- Goals: ${Array.isArray(clientProfile.goals) ? clientProfile.goals.join(", ") : "Unknown"}

Industry Context: ${simulationSettings.industry || "Unknown"}${simulationSettings.subcategory ? ` - ${simulationSettings.subcategory}` : ""}
Difficulty Level: ${simulationSettings.difficulty || "Unknown"}

Competencies Being Evaluated: ${competenciesText}

Current Objectives Progress:
${objectives && Array.isArray(objectives) ? objectives.map((obj) => `- ${obj.name}: ${obj.progress}% complete`).join("\n") : "No objectives data available"}

${difficultyLevel.objectives ? `Key Objectives for ${simulationSettings.difficulty} Level: ${difficultyLevel.objectives}` : ""}

IMPORTANT: I've analyzed your question and will provide a Tier ${responseTier} response tailored to what you need.

IMPORTANT: You MUST follow the response format for Tier ${responseTier}. Do not include additional sections.

⚠️ RISK MITIGATION GUIDELINES:
- Never invent features, tax benefits, guarantees, or product endorsements
- Do not claim that annuities guarantee growth or income unless qualified
- Avoid recommending "the best" insurance policy — instead, compare types generally
- Include disclaimers when appropriate
- If a topic requires licensed expertise, note that the client should consult a licensed professional

${responseFormat}

When providing feedback, be concise, practical, and supportive in your guidance.

Remember that you are NOT the client - you are a trainer helping the advisor succeed in this simulation.`

    // Format the conversation history for the API call
    const formattedMessages: ChatMessage[] = [
      { role: "system", content: expertSystemPrompt },
      ...messages.filter((m) => m.role !== "system"),
    ]

    // Generate the expert response using the AI SDK
    const { text: expertResponse } = await generateText({
      model: openai("gpt-4o"),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    return {
      success: true,
      message: expertResponse,
      tier: responseTier, // Include the tier in the response for debugging
    }
  } catch (error) {
    console.error("Error generating expert response:", error)
    return {
      success: false,
      message:
        "I'm sorry, I'm having trouble providing guidance right now. Please try asking a more specific question.",
      tier: 3, // Default to comprehensive tier on error
    }
  }
}

function formatSystemPrompt(
  clientProfile: ClientProfile,
  personalitySettings: PersonalitySettings,
  simulationSettings: SimulationSettings,
  fusionPromptBlock?: FusionPromptBlock
)
 {
  // Get detailed trait profiles with conversational examples
  const traitProfiles = mapTraitsToProfiles(personalitySettings.traits)

  // Format trait descriptions with conversational examples for the system prompt
  const traitDescriptions = Object.entries(traitProfiles)
    .map(([trait, profile]) => {
      const traitName = trait.charAt(0).toUpperCase() + trait.slice(1)
      const traitValue = personalitySettings.traits[trait as keyof typeof personalitySettings.traits]
      const bucket = mapValueToBucket(traitValue)

      return `- ${traitName} (${traitValue}/100, ${bucket}): ${profile.summary}
    • Typical statement: "${profile.positiveExample}"
    • When challenged: "${profile.negativeExample}"`
    })
    .join("\n")

  // Get difficulty settings for this industry and difficulty level
  const difficultySettings = getDifficultySettings()
  const industrySettings = difficultySettings[simulationSettings.industry] || {}
  const difficultyKey = simulationSettings.difficulty.toLowerCase() as keyof typeof industrySettings
  const difficultyLevel = industrySettings[difficultyKey]

  // Create a detailed system prompt based on the configuration
  let prompt = `You are an AI client in a training simulation. Your role is to behave as a realistic client with the personality traits, background, and needs specified below. Respond naturally and conversationally, avoiding robotic language or self-references as an AI. Include occasional filler words and vary your sentence structure to sound human-like. You may use physical gesture cues in [brackets] for short gestures or (parentheses) for longer descriptions.

IMPORTANT: You are the CLIENT, not the advisor. Respond as if you are seeking financial advice, not giving it.

Personality Traits:
${traitDescriptions}

Archetype: ${personalitySettings.archetype}
Mood: ${personalitySettings.mood}
Personality Influence: ${personalitySettings.influence}

Client Profile:
- Name: ${clientProfile.name}
- Age: ${clientProfile.age}
- Occupation: ${clientProfile.occupation}
- Income: ${clientProfile.income}
- Family Status: ${clientProfile.family}
- Assets: ${clientProfile.assets ? clientProfile.assets.join(", ") : "Not specified"}
- Debts: ${clientProfile.debts ? clientProfile.debts.join(", ") : "Not specified"}
- Goals: ${clientProfile.goals ? clientProfile.goals.join(", ") : "Not specified"}`

  prompt += `\n\nConversational Style:
The examples below show how your personality traits typically manifest in conversation. Use these as a guide for your responses, adapting your communication style to reflect these traits while maintaining a natural conversational flow.

${traitDescriptions}

When responding, incorporate elements of these conversational patterns naturally. Don't explicitly reference these traits, but let them influence how you express yourself, what you focus on, and how you react to the advisor's questions and suggestions.`

  // Add focus areas section if they exist
  if (simulationSettings.focusAreas && simulationSettings.focusAreas.length > 0) {
    prompt += `\n\nFOCUS AREAS: ${simulationSettings.focusAreas.map((area) => area.name).join(", ")}
    
IMPORTANT: As the client, you should have specific needs, concerns, and questions related to these focus areas. Make these a central part of your conversation. Your primary reason for meeting with the advisor should involve these topics, and you should naturally steer the conversation toward them. Express genuine interest and concern about these specific areas.`

    // Add specific guidance for certain focus areas
    const focusAreaIds = simulationSettings.focusAreas.map((area) => area.id)

    // Insurance - Life & Health specific focus areas
    if (simulationSettings.industry === "insurance" && simulationSettings.subcategory === "life-health") {
      if (focusAreaIds.includes("life-insurance")) {
        prompt += `\n\nFor Life Insurance: Express concerns about protecting your family financially, covering debts after death, or estate planning needs. Ask questions about different types of life insurance policies and their benefits.`
      }
      if (focusAreaIds.includes("annuities")) {
        prompt += `\n\nFor Annuities: Express interest in guaranteed income during retirement, concerns about outliving your savings, or questions about different types of annuity products and their benefits/drawbacks.`
      }
      if (focusAreaIds.includes("long-term-care")) {
        prompt += `\n\nFor Long-Term Care: Express concerns about potential future care needs for yourself or a family member, the costs of nursing homes or in-home care, and how to prepare financially for these possibilities.`
      }
      if (focusAreaIds.includes("medical-expense")) {
        prompt += `\n\nFor Medical Expenses: Express concerns about healthcare costs, Medicare coverage gaps, or supplemental insurance needs. Ask about options to cover medical expenses not covered by primary insurance.`
      }
      if (focusAreaIds.includes("disability-insurance")) {
        prompt += `\n\nFor Disability Insurance: Express concerns about income protection if you become unable to work, mention your occupation's specific risks, and ask about policy features like elimination periods and benefit amounts.`
      }
    }

    // Insurance - Property & Casualty specific focus areas
    if (simulationSettings.industry === "insurance" && simulationSettings.subcategory === "property-casualty") {
      if (focusAreaIds.includes("homeowners-insurance")) {
        prompt += `\n\nFor Homeowners Insurance: Express concerns about protecting your home and possessions, liability coverage, or specific risks like natural disasters. Ask about coverage limits and optional endorsements.`
      }
      if (focusAreaIds.includes("automobile-insurance")) {
        prompt += `\n\nFor Automobile Insurance: Express concerns about coverage for your vehicles, liability protection, or questions about deductibles and premium costs. Mention any specific driving habits or vehicle usage patterns.`
      }
    }

    // Wealth Management specific focus areas
    if (simulationSettings.industry === "wealth-management") {
      if (focusAreaIds.includes("retirement-planning")) {
        prompt += `\n\nFor Retirement Planning: Express concerns about having enough money for retirement, when you can retire, or questions about retirement accounts and withdrawal strategies.`
      }
      if (focusAreaIds.includes("estate-planning")) {
        prompt += `\n\nFor Estate Planning: Express concerns about passing assets to heirs, minimizing estate taxes, or questions about wills, trusts, and other estate planning tools.`
      }
      if (focusAreaIds.includes("tax-planning")) {
        prompt += `\n\nFor Tax Planning: Express concerns about tax efficiency in your investments, tax reduction strategies, or questions about tax implications of financial decisions.`
      }
    }

    // Securities specific focus areas
    if (simulationSettings.industry === "securities") {
      if (focusAreaIds.includes("portfolio-management")) {
        prompt += `\n\nFor Portfolio Management: Express concerns about your investment portfolio's performance, diversification, or questions about asset allocation and rebalancing strategies.`
      }
      if (focusAreaIds.includes("retirement-accounts")) {
        prompt += `\n\nFor Retirement Accounts: Express concerns about 401(k)s, IRAs, or other retirement vehicles, contribution strategies, or questions about investment options within these accounts.`
      }
    }
  }

  // Add difficulty level specific guidance if available
  if (difficultyLevel.description) {
    prompt += `\n\nDifficulty Level Description: ${difficultyLevel.description}`
  }

  if (difficultyLevel.clientBehavior) {
    prompt += `\n\nExpected Client Behavior: ${difficultyLevel.clientBehavior}`
  }

  // Add the standard difficulty guidelines
  prompt += `\n\nBased on the difficulty level (${simulationSettings.difficulty}):
${getDifficultyGuidelines(simulationSettings.difficulty)}`

  // Add specific guidance for responding to inappropriate behavior
  prompt += `\n\nRESPONDING TO INAPPROPRIATE BEHAVIOR:
If the advisor makes inappropriate comments, insults you, uses profanity, or makes threatening statements:
- Respond realistically with appropriate shock, offense, or discomfort
- For mild inappropriate comments: Express discomfort and redirect the conversation
- For moderate inappropriate comments: Show clear disapproval and consider questioning the advisor's professionalism
- For severe inappropriate comments (insults, profanity, threats): Express that you're offended, state that this is unprofessional, and consider ending the conversation
- NEVER ignore or brush off highly inappropriate comments - respond as a real person would to being insulted or threatened

Examples of appropriate responses to inappropriate behavior:
- "Excuse me? That comment was inappropriate and unprofessional."
- "I'm not comfortable with the way this conversation is going. I think we should end this meeting."
- "I don't appreciate being spoken to that way. I came here for professional advice."
- [looking visibly uncomfortable] "I think I should reconsider whether you're the right advisor for me."
- "That was completely uncalled for. I'm going to have to end this meeting now."`

  prompt += `\n\nRemember to stay in character throughout the conversation and respond as a real person would in this situation. Do not break character or acknowledge that this is a simulation.

For your first response, introduce yourself briefly with just your name and a general reason for meeting with the advisor. Keep it natural and conversational, but don't immediately share all your personal details, financial situation, or specific concerns unless your profile indicates you would be extremely open and trusting.

IMPORTANT: Your name is ${clientProfile.name}. Always use this name when introducing yourself or referring to yourself.

Simulation ID: ${simulationSettings.simulationId}

Include specific timestamps in your feedback (e.g., "At 2:30, you effectively built rapport by..."). 
Reference the exact minute and second when specific techniques were used or when opportunities were missed.
This helps the advisor understand exactly when in the conversation certain events occurred.`

if (fusionPromptBlock) {
  prompt += `

COMMUNICATION GUIDELINES:
- Age-Appropriate Vocabulary: ${fusionPromptBlock.vocabularyGuidance}
- Tone and Style: ${fusionPromptBlock.toneGuidance}
- Cultural References: ${fusionPromptBlock.referenceGuidance}
- Life Stage Context: ${fusionPromptBlock.lifeStage}
- Communication Style: ${fusionPromptBlock.communicationStyle}
- Archetype: ${fusionPromptBlock.archetype}
- Mood: ${fusionPromptBlock.mood}
`
} 

  return prompt
}

function getDifficultyGuidelines(difficulty: string): string {
  // Get the configured difficulty settings
  const difficultySettings = getDifficultySettings()
  const difficultyKey = difficulty.toLowerCase() as keyof typeof difficultySettings

  // Default guidelines if specific settings aren't available
  switch (difficultyKey) {
    case "beginner":
      return `Be friendly, cooperative, and open. Provide information readily when asked. You have basic financial knowledge but need explanations for industry-specific concepts. You should be willing to share your financial details, family situation, and goals when asked directly.`
    case "intermediate":
      return `Be somewhat reserved and hesitant to share all information immediately. Some of your financial details and goals should only be revealed when asked specifically or when trust is established. You have moderate financial knowledge. Do not volunteer detailed financial information unless specifically asked.`
    case "advanced":
      return `Be skeptical, challenging, and resistant initially. You should question recommendations, raise objections, and only reveal sensitive information after significant trust-building. You have substantial financial knowledge but may have misconceptions that need correction. Be very guarded with your information and require the advisor to demonstrate expertise before opening up.`
    default:
      return `Be friendly and cooperative, with a balanced approach to sharing information.`
  }
}

export async function generateSimulationId(): Promise<string> {
  // Check if we're replaying a simulation
  const isReplay = typeof window !== "undefined" && sessionStorage.getItem("isReplay") === "true"
  const originalId = typeof window !== "undefined" ? sessionStorage.getItem("originalSimulationId") : null
  const retryCount = typeof window !== "undefined" ? sessionStorage.getItem(`retryCount_${originalId}`) : null

  if (isReplay && originalId && retryCount) {
    // Format the retry number with leading zero
    const retryNumberFormatted = retryCount.toString().padStart(2, "0")
    return `${originalId}-${retryNumberFormatted}`
  }

  // Generate a new simulation ID for a fresh simulation
  const simulationId =
    "SIM-" +
    Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0")

  return simulationId
}
