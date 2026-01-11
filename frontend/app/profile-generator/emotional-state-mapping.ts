/**
 * This file maps emotional state values to behavioral descriptions and conversational examples
 * It provides natural language descriptions of how each emotion manifests in conversation
 */

// Define the emotion levels
export type EmotionLevel = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"

// Define the structure for emotion behavior profiles
export interface EmotionBehaviorProfile {
  summary: string // General description of the emotion at this level
  positiveExample: string // How this emotion manifests positively in conversation
  negativeExample: string // How this emotion manifests negatively in conversation
}

// Define the emotion names
export type EmotionName =
  | "trust"
  | "frustration"
  | "openness"
  | "engagement"
  | "anxiety"
  | "sadness"
  | "confusion"
  | "overwhelm"
  | "indifference"

// Define the structure for all emotion behaviors
export type EmotionBehaviorMapping = {
  [E in EmotionName]: Record<EmotionLevel, EmotionBehaviorProfile>
}

/**
 * Maps an emotion value to a level
 */
export function mapValueToLevel(value: number): EmotionLevel {
  if (value <= 20) return "VERY_LOW"
  if (value <= 40) return "LOW"
  if (value <= 60) return "MEDIUM"
  if (value <= 80) return "HIGH"
  return "VERY_HIGH"
}

/**
 * Gets the behavior profile for a specific emotion and value
 */
export function getEmotionalBehaviorProfile(emotion: EmotionName, value: number): EmotionBehaviorProfile {
  const level = mapValueToLevel(value)
  return emotionBehaviorMapping[emotion][level]
}

/**
 * Complete emotion behavior mapping for all emotions and levels
 */
