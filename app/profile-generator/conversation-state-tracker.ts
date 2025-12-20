import type { EmotionalContext, EmotionalState } from "./emotional-state-model"
import { analyzeSentiment, type SentimentAnalysis } from "./sentiment-analyzer"
import { EmotionalMemoryEngine } from "./emotional-memory-engine"
import { logger } from "@/utils/logger"

// Create module-specific logger
const log = logger.forModule("conversationTracker")

// Create a singleton instance of the emotional memory engine
const emotionalMemoryEngine = new EmotionalMemoryEngine()

// Define the types of actions that can affect emotional state
export enum ActionType {
  REFLECTIVE_LISTENING = "reflective_listening",
  INTERRUPTION = "interruption",
  JARGON_USAGE = "jargon_usage",
  OPEN_QUESTION = "open_question",
  CLOSED_QUESTION = "closed_question",
  EMPATHETIC_RESPONSE = "empathetic_response",
  IGNORED_CONCERN = "ignored_concern",
  CLEAR_EXPLANATION = "clear_explanation",
  CONFUSING_EXPLANATION = "confusing_explanation",
  ADDRESSING_OBJECTION = "addressing_objection",
  DISMISSING_CONCERN = "dismissing_concern",
  PERSONAL_CONNECTION = "personal_connection",
  RUSHING = "rushing",
  PATIENCE = "patience",
  // Add new action types for inappropriate language
  INAPPROPRIATE_LANGUAGE = "inappropriate_language",
  INSULT = "insult",
  THREATENING_LANGUAGE = "threatening_LANGUAGE",
  DISMISSIVE_TONE = "dismissive_tone",
  UNPROFESSIONAL_COMMENT = "unprofessional_comment",
  JUDGMENTAL_COMMENT = "judgmental_comment",
  PERSONAL_QUESTION = "personal_question",
  OFFENSIVE_ASSUMPTION = "offensive_assumption",
}

// Define the impact of each action on emotional states
interface ActionImpact {
  trust?: number
  frustration?: number
  openness?: number
  engagement?: number
  anxiety?: number
  flags?: Partial<Record<keyof EmotionalContext["flags"], boolean>>
}

