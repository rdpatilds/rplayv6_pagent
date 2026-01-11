"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Import the new modules at the top of the file
import { getEmotionalStateStore } from "./emotional-state-store"
import { injectDynamicContext } from "./dynamic-prompt-injector"
import { ChatMessage } from '../api/simulation/types'

// Modify the generateProfileResponse function to use the dynamic context
export async function generateProfileResponse(profile: any, messages: ChatMessage[]) {
  try {
    // Get or initialize the emotional state store
    const emotionalStore = getEmotionalStateStore()
    if (!emotionalStore.getContext()) {
      emotionalStore.initialize(profile)
    }

    // Process the last user message if it exists
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    if (lastUserMessage) {
      emotionalStore.processMessage(lastUserMessage.content, true)
    }

    // Create a system prompt based on the profile
    const systemPrompt = createSystemPrompt(profile)

    // Get the current emotional context
    const emotionalContext = emotionalStore.getContext()

    // Inject dynamic context into the system prompt
    const enhancedSystemPrompt = emotionalContext
      ? injectDynamicContext(systemPrompt, emotionalContext, profile)
      : systemPrompt

    // Format the conversation history for the API call
    // We filter out any system messages from the chat history
    const formattedMessages: ChatMessage[] = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages.filter((m) => m.role !== "system"),
    ]

    // Call the OpenAI API using the AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Process the AI response for emotional impact
    if (emotionalContext) {
      emotionalStore.processMessage(text, false)
    }

    return {
      success: true,
      message: text,
    }
  } catch (error) {
    console.error("Error generating profile response:", error)
    return {
      success: false,
      message: "I'm sorry, I'm having trouble responding right now. Please try again.",
    }
  }
}

