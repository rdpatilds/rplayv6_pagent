// Defines the emotional state model for dynamic personality simulation

// Base emotional state interface
export interface EmotionalState {
  trust: number // 0-100: How much the client trusts the advisor
  frustration: number // 0-100: How frustrated the client is with the conversation
  openness: number // 0-100: How willing the client is to share information
  engagement: number // 0-100: How engaged the client is in the conversation
  anxiety: number // 0-100: How anxious the client is about the topic
  timestamp: number // When this state was recorded
}

// History of emotional states to track changes over time
export interface EmotionalStateHistory {
  states: EmotionalState[]
  currentIndex: number
}

// Flags for specific conversation events
export interface ConversationFlags {
  trustBreakthrough: boolean // A significant increase in trust occurred
  defensiveReaction: boolean // Client became defensive
  informationWithheld: boolean // Client actively avoided sharing information
  buySignal: boolean // Client showed interest in a product/service
  confusionDetected: boolean // Client expressed confusion
  concernAddressed: boolean // A concern was successfully addressed
  rapportEstablished: boolean // Good rapport has been established
}

// Complete emotional context that combines state and flags
export interface EmotionalContext {
  currentState: EmotionalState
  history: EmotionalStateHistory
  flags: ConversationFlags
}

// Initialize a new emotional state based on personality traits
export function initializeEmotionalState(personalityTraits: any): EmotionalState {
  // Default starting values
  const baseState: EmotionalState = {
    trust: 50,
    frustration: 20,
    openness: 50,
    engagement: 60,
    anxiety: 40,
    timestamp: Date.now(),
  }

  // Adjust based on personality traits if available
  if (personalityTraits) {
    // Trust is influenced by agreeableness and honesty-humility
    if (personalityTraits.agreeableness !== undefined) {
      baseState.trust += (personalityTraits.agreeableness - 50) * 0.3
    }
    if (personalityTraits.honestyHumility !== undefined) {
      baseState.trust += (personalityTraits.honestyHumility - 50) * 0.2
    }

    // Openness is influenced by extraversion and openness traits
    if (personalityTraits.extraversion !== undefined) {
      baseState.openness += (personalityTraits.extraversion - 50) * 0.3
    }
    if (personalityTraits.openness !== undefined) {
      baseState.openness += (personalityTraits.openness - 50) * 0.3
    }

    // Anxiety is influenced by neuroticism
    if (personalityTraits.neuroticism !== undefined) {
      baseState.anxiety += (personalityTraits.neuroticism - 50) * 0.5
    }

    // Engagement is influenced by conscientiousness and extraversion
    if (personalityTraits.conscientiousness !== undefined) {
      baseState.engagement += (personalityTraits.conscientiousness - 50) * 0.2
    }
    if (personalityTraits.extraversion !== undefined) {
      baseState.engagement += (personalityTraits.extraversion - 50) * 0.3
    }

    // Frustration starts lower for agreeable people
    if (personalityTraits.agreeableness !== undefined) {
      baseState.frustration -= (personalityTraits.agreeableness - 50) * 0.2
    }
  }

  // Ensure all values are within 0-100 range
  return {
    trust: Math.max(0, Math.min(100, baseState.trust)),
    frustration: Math.max(0, Math.min(100, baseState.frustration)),
    openness: Math.max(0, Math.min(100, baseState.openness)),
    engagement: Math.max(0, Math.min(100, baseState.engagement)),
    anxiety: Math.max(0, Math.min(100, baseState.anxiety)),
    timestamp: baseState.timestamp,
  }
}

// Initialize a new emotional context
export function initializeEmotionalContext(personalityTraits: any): EmotionalContext {
  const initialState = initializeEmotionalState(personalityTraits)

  return {
    currentState: initialState,
    history: {
      states: [initialState],
      currentIndex: 0,
    },
    flags: {
      trustBreakthrough: false,
      defensiveReaction: false,
      informationWithheld: false,
      buySignal: false,
      confusionDetected: false,
      concernAddressed: false,
      rapportEstablished: false,
    },
  }
}

// Get a description of the current emotional state for prompt injection
export function getEmotionalStateDescription(state: EmotionalState): string {
  const descriptions = []

  // Trust descriptions
  if (state.trust >= 80) {
    descriptions.push("You feel very comfortable with this advisor and are willing to share personal information.")
  } else if (state.trust >= 60) {
    descriptions.push("You generally trust this advisor but still maintain some caution.")
  } else if (state.trust >= 40) {
    descriptions.push("You're somewhat cautious about fully trusting this advisor.")
  } else if (state.trust >= 20) {
    descriptions.push("You're skeptical of this advisor and hesitant to share sensitive information.")
  } else {
    descriptions.push("You're very distrustful of this advisor and reluctant to share any personal details.")
  }

  // Frustration descriptions
  if (state.frustration >= 70) {
    descriptions.push("You're feeling very frustrated with this conversation.")
  } else if (state.frustration >= 50) {
    descriptions.push("You're showing signs of frustration with how this conversation is going.")
  } else if (state.frustration <= 20) {
    descriptions.push("You're feeling calm and patient with the advisor.")
  }

  // Openness descriptions
  if (state.openness >= 70) {
    descriptions.push("You're very willing to discuss your situation openly.")
  } else if (state.openness <= 30) {
    descriptions.push("You're being guarded about sharing information.")
  }

  // Engagement descriptions
  if (state.engagement >= 70) {
    descriptions.push("You're highly engaged in this conversation.")
  } else if (state.engagement <= 30) {
    descriptions.push("You're disinterested in this conversation and your attention is wandering.")
  }

  // Anxiety descriptions
  if (state.anxiety >= 70) {
    descriptions.push("You're feeling anxious about the financial matters being discussed.")
  } else if (state.anxiety <= 30) {
    descriptions.push("You're feeling relaxed and comfortable with the financial discussion.")
  }

  return descriptions.join(" ")
}