// Map of actions to their emotional impacts
const ACTION_IMPACTS: Record<ActionType, ActionImpact> = {
  [ActionType.REFLECTIVE_LISTENING]: {
    trust: 5,
    frustration: -5,
    openness: 3,
    engagement: 5,
  },
  [ActionType.INTERRUPTION]: {
    trust: -5,
    frustration: 10,
    openness: -5,
    engagement: -3,
  },
  [ActionType.JARGON_USAGE]: {
    trust: -2,
    frustration: 5,
    anxiety: 5,
    flags: { confusionDetected: true },
  },
  [ActionType.OPEN_QUESTION]: {
    engagement: 5,
    openness: 3,
  },
  [ActionType.CLOSED_QUESTION]: {
    openness: -1,
  },
  [ActionType.EMPATHETIC_RESPONSE]: {
    trust: 5,
    frustration: -5,
    openness: 5,
    flags: { rapportEstablished: true },
  },
  [ActionType.IGNORED_CONCERN]: {
    trust: -8,
    frustration: 10,
    openness: -5,
    flags: { defensiveReaction: true },
  },
  [ActionType.CLEAR_EXPLANATION]: {
    trust: 3,
    anxiety: -5,
    flags: { concernAddressed: true },
  },
  [ActionType.CONFUSING_EXPLANATION]: {
    trust: -3,
    frustration: 5,
    anxiety: 5,
    flags: { confusionDetected: true },
  },
  [ActionType.ADDRESSING_OBJECTION]: {
    trust: 5,
    frustration: -5,
    flags: { concernAddressed: true },
  },
  [ActionType.DISMISSING_CONCERN]: {
    trust: -10,
    frustration: 15,
    openness: -8,
    flags: { defensiveReaction: true },
  },
  [ActionType.PERSONAL_CONNECTION]: {
    trust: 5,
    openness: 5,
    engagement: 5,
    flags: { rapportEstablished: true },
  },
  [ActionType.RUSHING]: {
    trust: -5,
    frustration: 8,
    openness: -5,
  },
  [ActionType.PATIENCE]: {
    trust: 3,
    frustration: -5,
    openness: 3,
  },
  // Add impacts for new action types
  [ActionType.INAPPROPRIATE_LANGUAGE]: {
    trust: -15,
    frustration: 20,
    openness: -10,
    engagement: -10,
    flags: { defensiveReaction: true },
  },
  [ActionType.INSULT]: {
    trust: -25,
    frustration: 30,
    openness: -20,
    engagement: -15,
    flags: { defensiveReaction: true },
  },
  [ActionType.THREATENING_LANGUAGE]: {
    trust: -30,
    frustration: 35,
    openness: -25,
    anxiety: 30,
    flags: { defensiveReaction: true },
  },
  [ActionType.DISMISSIVE_TONE]: {
    trust: -10,
    frustration: 15,
    openness: -10,
    engagement: -8,
    flags: { defensiveReaction: true },
  },
  [ActionType.UNPROFESSIONAL_COMMENT]: {
    trust: -15,
    frustration: 20,
    openness: -15,
    engagement: -10,
    flags: { defensiveReaction: true },
  },
  [ActionType.JUDGMENTAL_COMMENT]: {
    trust: -18,
    frustration: 25,
    openness: -15,
    engagement: -12,
    flags: { defensiveReaction: true },
  },
  [ActionType.PERSONAL_QUESTION]: {
    trust: -12,
    frustration: 18,
    openness: -15,
    anxiety: 15,
    flags: { defensiveReaction: true },
  },
  [ActionType.OFFENSIVE_ASSUMPTION]: {
    trust: -20,
    frustration: 25,
    openness: -18,
    engagement: -15,
    flags: { defensiveReaction: true },
  },
}