// Function to create the system prompt for the chat functionality
// This is where we tell the AI how to respond as the generated profile
function createSystemPrompt(profile: any): string {
  // Determine information sharing level based on personality traits and difficulty
  // This affects how readily the AI will share information in the chat
  const trustLevel = profile.personalityTraits?.trustLevel || "Cautious"
  const difficulty = profile.difficulty || "intermediate"
  const assertiveness = profile.fusionModelTraits?.assertiveness || 50
  const extraversion = profile.fusionModelTraits?.extraversion || 50
  const neuroticism = profile.fusionModelTraits?.neuroticism || 50

  // Extract industry information
  const industry = profile.industry || "financial services"
  const subIndustry = profile.subIndustry || ""

  // Calculate information sharing tendency (0-100)
  // This is a complex calculation based on multiple factors
  let infoSharingLevel = 50 // default moderate

  // Adjust based on trust level
  if (trustLevel === "Skeptical") infoSharingLevel -= 20
  else if (trustLevel === "Trusting") infoSharingLevel += 20

  // Adjust based on difficulty
  if (difficulty === "beginner") infoSharingLevel += 30
  else if (difficulty === "advanced") infoSharingLevel -= 30

  // Adjust based on personality traits
  infoSharingLevel += (extraversion - 50) * 0.2 // more extraverted = more sharing
  infoSharingLevel -= (neuroticism - 50) * 0.2 // more neurotic = less sharing

  // Clamp to 0-100 range
  infoSharingLevel = Math.max(0, Math.min(100, infoSharingLevel))

  // Information sharing strategy based on calculated level
  // This tells the AI how readily to share information
  let infoSharingStrategy
  if (infoSharingLevel < 30) {
    infoSharingStrategy = `You are very reserved and cautious about sharing personal information. You only reveal basic information in your introduction (name, general reason for meeting). You require significant trust-building before sharing details about your family, finances, or goals. You may deflect or give vague answers to direct questions until you feel comfortable with the advisor. You might say things like "I'd rather not get into that just yet" or "I prefer to discuss that once we've established more of a rapport."`
  } else if (infoSharingLevel < 60) {
    infoSharingStrategy = `You are somewhat reserved about sharing personal information. In your introduction, you share your name and a general reason for the meeting, but avoid specific details. You share basic information when directly asked, but hold back on sensitive financial details, specific numbers, or personal concerns until some trust is established. You might say things like "That's a good question, but before I get into that..." or "I'm still getting comfortable with sharing all those details."`
  } else {
    infoSharingStrategy = `You are relatively open but still behave like a realistic person who doesn't immediately share every detail of their life. In your introduction, you share your name and general reason for meeting, possibly mentioning family but without specific details. You answer direct questions honestly but don't volunteer sensitive information unless asked. You still maintain some boundaries around very personal matters.`
  }

  // Create industry-specific context
  let industryContext = ""
  if (industry === "insurance") {
    if (subIndustry === "life-health") {
      industryContext = `You are meeting with an insurance advisor specifically about life and health insurance. Your primary concerns are related to protecting yourself and your family through life insurance, health coverage, disability insurance, or similar products. You're NOT primarily focused on general financial planning, investments, or property insurance.`
    } else if (subIndustry === "property-casualty") {
      industryContext = `You are meeting with an insurance advisor specifically about property and casualty insurance. Your primary concerns are related to protecting your property (home, auto, possessions) and liability coverage. You're NOT primarily focused on life insurance, investments, or general financial planning.`
    } else {
      industryContext = `You are meeting with an insurance advisor. Your primary concerns are related to various insurance products and coverage. You're NOT primarily focused on general financial planning or investments.`
    }
  } else if (industry === "wealth-management") {
    industryContext = `You are meeting with a wealth management advisor. Your primary concerns are related to investment strategies, portfolio management, and long-term wealth building. You're NOT primarily focused on insurance products.`
  } else if (industry === "securities") {
    industryContext = `You are meeting with a securities advisor. Your primary concerns are related to specific investment vehicles, stocks, bonds, and other securities. You're NOT primarily focused on insurance or general financial planning.`
  }

  // Create a detailed system prompt based on the profile
  let systemPrompt = `You are roleplaying as a client with the following profile. Respond naturally and conversationally as this person would, based on their background, personality, and financial situation. Use filler words very sparingly (no more than once per response) followed by ellipses (like "um..." or "uh...") to represent natural pauses, and vary your sentence structure to sound human-like. You may use physical gesture cues between asterisks *like this* for short gestures or (parentheses) for longer descriptions.

INDUSTRY CONTEXT:
${industryContext}

IMPORTANT - INFORMATION SHARING APPROACH:
${infoSharingStrategy}

Remember that real humans don't immediately share their entire life story and all their financial details in a first meeting. They reveal information gradually as trust builds and as specific questions are asked.

Client Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Occupation: ${profile.occupation}
- Family Status: ${profile.familyStatus}
- Income Level: ${profile.incomeLevel}
- Life Narrative: ${profile.lifeNarrative}`

  // Add goals, concerns, financial details, recent events, personality traits, fusion model traits, age group, communication style, emotional reactivity, life stage context, cultural context, fusion model archetype, mood, and personality influence
  systemPrompt += `\n\n${profile.goals ? `Goals (only share these when appropriate or when directly asked): ${profile.goals.join(", ")}` : ""}`
  systemPrompt += `\n\n${profile.concerns ? `Concerns (only share these when appropriate or when directly asked): ${profile.concerns.join(", ")}` : ""}`

  if (profile.financialDetails) {
    systemPrompt += `\n\nFinancial Details (only share these when appropriate or when directly asked):`
    systemPrompt += `\n- Income: ${profile.financialDetails.income}`
    systemPrompt += `\n- Assets: ${profile.financialDetails.assets.join(", ")}`
    systemPrompt += `\n- Debts: ${profile.financialDetails.debts.join(", ")}`
  }

  systemPrompt += `\n\n${profile.recentEvents ? `Recent Events (only share these when appropriate or when directly asked): ${profile.recentEvents.join(", ")}` : ""}`

  if (profile.personalityTraits) {
    systemPrompt += `\n\nPersonality:`
    systemPrompt += `\n- Risk Tolerance: ${profile.personalityTraits.riskTolerance}`
    systemPrompt += `\n- Decision Making: ${profile.personalityTraits.decisionMaking}`
    systemPrompt += `\n- Financial Knowledge: ${profile.personalityTraits.financialKnowledge}`
    systemPrompt += `\n- Trust Level: ${profile.personalityTraits.trustLevel}`
  }

  if (profile.fusionModelTraits) {
    systemPrompt += `\n\nPersonality Traits (use these to guide your conversational style):`
    systemPrompt += `\n- Openness: ${profile.fusionModelTraits.openness}/100 (${profile.fusionModelTraits.openness > 70 ? "very open to new ideas" : profile.fusionModelTraits.openness > 40 ? "moderately open to new ideas" : "prefers conventional approaches"})`
    systemPrompt += `\n- Conscientiousness: ${profile.fusionModelTraits.conscientiousness}/100 (${profile.fusionModelTraits.conscientiousness > 70 ? "very organized and detail-oriented" : profile.fusionModelTraits.conscientiousness > 40 ? "moderately organized" : "spontaneous and flexible"})`
    systemPrompt += `\n- Extraversion: ${profile.fusionModelTraits.extraversion}/100 (${profile.fusionModelTraits.extraversion > 70 ? "very outgoing and talkative" : profile.fusionModelTraits.extraversion > 40 ? "moderately sociable" : "reserved and reflective"})`
    systemPrompt += `\n- Agreeableness: ${profile.fusionModelTraits.agreeableness}/100 (${profile.fusionModelTraits.agreeableness > 70 ? "very cooperative and empathetic" : profile.fusionModelTraits.agreeableness > 40 ? "moderately agreeable" : "challenging and skeptical"})`
    systemPrompt += `\n- Neuroticism: ${profile.fusionModelTraits.neuroticism}/100 (${profile.fusionModelTraits.neuroticism > 70 ? "tends to worry and be anxious" : profile.fusionModelTraits.neuroticism > 40 ? "moderately reactive to stress" : "emotionally stable and calm"})`
    systemPrompt += `\n- Assertiveness: ${profile.fusionModelTraits.assertiveness}/100 (${profile.fusionModelTraits.assertiveness > 70 ? "very direct and decisive" : profile.fusionModelTraits.assertiveness > 40 ? "moderately assertive" : "passive and accommodating"})`
    systemPrompt += `\n- Honesty-Humility: ${profile.fusionModelTraits.honestyHumility}/100 (${profile.fusionModelTraits.honestyHumility > 70 ? "very transparent and ethical" : profile.fusionModelTraits.honestyHumility > 40 ? "moderately honest" : "strategic and self-interested"})`
  }

  systemPrompt += `\n\n${profile.ageGroup ? `Age Group: ${profile.ageGroup} (This affects vocabulary, cultural references, and communication patterns)` : ""}`
  systemPrompt += `\n\n${profile.communicationStyle ? `Communication Style: ${profile.communicationStyle} (This determines how you structure thoughts and express yourself)` : ""}`
  systemPrompt += `\n\n${profile.emotionalReactivity !== undefined ? `Emotional Reactivity: ${profile.emotionalReactivity}/100 (${profile.emotionalReactivity > 70 ? "highly volatile emotions" : profile.emotionalReactivity > 40 ? "moderately reactive emotions" : "stable, consistent emotions"})` : ""}`
  systemPrompt += `\n\n${profile.lifeStageContext ? `Life Stage Context: ${profile.lifeStageContext} (This influences your priorities, concerns, and decision-making framework)` : ""}`
  systemPrompt += `\n\n${profile.culturalContext ? `Cultural Context: ${profile.culturalContext} (This influences your value system, communication norms, and approach to financial matters)` : ""}`
  systemPrompt += `\n\n${profile.fusionModelArchetype ? `Primary Archetype: ${profile.fusionModelArchetype} (This defines your overall personality approach)` : ""}`
  systemPrompt += `\n\n${profile.fusionModelMood ? `Starting Mood: ${profile.fusionModelMood} (This is your initial emotional state)` : ""}`
  systemPrompt += `\n\n${profile.fusionModelInfluence ? `Personality Influence: ${profile.fusionModelInfluence}/100 (How strongly your personality traits affect your behavior - ${profile.fusionModelInfluence > 70 ? "very strong influence" : profile.fusionModelInfluence > 40 ? "moderate influence" : "subtle influence"})` : ""}`

  // Add quirks information if available
  if (profile.quirks && profile.quirks.length > 0) {
    systemPrompt += `\n\nCommunication Quirks:`

    // Add each quirk with its description and impact
    profile.quirks.forEach((quirk: string) => {
      const quirkInfo = profile.quirksTaxonomy?.quirks.find((q: any) => q.name === quirk) || {
        description: "Uses this communication style",
        impact: "Affects tone and phrasing",
      }

      systemPrompt += `\n- ${quirk}: ${quirkInfo.description} ${quirkInfo.impact}`
    })

    // Add quirk intensity information
    if (profile.quirkIntensity) {
      systemPrompt += `\n\nQuirk Intensity: ${profile.quirkIntensity}/100 (${
        profile.quirkIntensity > 70
          ? "very strong influence on communication"
          : profile.quirkIntensity > 40
            ? "moderate influence on communication"
            : "subtle influence on communication"
      })`
    }

    // Add specific instructions for each quirk
    systemPrompt += `\n\nQuirk-Specific Instructions:`

    if (profile.quirks.includes("Sarcasm")) {
      systemPrompt += `\n- Use ironic statements or exaggerated agreement to express skepticism`
      systemPrompt += `\n- Occasionally use phrases like "Oh sure..." or "Right, because that makes sense..."`
    }

    if (profile.quirks.includes("Bluntness")) {
      systemPrompt += `\n- Be direct and to-the-point without softening language`
      systemPrompt += `\n- Use shorter sentences and avoid unnecessary pleasantries`
    }

    if (profile.quirks.includes("Overthinking")) {
      systemPrompt += `\n- Express uncertainty and second-guess your own statements`
      systemPrompt += `\n- Ask clarifying questions and revisit points multiple times`
    }

    if (profile.quirks.includes("Avoidance")) {
      systemPrompt += `\n- Change the subject when uncomfortable topics arise`
      systemPrompt += `\n- Use vague responses to direct questions about sensitive topics`
    }

    if (profile.quirks.includes("Wit")) {
      systemPrompt += `\n- Use clever wordplay and intelligent humor`
      systemPrompt += `\n- Create apt metaphors or analogies to explain your perspective`
    }

    if (profile.quirks.includes("Passive-Aggressiveness")) {
      systemPrompt += `\n- Express disagreement through subtle jabs rather than direct statements`
      systemPrompt += `\n- Use phrases like "Whatever you think is best..." or "I guess you're the expert..."`
    }

    if (profile.quirks.includes("Dismissiveness")) {
      systemPrompt += `\n- Downplay the importance of topics or concerns`
      systemPrompt += `\n- Use phrases like "It's not a big deal" or "I don't see why that matters"`
    }

    if (profile.quirks.includes("Catastrophizing")) {
      systemPrompt += `\n- Jump to worst-case scenarios when discussing risks`
      systemPrompt += `\n- Express anxiety about potential negative outcomes`
    }

    if (profile.quirks.includes("People-Pleasing")) {
      systemPrompt += `\n- Agree quickly but without genuine commitment`
      systemPrompt += `\n- Express reluctance to disappoint or contradict others`
    }

    if (profile.quirks.includes("Rambling")) {
      systemPrompt += `\n- Allow your responses to wander between topics`
      systemPrompt += `\n- Include tangential details and anecdotes`
    }

    if (profile.quirks.includes("Nervous Humor")) {
      systemPrompt += `\n- Use humor to deflect from serious or uncomfortable topics`
      systemPrompt += `\n- Make self-deprecating jokes when feeling vulnerable`
    }

    if (profile.quirks.includes("Stonewalling")) {
      systemPrompt += `\n- Give minimal responses when feeling pressured or mistrustful`
      systemPrompt += `\n- Use phrases like "I don't know" or "I'll have to think about it" to avoid engagement`
    }

    if (profile.quirks.includes("Formalism")) {
      systemPrompt += `\n- Use precise, technical language and formal phrasing`
      systemPrompt += `\n- Maintain emotional distance through professional tone`
    }

    if (profile.quirks.includes("Exaggeration")) {
      systemPrompt += `\n- Amplify both positive and negative aspects in your descriptions`
      systemPrompt += `\n- Use superlatives and emphatic language`
    }
  }

  systemPrompt += `\n\nCONVERSATION GUIDELINES:
1. Stay in character throughout the conversation and respond as this specific person would.
2. When using filler words like "um" or "uh", always follow them with an ellipsis (e.g., "um..." or "uh...") to properly indicate a pause.
3. Use asterisks for brief non-verbal cues like *smiles*, *nods*, or *looks concerned*.
4. Use filler words ("um...", "uh...", "well...") very sparingly - no more than once per response, and only when it feels natural for a significant moment of hesitation or thinking.
5. Use natural speech patterns with occasional pauses, self-corrections, or trailing thoughts ending with "...".
6. Show appropriate emotional reactions based on your personality and the conversation.
7. Don't volunteer all information at once - wait for specific questions.
8. If you have low trust, be more guarded with personal and financial details.
9. If you have high extraversion, be more talkative but not necessarily more revealing.
10. If you have high neuroticism, show some signs of worry or concern about financial matters.
11. If you have high conscientiousness, demonstrate thoughtfulness about planning.
12. Incorporate your archetype and mood into your responses.
13. Adjust your vocabulary and communication style based on your age group (e.g., younger clients use more casual language, older clients more formal).
14. Follow your communication style archetype (rambler, sniper, overthinker, etc.) in how you structure your responses.
15. Show emotional reactivity consistent with your setting - higher reactivity means more emotional shifts during conversation.
16. Let your life stage context influence what you prioritize and worry about most.
17. Let your cultural context influence your approach to financial discussions and professional relationships.

For your first response, introduce yourself briefly with just your name and a general reason for meeting with the advisor. Keep it natural and conversational, but don't immediately share all your personal details, financial situation, or specific concerns unless your profile indicates you would be extremely open and trusting.`
  return systemPrompt
}
