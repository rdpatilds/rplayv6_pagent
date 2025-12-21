import { type EmotionalContext, getEmotionalStateDescription } from "./emotional-state-model"
import {
  generatePersonalityDescription,
  generateConversationalStyleGuidance,
  generateConversationalExamples,
  mapTraitsToProfiles,
} from "./trait-behavior-mapping"
import { getEmotionalBehaviorProfile, type EmotionName } from "./emotional-state-mapping"
import { logger } from "@/utils/logger"

// Create module-specific logger
const log = logger.forModule("promptInjector")

/**
 * Generates dynamic prompt components based on the emotional context and client profile
 */
export function generateDynamicPromptComponents(emotionalContext: EmotionalContext, clientProfile: any) {
  const startTime = performance.now()

  try {
    // Get the emotional state description
    const emotionalStateDescription = getEmotionalStateDescription(emotionalContext.currentState)

    // Generate personality description using the enhanced trait behavior mapping
    const personalityDescription = generatePersonalityDescription(clientProfile.fusionModelTraits)

    // Generate conversational style guidance with examples using the enhanced trait behavior mapping
    const conversationalStyleGuidance = generateConversationalStyleGuidance(clientProfile.fusionModelTraits)

    // Generate specific conversational examples using the enhanced trait behavior mapping
    const conversationalExamples = generateConversationalExamples(clientProfile.fusionModelTraits)

    // Get detailed trait profiles for more specific guidance
    const traitProfiles = mapTraitsToProfiles(clientProfile.fusionModelTraits)

    // NEW: Get emotional behavior profiles
    const emotionalProfiles = {
      trust: getEmotionalBehaviorProfile("trust", emotionalContext.currentState.trust),
      frustration: getEmotionalBehaviorProfile("frustration", emotionalContext.currentState.frustration),
      openness: getEmotionalBehaviorProfile("openness", emotionalContext.currentState.openness),
      engagement: getEmotionalBehaviorProfile("engagement", emotionalContext.currentState.engagement),
      anxiety: getEmotionalBehaviorProfile("anxiety", emotionalContext.currentState.anxiety),
      // Add other emotions as needed
    }

    // Generate emotional behavior guidance
    const emotionalBehaviorGuidance = generateEmotionalBehaviorGuidance(emotionalContext, emotionalProfiles)

    // Generate behavioral guidance based on the emotional state and personality
    const behavioralGuidance = generateBehaviorGuidance(emotionalContext, clientProfile, traitProfiles)

    const endTime = performance.now()
    log.debug(`Generated dynamic prompt components in ${Math.round(endTime - startTime)}ms`)

    return {
      emotionalStateDescription,
      personalityDescription,
      conversationalStyleGuidance,
      conversationalExamples,
      traitProfiles,
      emotionalProfiles,
      emotionalBehaviorGuidance,
      behavioralGuidance,
    }
  } catch (error) {
    log.error("Error generating dynamic prompt components", error)

    // Return minimal components to avoid breaking the system
    return {
      emotionalStateDescription: "Neutral emotional state.",
      personalityDescription: "Balanced personality.",
      conversationalStyleGuidance: "Speak naturally and professionally.",
      conversationalExamples: "Example: 'I understand your concerns.'",
      traitProfiles: {},
      emotionalProfiles: {},
      emotionalBehaviorGuidance: "Respond appropriately to client's emotions.",
      behavioralGuidance: "Be professional and helpful.",
    }
  }
}

/**
 * Generates emotional behavior guidance based on current emotional state profiles
 */
function generateEmotionalBehaviorGuidance(emotionalContext: EmotionalContext, emotionalProfiles: any) {
  const { currentState } = emotionalContext

  let guidance = "EMOTIONAL BEHAVIOR GUIDANCE:\n\n"

  // Add guidance for each emotion
  Object.entries(emotionalProfiles).forEach(([emotion, profile]: [string, any]) => {
    guidance += `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} (${currentState[emotion as keyof typeof currentState].toFixed(1)}/100): ${profile.summary}\n`
    guidance += `• Example: "${profile.positiveExample}"\n`
    guidance += `• When challenged: "${profile.negativeExample}"\n\n`
  })

  return guidance
}

/**
 * Generates behavioral guidance based on emotional state and personality
 */