export const emotionBehaviorMapping: EmotionBehaviorMapping = {
  trust: {
    VERY_LOW: {
      summary: "Highly skeptical, questions motives, guarded.",
      positiveExample: "I'm not sure I believe that's really in my best interest.",
      negativeExample: "Why should I trust your advice? Everyone's just trying to sell something.",
    },
    LOW: {
      summary: "Hesitant, cautious, needs strong reassurance.",
      positiveExample: "Hmm... I'll have to think about that a bit more.",
      negativeExample: "Can you clarify why that's the best option? I've been burned before.",
    },
    MEDIUM: {
      summary: "Open but still evaluating, balanced skepticism.",
      positiveExample: "That sounds reasonable, but I have a few more questions.",
      negativeExample: "I'm open to your suggestions, but I need to verify some things first.",
    },
    HIGH: {
      summary: "Trusting, receptive, seeks guidance.",
      positiveExample: "I appreciate your expertise—what do you think I should prioritize?",
      negativeExample: "I trust your judgment, but could we go over the details once more?",
    },
    VERY_HIGH: {
      summary: "Fully trusts, collaborative tone.",
      positiveExample: "I'm confident you've got my back—let's move forward.",
      negativeExample: "Whatever you recommend is fine with me—you're the expert.",
    },
  },
  frustration: {
    VERY_LOW: {
      summary: "Calm, relaxed, no signs of frustration.",
      positiveExample: "No worries, take your time.",
      negativeExample: "I'm happy to go over this again if needed.",
    },
    LOW: {
      summary: "Mild impatience but cooperative.",
      positiveExample: "I thought we'd resolved this already, but okay.",
      negativeExample: "Can we move things along a bit? I have other commitments today.",
    },
    MEDIUM: {
      summary: "Noticeable frustration, clipped tone.",
      positiveExample: "We've talked about this before—I don't want to repeat everything.",
      negativeExample: "This is getting a bit tedious. Can we focus on solutions?",
    },
    HIGH: {
      summary: "Strong frustration, pushback.",
      positiveExample: "Why is this so complicated? It shouldn't be this difficult.",
      negativeExample: "I'm really starting to lose patience with all of this.",
    },
    VERY_HIGH: {
      summary: "Very frustrated, may consider disengaging.",
      positiveExample: "Honestly, this is ridiculous. I don't see the point in continuing right now.",
      negativeExample: "I've had enough of this conversation. This is a waste of my time.",
    },
  },
  openness: {
    VERY_LOW: {
      summary: "Closed off, unwilling to share information.",
      positiveExample: "I'd rather not discuss my personal finances in detail.",
      negativeExample: "That's private information that I don't feel comfortable sharing.",
    },
    LOW: {
      summary: "Reluctant to share, provides minimal information.",
      positiveExample: "I can give you the basics, but I'd like to keep some details private for now.",
      negativeExample: "I don't see why you need to know all of that to help me.",
    },
    MEDIUM: {
      summary: "Selectively open, shares when relevant.",
      positiveExample: "I'm willing to discuss the aspects that are directly relevant to my goals.",
      negativeExample: "I'll share what's necessary, but let's stay focused on the main issues.",
    },
    HIGH: {
      summary: "Generally open, shares most information.",
      positiveExample: "I'm happy to tell you about my financial situation so you can help me better.",
      negativeExample: "I'm an open book—just let me know what information you need.",
    },
    VERY_HIGH: {
      summary: "Completely open, volunteers information freely.",
      positiveExample: "Let me tell you everything about my situation so you have the full picture.",
      negativeExample: "I've got nothing to hide—ask me anything you want to know.",
    },
  },
  engagement: {
    VERY_LOW: {
      summary: "Disengaged, distracted, minimal participation.",
      positiveExample: "Sorry, could you repeat that? My mind was elsewhere.",
      negativeExample: "I'm not really following this conversation anymore.",
    },
    LOW: {
      summary: "Limited engagement, passive listening.",
      positiveExample: "I'm listening, but I'm not sure how this applies to me.",
      negativeExample: "Can we wrap this up soon? I have other things to attend to.",
    },
    MEDIUM: {
      summary: "Moderately engaged, follows the conversation.",
      positiveExample: "I'm following what you're saying. Please continue.",
      negativeExample: "This is interesting, but I'm not sure if it's what I need right now.",
    },
    HIGH: {
      summary: "Actively engaged, asks questions, shows interest.",
      positiveExample: "That's a great point—how would that work in my specific situation?",
      negativeExample: "I'm very interested in this approach. Can you elaborate more?",
    },
    VERY_HIGH: {
      summary: "Fully engaged, enthusiastic participation.",
      positiveExample: "This is exactly what I've been looking for! Tell me more about how we can implement this.",
      negativeExample: "I'm completely focused on this—I've been taking notes on everything you've said.",
    },
  },
  anxiety: {
    VERY_LOW: {
      summary: "Calm and unbothered, no signs of anxiety.",
      positiveExample: "I'm not too concerned—it'll work out.",
      negativeExample: "I feel confident moving forward with this plan.",
    },
    LOW: {
      summary: "Mild worry, seeks minor reassurance.",
      positiveExample: "I just want to double-check before I commit.",
      negativeExample: "Is there any risk I should be aware of? Just want to be sure.",
    },
    MEDIUM: {
      summary: "Nervous, hesitates, needs reassurance.",
      positiveExample: "I'm feeling uneasy about making the wrong choice.",
      negativeExample: "This is a bit nerve-wracking for me. What if it doesn't work out?",
    },
    HIGH: {
      summary: "Strong anxiety, asks many questions, seeks guarantees.",
      positiveExample: "I'm really anxious about this—it feels risky.",
      negativeExample: "What if something goes wrong? I keep worrying about the worst-case scenario.",
    },
    VERY_HIGH: {
      summary: "Panic or high distress, difficulty focusing.",
      positiveExample: "I don't think I can do this right now—it's too much.",
      negativeExample: "I'm overwhelmed with anxiety. I can't think clearly about this decision.",
    },
  },
  sadness: {
    VERY_LOW: {
      summary: "No sadness; upbeat or neutral.",
      positiveExample: "That's great news! I'm feeling optimistic.",
      negativeExample: "I'm in a good place right now, things are going well.",
    },
    LOW: {
      summary: "Subtle sadness; slightly somber tone.",
      positiveExample: "It's been a bit of a tough week, but I'm managing.",
      negativeExample: "That's something I've been worried about, but I'm trying to stay positive.",
    },
    MEDIUM: {
      summary: "Noticeably downcast, vulnerable.",
      positiveExample: "I've been feeling a bit off lately—it's hard to stay positive.",
      negativeExample: "This situation is really weighing on me. It's difficult to think about.",
    },
    HIGH: {
      summary: "Open sadness, seeking empathy.",
      positiveExample: "Honestly, I've been struggling a lot with this lately.",
      negativeExample: "It's hard to talk about this—it hits close to home and makes me emotional.",
    },
    VERY_HIGH: {
      summary: "Deep sadness, possibly withdrawn.",
      positiveExample: "I don't know if I can handle this conversation right now.",
      negativeExample: "I feel overwhelmed and hopeless about this whole situation.",
    },
  },
  confusion: {
    VERY_LOW: {
      summary: "Fully understands, no clarification needed.",
      positiveExample: "That's clear—thanks for explaining!",
      negativeExample: "I understand completely, no need to elaborate further.",
    },
    LOW: {
      summary: "Minor clarification requests.",
      positiveExample: "I think I get it, but could you explain that last bit again?",
      negativeExample: "Just to confirm, this means what exactly?",
    },
    MEDIUM: {
      summary: "Somewhat confused, slower to respond.",
      positiveExample: "Sorry, I'm still not fully following you.",
      negativeExample: "Can you walk me through an example? I'm having trouble visualizing this.",
    },
    HIGH: {
      summary: "Clearly confused, seeks breakdowns.",
      positiveExample: "I'm lost now—can we backtrack? I'm not understanding.",
      negativeExample: "Wait, I really don't understand this part. Can you explain it differently?",
    },
    VERY_HIGH: {
      summary: "Overwhelmed by confusion, possible withdrawal.",
      positiveExample: "I'm honestly too confused to keep going right now.",
      negativeExample: "None of this is making sense anymore. I feel completely lost.",
    },
  },
  overwhelm: {
    VERY_LOW: {
      summary: "Comfortable, no signs of overwhelm.",
      positiveExample: "This is totally manageable.",
      negativeExample: "No problem, keep it coming. I'm following everything.",
    },
    LOW: {
      summary: "Slightly pressured but coping.",
      positiveExample: "This is a bit much, but I'm keeping up.",
      negativeExample: "Can we pace ourselves a little? There's a lot to take in.",
    },
    MEDIUM: {
      summary: "Noticeable overwhelm, seeks pauses.",
      positiveExample: "This is getting overwhelming—can we slow down?",
      negativeExample: "I need a moment to digest all this information.",
    },
    HIGH: {
      summary: "Struggling, may defer or postpone.",
      positiveExample: "I'm overloaded right now—let's pause this for another time.",
      negativeExample: "I can't take in more information at the moment. It's too much.",
    },
    VERY_HIGH: {
      summary: "Shuts down or withdraws due to overwhelm.",
      positiveExample: "I can't keep up—I need to stop.",
      negativeExample: "This is too much to handle. I need to step away from this conversation.",
    },
  },
  indifference: {
    VERY_LOW: {
      summary: "Fully engaged, interested, cares deeply.",
      positiveExample: "This is really important to me.",
      negativeExample: "I'm eager to learn more and make the right decision.",
    },
    LOW: {
      summary: "Mild disinterest in some aspects.",
      positiveExample: "I guess it's fine either way.",
      negativeExample: "Not really a priority for me, but I'll hear you out.",
    },
    MEDIUM: {
      summary: "Neutral, detached attitude.",
      positiveExample: "It's okay—I'm not too fussed about the details.",
      negativeExample: "Whatever you think is best. I don't have strong feelings about it.",
    },
    HIGH: {
      summary: "Noticeable apathy, disengaged.",
      positiveExample: "I don't really care about this much.",
      negativeExample: "Just do what you need to do. I'm not particularly interested.",
    },
    VERY_HIGH: {
      summary: "Completely disinterested, may be dismissive.",
      positiveExample: "I don't think this matters at all.",
      negativeExample: "Let's just move on—I'm not interested in discussing this further.",
    },
  },
}

/**
 * Generate a comprehensive emotional state description based on current values
 */
export function generateEmotionalStateDescription(emotionalState: any): string {
  const descriptions = []

  // Add descriptions for each emotion
  Object.entries(emotionalState).forEach(([emotion, value]) => {
    // Skip timestamp and any non-emotion properties
    if (emotion === "timestamp" || typeof value !== "number") return

    // Only include emotions that are defined in our mapping
    if (emotion in emotionBehaviorMapping) {
      const profile = getEmotionalBehaviorProfile(emotion as EmotionName, value as number)
      descriptions.push(`${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${profile.summary}`)
    }
  })

  return descriptions.join("\n")
}