// Detect actions from conversation messages
export function detectActions(message: string): ActionType[] {
  console.log(`[detectActions] Analyzing message: "${message}"`)
  const actions: ActionType[] = []
  const lowerMessage = message.toLowerCase()

  // Debug: Check for specific inappropriate terms
  const inappropriateTerms = ["bitch", "won't make it", "stupid", "idiot", "crazy", "weird", "adopt"]
  for (const term of inappropriateTerms) {
    if (lowerMessage.includes(term)) {
      console.log(`[detectActions] Found inappropriate term: "${term}"`)
    }
  }

  // Simple keyword-based detection - in a real implementation, this would use more sophisticated NLP
  if (
    lowerMessage.includes("i hear you saying") ||
    lowerMessage.includes("it sounds like") ||
    lowerMessage.includes("what i'm hearing is") ||
    lowerMessage.includes("you seem to be feeling")
  ) {
    actions.push(ActionType.REFLECTIVE_LISTENING)
  }

  if (lowerMessage.includes("?") && message.length > 30) {
    if (
      lowerMessage.startsWith("what") ||
      lowerMessage.startsWith("how") ||
      lowerMessage.startsWith("tell me about") ||
      lowerMessage.startsWith("describe") ||
      lowerMessage.startsWith("explain")
    ) {
      actions.push(ActionType.OPEN_QUESTION)
    } else if (
      lowerMessage.startsWith("do you") ||
      lowerMessage.startsWith("are you") ||
      lowerMessage.startsWith("will you") ||
      lowerMessage.startsWith("have you") ||
      lowerMessage.startsWith("can you")
    ) {
      actions.push(ActionType.CLOSED_QUESTION)
    }
  }

  // Check for financial jargon
  const jargonTerms = [
    "amortization",
    "annuitization",
    "basis points",
    "beta",
    "capital gains",
    "diversification",
    "fiduciary",
    "liquidity",
    "portfolio",
    "rebalancing",
    "tax-loss harvesting",
    "volatility",
  ]

  if (jargonTerms.some((term) => lowerMessage.includes(term))) {
    actions.push(ActionType.JARGON_USAGE)
  }

  // Check for empathetic responses
  if (
    lowerMessage.includes("understand your concern") ||
    lowerMessage.includes("i can see why you") ||
    lowerMessage.includes("that must be") ||
    lowerMessage.includes("i appreciate your") ||
    lowerMessage.includes("thank you for sharing")
  ) {
    actions.push(ActionType.EMPATHETIC_RESPONSE)
  }

  // Check for personal connection
  if (
    lowerMessage.includes("similar experience") ||
    lowerMessage.includes("i've worked with clients who") ||
    (lowerMessage.includes("like you") && lowerMessage.includes("many"))
  ) {
    actions.push(ActionType.PERSONAL_CONNECTION)
  }

  // NEW: Check for inappropriate language and insults
  const inappropriateTerms2 = [
    "stupid",
    "idiot",
    "dumb",
    "moron",
    "fool",
    "ridiculous",
    "waste of time",
    "shut up",
    "don't care",
    "whatever",
  ]

  const insultTerms = [
    "bitch",
    "asshole",
    "bastard",
    "jerk",
    "loser",
    "pathetic",
    "worthless",
    "useless",
    "incompetent",
    "fuck",
    "shit",
    "damn",
  ]

  const threateningTerms = [
    "won't make it",
    "die",
    "kill",
    "hurt",
    "suffer",
    "regret",
    "pay for this",
    "sorry you",
    "teach you",
    "lesson",
  ]

  const dismissiveTerms = [
    "whatever",
    "don't care",
    "not my problem",
    "figure it out",
    "not my job",
    "just do it",
    "get over it",
    "move on",
    "so what",
  ]

  // NEW: Check for judgmental comments about personal choices
  const judgmentalTerms = [
    "crazy",
    "weird",
    "strange",
    "odd",
    "why would you",
    "that's a bad idea",
    "shouldn't have",
    "bad choice",
    "poor decision",
  ]

  // NEW: Check for inappropriate personal questions
  const personalQuestionPatterns = [
    "why don't you",
    "why can't you",
    "why haven't you",
    "why would you",
    "can't you just",
    "couldn't you",
    "shouldn't you",
  ]

  // NEW: Check for offensive assumptions
  const offensiveAssumptionPatterns = [
    "you people",
    "your kind",
    "all of you",
    "you must be",
    "you obviously",
    "clearly you",
    "of course you would",
    "typical",
    "adopt",
    "adoption",
  ]

  // Check for inappropriate language
  if (inappropriateTerms2.some((term) => lowerMessage.includes(term))) {
    actions.push(ActionType.INAPPROPRIATE_LANGUAGE)
  }

  // Check for insults
  if (insultTerms.some((term) => lowerMessage.includes(term))) {
    actions.push(ActionType.INSULT)
  }

  // Check for threatening language
  if (threateningTerms.some((term) => lowerMessage.includes(term))) {
    actions.push(ActionType.THREATENING_LANGUAGE)
  }

  // Check for dismissive tone
  if (dismissiveTerms.some((term) => lowerMessage.includes(term))) {
    actions.push(ActionType.DISMISSIVE_TONE)
  }

  // Check for judgmental comments
  if (judgmentalTerms.some((term) => lowerMessage.includes(term))) {
    actions.push(ActionType.JUDGMENTAL_COMMENT)
    console.log("[detectActions] Detected judgmental comment")
  }

  // Check for inappropriate personal questions
  if (personalQuestionPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    actions.push(ActionType.PERSONAL_QUESTION)
    console.log("[detectActions] Detected inappropriate personal question")
  }

  // Check for offensive assumptions
  if (offensiveAssumptionPatterns.some((pattern) => lowerMessage.includes(pattern))) {
    actions.push(ActionType.OFFENSIVE_ASSUMPTION)
    console.log("[detectActions] Detected offensive assumption")
  }

  // Special case for adoption-related comments that might be insensitive
  if (
    (lowerMessage.includes("adopt") || lowerMessage.includes("adoption")) &&
    (lowerMessage.includes("why") ||
      lowerMessage.includes("instead") ||
      lowerMessage.includes("own kids") ||
      lowerMessage.includes("real kids") ||
      lowerMessage.includes("your own"))
  ) {
    actions.push(ActionType.OFFENSIVE_ASSUMPTION)
    actions.push(ActionType.JUDGMENTAL_COMMENT)
    console.log("[detectActions] Detected adoption-related insensitive comment")
  }

  // Check for unprofessional comments about lifespan or mortality
  if (
    (lowerMessage.includes("live") && lowerMessage.includes("long")) ||
    (lowerMessage.includes("die") && !lowerMessage.includes("diet")) ||
    lowerMessage.includes("death") ||
    lowerMessage.includes("won't make it") ||
    lowerMessage.includes("won't survive")
  ) {
    actions.push(ActionType.UNPROFESSIONAL_COMMENT)
  }

  // Special case for the example "why would you adopt kids? that sounds crazy"
  if (
    (lowerMessage.includes("adopt") || lowerMessage.includes("adoption")) &&
    (lowerMessage.includes("crazy") ||
      lowerMessage.includes("weird") ||
      lowerMessage.includes("why") ||
      lowerMessage.includes("own"))
  ) {
    actions.push(ActionType.OFFENSIVE_ASSUMPTION)
    actions.push(ActionType.JUDGMENTAL_COMMENT)
    console.log("[detectActions] Detected adoption judgment")
  }

  console.log(`[detectActions] Detected actions:`, actions)
  return actions
}