function generateBehaviorGuidance(emotionalContext: EmotionalContext, clientProfile: any, traitProfiles: any): string {
  const { currentState, flags } = emotionalContext

  let guidance = "BEHAVIORAL GUIDANCE:\n\n"

  // Add dominant emotions and their implications
  const dominantEmotions = getDominantEmotions(currentState)
  if (dominantEmotions.length > 0) {
    guidance += "Dominant Emotions:\n"
    dominantEmotions.forEach(({ name, value }) => {
      const profile = getEmotionalBehaviorProfile(name as EmotionName, value)
      guidance += `• ${name.charAt(0).toUpperCase() + name.slice(1)} (${value.toFixed(1)}): ${profile.summary}\n`
    })
    guidance += "\n"
  }

  // Add specific behavioral recommendations based on emotional state
  guidance += "Recommended Approach:\n"

  if (currentState.trust < 40) {
    guidance += "• Build trust by being transparent and avoiding pushy sales tactics\n"
    guidance += "• Acknowledge concerns directly and provide clear explanations\n"
  }

  if (currentState.frustration > 60) {
    guidance += "• Acknowledge frustration and validate feelings before proceeding\n"
    guidance += "• Simplify explanations and focus on concrete next steps\n"
  }

  if (currentState.anxiety > 50) {
    guidance += "• Provide reassurance and emphasize safety/security aspects\n"
    guidance += "• Break down complex topics into manageable pieces\n"
  }

  if (currentState.confusion > 50) {
    guidance += "• Simplify explanations and check for understanding frequently\n"
    guidance += "• Use analogies and concrete examples to illustrate concepts\n"
  }

  if (currentState.openness < 40) {
    guidance += "• Respect privacy boundaries and avoid pressing for personal details\n"
    guidance += "• Focus on building rapport before requesting sensitive information\n"
  }

  // Add flag-based guidance
  if (flags.defensiveReaction) {
    guidance += "\nDEFENSIVE REACTION DETECTED:\n"
    guidance += "• Step back from potentially sensitive topics\n"
    guidance += "• Acknowledge concerns without being defensive yourself\n"
    guidance += "• Reestablish rapport before continuing with advice\n"
  }

  if (flags.confusionDetected) {
    guidance += "\nCONFUSION DETECTED:\n"
    guidance += "• Pause and check for understanding\n"
    guidance += "• Rephrase explanations using simpler terms\n"
    guidance += "• Use concrete examples relevant to the client's situation\n"
  }

  return guidance
}

/**
 * Get the dominant emotions from the current emotional state
 */
function getDominantEmotions(currentState: any, limit = 3): Array<{ name: string; value: number }> {
  const emotions = Object.entries(currentState)
    .filter(
      ([key, value]) =>
        key !== "timestamp" &&
        typeof value === "number" &&
        key in { trust: true, frustration: true, anxiety: true, openness: true, engagement: true },
    )
    .map(([key, value]) => ({
      name: key,
      value: value as number,
    }))

  // Sort by how extreme the emotion is (distance from neutral 50)
  return emotions.sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50)).slice(0, limit)
}

/**
 * Injects dynamic context into the system prompt
 */
export function injectDynamicContext(systemPrompt: string, emotionalContext: EmotionalContext, clientProfile: any) {
  const startTime = performance.now()

  try {
    // Generate the dynamic components
    const components = generateDynamicPromptComponents(emotionalContext, clientProfile)

    // Create the enhanced dynamic context section with conversational examples
    const dynamicContext = `
CURRENT EMOTIONAL STATE:
${components.emotionalStateDescription}

PERSONALITY PROFILE:
${components.personalityDescription}

CONVERSATIONAL STYLE AND EXAMPLES:
${components.conversationalStyleGuidance}

SPECIFIC PHRASES THIS CLIENT MIGHT USE:
${components.conversationalExamples}

${components.emotionalBehaviorGuidance}

CURRENT BEHAVIORAL GUIDANCE:
${components.behavioralGuidance}
`

    // Inject the dynamic context into the system prompt
    // We'll add it before the "Remember to stay in character" instruction
    const injectionPoint = "Remember to stay in character"
    let updatedPrompt: string

    if (systemPrompt.includes(injectionPoint)) {
      updatedPrompt = systemPrompt.replace(injectionPoint, `${dynamicContext}\n\n${injectionPoint}`)
    } else {
      // If the injection point isn't found, append to the end
      updatedPrompt = `${systemPrompt}\n\n${dynamicContext}`
    }

    const endTime = performance.now()
    log.debug(`Injected dynamic context in ${Math.round(endTime - startTime)}ms`)

    return updatedPrompt
  } catch (error) {
    log.error("Error injecting dynamic context", error)
    return systemPrompt // Return original prompt if injection fails
  }
}
