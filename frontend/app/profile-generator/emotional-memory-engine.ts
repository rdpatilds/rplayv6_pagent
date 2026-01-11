import type { EmotionalContext } from "./emotional-state-model"
import type { SentimentAnalysis } from "./sentiment-analyzer"
import { logger } from "@/utils/logger"

// Create module-specific logger
const log = logger.forModule("emotionalMemory")

interface EmotionalMemory {
  recentMessages: {
    timestamp: number
    sentiment: SentimentAnalysis
  }[]
  offenseCount: number
  lastPositiveInteraction: number
  cooldownActive: boolean
}

export class EmotionalMemoryEngine {
  private memory: EmotionalMemory = {
    recentMessages: [],
    offenseCount: 0,
    lastPositiveInteraction: Date.now(),
    cooldownActive: false,
  }

  // Maximum number of messages to keep in memory
  private readonly MEMORY_SIZE = 5

  // Cooldown period in milliseconds (5 minutes)
  private readonly COOLDOWN_PERIOD = 5 * 60 * 1000

  // Escalation factors
  private readonly FIRST_OFFENSE_FACTOR = 1.0
  private readonly REPEAT_OFFENSE_FACTOR = 1.5
  private readonly PERSISTENT_OFFENSE_FACTOR = 2.0

  // De-escalation factors
  private readonly TRUST_REBUILD_RATE = 5 // points per positive interaction
  private readonly FRUSTRATION_DECAY_RATE = 3 // points per minute of positive interaction

  /**
   * Record a new message and its sentiment analysis
   */
  public recordMessage(sentiment: SentimentAnalysis): void {
    const startTime = performance.now()

    // Add to recent messages
    this.memory.recentMessages.unshift({
      timestamp: Date.now(),
      sentiment,
    })

    // Keep only the most recent messages
    if (this.memory.recentMessages.length > this.MEMORY_SIZE) {
      this.memory.recentMessages.pop()
    }

    // Update offense count if message is negative
    if (sentiment.tone === "hostile" || sentiment.intent === "confrontational" || sentiment.intent === "dismissive") {
      this.memory.offenseCount++
      log.debug(`Offense detected. Count: ${this.memory.offenseCount}`)
    } else if (sentiment.tone === "friendly" || sentiment.intent === "trust-building") {
      // Record positive interaction
      this.memory.lastPositiveInteraction = Date.now()
      log.debug(`Positive interaction recorded`)
    }

    const endTime = performance.now()
    log.debug(`Message recorded in emotional memory (${Math.round(endTime - startTime)}ms)`)
  }

  /**
   * Apply emotional memory effects to the current emotional state
   */
  public applyEmotionalMemory(context: EmotionalContext): EmotionalContext {
    const startTime = performance.now()

    const newState = { ...context.currentState }
    const newFlags = { ...context.flags }

    // Check if we're in a cooldown period
    const timeSinceLastPositive = Date.now() - this.memory.lastPositiveInteraction
    const inCooldownPeriod = timeSinceLastPositive < this.COOLDOWN_PERIOD

    // Apply escalation based on offense count
    if (this.memory.offenseCount > 0 && !this.memory.cooldownActive) {
      let escalationFactor = this.FIRST_OFFENSE_FACTOR

      if (this.memory.offenseCount >= 3) {
        escalationFactor = this.PERSISTENT_OFFENSE_FACTOR
        newFlags.defensiveReaction = true
      } else if (this.memory.offenseCount >= 2) {
        escalationFactor = this.REPEAT_OFFENSE_FACTOR
      }

      log.debug(`Applying escalation factor: ${escalationFactor}`)

      // Apply escalation to emotional state
      // We're only modifying trust and frustration here as an example
      const trustImpact = -10 * escalationFactor
      const frustrationImpact = 15 * escalationFactor

      newState.trust = Math.max(0, Math.min(100, newState.trust + trustImpact))
      newState.frustration = Math.max(0, Math.min(100, newState.frustration + frustrationImpact))

      // Activate cooldown after applying escalation
      this.memory.cooldownActive = true

      log.debug(`Emotional state after escalation:`, {
        trust: newState.trust.toFixed(1),
        frustration: newState.frustration.toFixed(1),
      })
    }

    // Apply de-escalation if in cooldown period and recent interactions are positive
    if (inCooldownPeriod && this.memory.cooldownActive) {
      const recentPositiveCount = this.memory.recentMessages.filter(
        (m) => m.sentiment.tone === "friendly" || m.sentiment.intent === "trust-building",
      ).length

      if (recentPositiveCount >= 2) {
        // Reset cooldown and reduce offense count
        this.memory.cooldownActive = false
        this.memory.offenseCount = Math.max(0, this.memory.offenseCount - 1)

        // Apply trust rebuild
        const trustRebuild = this.TRUST_REBUILD_RATE * recentPositiveCount
        newState.trust = Math.max(0, Math.min(100, newState.trust + trustRebuild))

        // Apply frustration decay
        const minutesSinceLastOffense = timeSinceLastPositive / (60 * 1000)
        const frustrationDecay = this.FRUSTRATION_DECAY_RATE * minutesSinceLastOffense
        newState.frustration = Math.max(0, newState.frustration - frustrationDecay)

        log.debug(`Applied de-escalation:`, {
          trustRebuild: trustRebuild.toFixed(1),
          frustrationDecay: frustrationDecay.toFixed(1),
          newTrust: newState.trust.toFixed(1),
          newFrustration: newState.frustration.toFixed(1),
        })
      }
    }

    // Update timestamp
    newState.timestamp = Date.now()

    // Update history
    const newHistory = {
      states: [...context.history.states, newState],
      currentIndex: context.history.currentIndex + 1,
    }

    const endTime = performance.now()
    log.debug(`Emotional memory applied (${Math.round(endTime - startTime)}ms)`)

    return {
      currentState: newState,
      history: newHistory,
      flags: newFlags,
    }
  }

  /**
   * Get the current emotional memory state for debugging
   */
  public getMemoryState(): EmotionalMemory {
    return { ...this.memory }
  }
}
