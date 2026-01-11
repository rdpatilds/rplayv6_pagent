import { type EmotionalContext, initializeEmotionalContext } from "./emotional-state-model"
import { detectActions, updateEmotionalState } from "./conversation-state-tracker"

// Interface for the emotional state store
interface EmotionalStateStore {
  context: EmotionalContext | null
  profile: any | null
  initialize: (profile: any) => void
  processMessage: (message: string, isUser: boolean) => void
  getContext: () => EmotionalContext | null
}

// Create a singleton store for the emotional state
let store: EmotionalStateStore | null = null

// Create or get the emotional state store
export function getEmotionalStateStore(): EmotionalStateStore {
  if (!store) {
    let context: EmotionalContext | null = null
    let profile: any | null = null

    store = {
      context,
      profile,

      initialize: (newProfile: any) => {
        profile = newProfile
        context = initializeEmotionalContext(profile.fusionModelTraits)
        console.log("Emotional state store initialized with profile:", profile)
        console.log("Initial emotional context:", context)
      },

      processMessage: (message: string, isUser: boolean) => {
        if (!context || !profile) {
          console.warn("Emotional state store not initialized before processing message")
          return
        }

        console.log(`[EmotionalStateStore] Processing ${isUser ? "user" : "AI"} message:`, message)

        // Only process user messages for emotional impact
        if (isUser) {
          console.log("[EmotionalStateStore] Detecting actions for user message")
          const actions = detectActions(message)
          console.log("[EmotionalStateStore] Detected actions:", actions)

          if (actions.length > 0) {
            console.log("[EmotionalStateStore] Emotional state before update:", context.currentState)
            context = updateEmotionalState(context, actions, profile.fusionModelTraits)
            console.log("[EmotionalStateStore] Emotional state after update:", context.currentState)
          } else {
            console.log("[EmotionalStateStore] No actions detected, emotional state unchanged")
          }
        } else {
          console.log("[EmotionalStateStore] Skipping emotional impact processing for AI message")
        }
      },

      getContext: () => context,
    }
  }

  return store
}

// Reset the store (useful for testing or starting new conversations)
export function resetEmotionalStateStore(): void {
  store = null
}