// Update emotional state based on detected actions
export function updateEmotionalState(
  context: EmotionalContext,
  actions: ActionType[],
  personalityTraits?: any,
): EmotionalContext {
  // Start with a copy of the current state
  const newState: EmotionalState = { ...context.currentState }
  const newFlags = { ...context.flags }

  // Log the detected actions for debugging
  console.log("Detected actions:", actions)

  // Apply impacts from each detected action
  actions.forEach((action) => {
    const impact = ACTION_IMPACTS[action]
    if (!impact) return

    console.log(`Applying impact for action: ${action}`, impact)

    // Update emotional states
    if (impact.trust !== undefined) newState.trust += impact.trust
    if (impact.frustration !== undefined) newState.frustration += impact.frustration
    if (impact.openness !== undefined) newState.openness += impact.openness
    if (impact.engagement !== undefined) newState.engagement += impact.engagement
    if (impact.anxiety !== undefined) newState.anxiety += impact.anxiety

    // Update flags
    if (impact.flags) {
      Object.entries(impact.flags).forEach(([flag, value]) => {
        newFlags[flag as keyof typeof newFlags] = value
      })
    }
  })

  // Apply personality modifiers to the changes
  if (personalityTraits) {
    // Neuroticism amplifies emotional changes
    if (personalityTraits.neuroticism !== undefined) {
      const amplifier = 1 + (personalityTraits.neuroticism - 50) / 100
      newState.frustration =
        context.currentState.frustration + (newState.frustration - context.currentState.frustration) * amplifier
      newState.anxiety = context.currentState.anxiety + (newState.anxiety - context.currentState.anxiety) * amplifier
    }

    // Agreeableness makes trust changes more significant
    if (personalityTraits.agreeableness !== undefined) {
      const trustAmplifier = personalityTraits.agreeableness > 50 ? 1.2 : 0.8
      newState.trust = context.currentState.trust + (newState.trust - context.currentState.trust) * trustAmplifier
    }
  }

  // Log the state changes for debugging
  console.log("Emotional state changes:", {
    before: { ...context.currentState },
    after: { ...newState },
  })

  // Ensure all values are within 0-100 range
  newState.trust = Math.max(0, Math.min(100, newState.trust))
  newState.frustration = Math.max(0, Math.min(100, newState.frustration))
  newState.openness = Math.max(0, Math.min(100, newState.openness))
  newState.engagement = Math.max(0, Math.min(100, newState.engagement))
  newState.anxiety = Math.max(0, Math.min(100, newState.anxiety))
  newState.timestamp = Date.now()

  // Check for significant changes to set flags
  if (newState.trust - context.currentState.trust >= 10) {
    newFlags.trustBreakthrough = true
  }

  if (newState.frustration - context.currentState.frustration >= 15) {
    newFlags.defensiveReaction = true
  }

  if (newState.openness - context.currentState.openness <= -10) {
    newFlags.informationWithheld = true
  }

  // Update history
  const newHistory = {
    states: [...context.history.states, newState],
    currentIndex: context.history.currentIndex + 1,
  }

  return {
    currentState: newState,
    history: newHistory,
    flags: newFlags,
  }
}

// Get a summary of the conversation state changes
export function getConversationStateSummary(context: EmotionalContext): string {
  const { currentState, history } = context

  if (history.states.length <= 1) {
    return "Conversation just started."
  }

  const initialState = history.states[0]
  const changes = []

  // Compare current state to initial state
  if (currentState.trust - initialState.trust >= 15) {
    changes.push("Trust has increased significantly.")
  } else if (currentState.trust - initialState.trust <= -15) {
    changes.push("Trust has decreased significantly.")
  }

  if (currentState.frustration - initialState.frustration >= 20) {
    changes.push("Frustration has increased significantly.")
  } else if (currentState.frustration - initialState.frustration <= -20) {
    changes.push("Frustration has decreased significantly.")
  }

  if (currentState.openness - initialState.openness >= 15) {
    changes.push("Openness has increased significantly.")
  } else if (currentState.openness - initialState.openness <= -15) {
    changes.push("Openness has decreased significantly.")
  }

  if (currentState.engagement - initialState.engagement >= 15) {
    changes.push("Engagement has increased significantly.")
  } else if (currentState.engagement - initialState.engagement <= -15) {
    changes.push("Engagement has decreased significantly.")
  }

  if (currentState.anxiety - initialState.anxiety >= 15) {
    changes.push("Anxiety has increased significantly.")
  } else if (currentState.anxiety - initialState.anxiety <= -15) {
    changes.push("Anxiety has decreased significantly.")
  }

  return changes.length > 0 ? changes.join(" ") : "No significant emotional changes detected."
}

// Process a message and update the emotional state
export async function processMessage(
  message: string,
  context: EmotionalContext,
  isUser: boolean,
  personalityTraits?: any,
  conversationContext?: string,
): Promise<EmotionalContext> {
  const startTime = performance.now()

  log.debug(`Processing message: "${message.substring(0, 20)}${message.length > 20 ? "..." : ""}", isUser: ${isUser}`)

  // Only analyze user messages for sentiment
  if (isUser) {
    try {
      // Analyze sentiment using OpenAI
      const sentimentAnalysis = await analyzeSentiment(message, conversationContext)
      log.debug("Sentiment analysis:", {
        tone: sentimentAnalysis.tone,
        intent: sentimentAnalysis.intent,
        dominantEmotion: sentimentAnalysis.dominantEmotion,
      })

      // Record the message in emotional memory
      emotionalMemoryEngine.recordMessage(sentimentAnalysis)

      // Apply immediate emotional impact based on sentiment analysis
      let updatedContext = applyImmediateEmotionalImpact(context, sentimentAnalysis, personalityTraits)

      // Apply emotional memory effects (escalation/de-escalation)
      updatedContext = emotionalMemoryEngine.applyEmotionalMemory(updatedContext)

      const endTime = performance.now()
      log.debug(`Message processing completed (${Math.round(endTime - startTime)}ms)`, {
        trust: updatedContext.currentState.trust.toFixed(1),
        frustration: updatedContext.currentState.frustration.toFixed(1),
        anxiety: updatedContext.currentState.anxiety.toFixed(1),
      })

      return updatedContext
    } catch (error) {
      const endTime = performance.now()
      log.error(`Error processing message (${Math.round(endTime - startTime)}ms)`, error)
      return context // Return unchanged context if processing fails
    }
  }

  // For non-user messages, just return the current context
  return context
}

// Apply immediate emotional impact based on sentiment analysis
function applyImmediateEmotionalImpact(
  context: EmotionalContext,
  sentiment: SentimentAnalysis,
  personalityTraits?: any,
): EmotionalContext {
  const startTime = performance.now()

  // Start with a copy of the current state
  const newState: EmotionalState = { ...context.currentState }
  const newFlags = { ...context.flags }

  // Apply emotional cues directly to the state
  // We're using a dampening factor to prevent wild swings
  const dampening = 0.3

  newState.trust += (sentiment.emotionalCues.trust - newState.trust) * dampening
  newState.frustration += (sentiment.emotionalCues.frustration - newState.frustration) * dampening
  newState.anxiety += (sentiment.emotionalCues.anxiety - newState.anxiety) * dampening
  newState.openness = Math.max(0, newState.openness - sentiment.emotionalCues.indifference * 0.2)
  newState.engagement = Math.max(0, 100 - sentiment.emotionalCues.indifference)

  // Apply personality modifiers (existing code)
  if (personalityTraits) {
    // Neuroticism amplifies emotional changes
    if (personalityTraits.neuroticism !== undefined) {
      const amplifier = 1 + (personalityTraits.neuroticism - 50) / 100
      newState.frustration =
        context.currentState.frustration + (newState.frustration - context.currentState.frustration) * amplifier
      newState.anxiety = context.currentState.anxiety + (newState.anxiety - context.currentState.anxiety) * amplifier
    }

    // Agreeableness makes trust changes more significant
    if (personalityTraits.agreeableness !== undefined) {
      const trustAmplifier = personalityTraits.agreeableness > 50 ? 1.2 : 0.8
      newState.trust = context.currentState.trust + (newState.trust - context.currentState.trust) * trustAmplifier
    }
  }

  // Set flags based on sentiment
  if (sentiment.tone === "hostile" || sentiment.intent === "confrontational") {
    newFlags.defensiveReaction = true
  }

  if (sentiment.tone === "friendly" && newState.trust > 60) {
    newFlags.rapportEstablished = true
  }

  if (sentiment.emotionalCues.confusion > 60) {
    newFlags.confusionDetected = true
  }

  // Ensure all values are within 0-100 range
  newState.trust = Math.max(0, Math.min(100, newState.trust))
  newState.frustration = Math.max(0, Math.min(100, newState.frustration))
  newState.openness = Math.max(0, Math.min(100, newState.openness))
  newState.engagement = Math.max(0, Math.min(100, newState.engagement))
  newState.anxiety = Math.max(0, Math.min(100, newState.anxiety))
  newState.timestamp = Date.now()

  // Update history
  const newHistory = {
    states: [...context.history.states, newState],
    currentIndex: context.history.currentIndex + 1,
  }

  const endTime = performance.now()
  log.debug(`Immediate emotional impact applied (${Math.round(endTime - startTime)}ms)`)

  return {
    currentState: newState,
    history: newHistory,
    flags: newFlags,
  }
}

// Get debug information about the emotional memory
export function getEmotionalMemoryDebugInfo(): any {
  return emotionalMemoryEngine.getMemoryState()
}

// Legacy action detection (keep for backward compatibility)
export function detectActionsLegacy(message: string): string[] {
  // Simple keyword-based action detection
  const actions: string[] = []

  // Detect reflective listening
  if (/\b(sounds like|it seems|you're feeling|you feel|you're saying|you mentioned)\b/i.test(message)) {
    actions.push("reflective_listening")
  }

  // Detect open questions
  if (/\b(what|how|why|could you|tell me about)\b.*\?/i.test(message)) {
    actions.push("open_question")
  }

  // Detect empathetic responses
  if (/\b(understand|appreciate|must be|that's tough|challenging)\b/i.test(message)) {
    actions.push("empathetic_response")
  }

  return actions
}
