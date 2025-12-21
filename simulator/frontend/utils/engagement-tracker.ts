/**
 * Engagement Tracker Utility
 *
 * A lightweight client-side utility for tracking user engagement during simulations.
 * Captures key interaction events and sends them to the server for analysis.
 */

// Types for engagement events
export type EngagementEventType =
  | "simulation_load" // Simulation page loaded
  | "simulation_exit" // User exited simulation
  | "help_opened" // "Needs Help" feature opened
  | "help_closed" // "Needs Help" feature closed
  | "objective_completed" // Simulation objective completed
  | "message_sent" // User sent a message
  | "tab_switch" // User switched tabs
  | "expert_mode_toggle" // User toggled expert mode
  | "feedback_toggle" // User toggled feedback visibility
  | "note_created" // User started taking notes
  | "note_updated" // User updated their notes
  | "note_section_toggled" // User expanded/collapsed the notes section
  | "note_analyzed" // System analyzed note content
  | "session_idle" // User was idle for a period
  | "session_active" // User returned from idle state

// Interface for engagement event data
export interface EngagementEvent {
  type: EngagementEventType
  timestamp: string
  sessionId: string
  simulationId?: string
  userId?: string
  metadata?: Record<string, any>
}

// Generate or retrieve a session ID
const getSessionId = (): string => {
  if (typeof window === "undefined") return "server-side"

  let sessionId = sessionStorage.getItem("engagementSessionId")

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem("engagementSessionId", sessionId)
  }

  return sessionId
}

// Log an engagement event
export const logEngagementEvent = async (
  type: EngagementEventType,
  simulationId?: string,
  userId?: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  try {
    const event: EngagementEvent = {
      type,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      simulationId,
      userId,
      metadata,
    }

    // Send the event to the server
    await fetch("/api/engagement/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true,
    }).catch((error) => {
      // Silent failure - just log to console
      console.warn("Failed to log engagement event:", error)
    })
  } catch (error) {
    // Silent failure - just log to console
    console.warn("Error in engagement tracking:", error)
  }
}

// Helper functions for common events

// Track simulation page load
export const trackSimulationLoad = (simulationId?: string, userId?: string, metadata?: Record<string, any>) => {
  logEngagementEvent("simulation_load", simulationId, userId, metadata)
}

// Track simulation exit
export const trackSimulationExit = (simulationId?: string, userId?: string, metadata?: Record<string, any>) => {
  logEngagementEvent("simulation_exit", simulationId, userId, metadata)
}

// Track help button usage
export const trackHelpUsage = (
  isOpening: boolean,
  simulationId?: string,
  userId?: string,
  metadata?: Record<string, any>,
) => {
  logEngagementEvent(isOpening ? "help_opened" : "help_closed", simulationId, userId, metadata)
}

// Track objective completion
export const trackObjectiveCompleted = (
  objectiveId: string,
  objectiveName: string,
  simulationId?: string,
  userId?: string,
) => {
  logEngagementEvent("objective_completed", simulationId, userId, {
    objectiveId,
    objectiveName,
  })
}

// Track message sent
export const trackMessageSent = (messageLength: number, simulationId?: string, userId?: string) => {
  logEngagementEvent("message_sent", simulationId, userId, {
    messageLength,
  })
}

// Track tab switch
export const trackTabSwitch = (fromTab: string, toTab: string, simulationId?: string, userId?: string) => {
  logEngagementEvent("tab_switch", simulationId, userId, {
    fromTab,
    toTab,
  })
}

// Track expert mode toggle
export const trackExpertModeToggle = (enabled: boolean, simulationId?: string, userId?: string) => {
  logEngagementEvent("expert_mode_toggle", simulationId, userId, {
    enabled,
  })
}

// NEW: Track notes section toggle
export const trackNoteSectionToggle = (isOpen: boolean, simulationId?: string, userId?: string) => {
  logEngagementEvent("note_section_toggled", simulationId, userId, {
    isOpen,
  })
}

// NEW: Track note creation (first time adding notes)
export const trackNoteCreated = (simulationId?: string, userId?: string) => {
  logEngagementEvent("note_created", simulationId, userId)
}

// NEW: Track note updates
export const trackNoteUpdated = (noteLength: number, changeSize: number, simulationId?: string, userId?: string) => {
  logEngagementEvent("note_updated", simulationId, userId, {
    noteLength,
    changeSize,
  })
}

// NEW: Track note content analysis
export const trackNoteAnalysis = (noteContent: string, simulationId?: string, userId?: string) => {
  // Simple content analysis
  const analysis = analyzeNoteContent(noteContent)

  logEngagementEvent("note_analyzed", simulationId, userId, {
    ...analysis,
    // Don't include the full note content for privacy reasons
    // Just include the length and analysis results
    noteLength: noteContent.length,
  })
}

// NEW: Simple note content analyzer
const analyzeNoteContent = (content: string) => {
  if (!content || content.trim().length === 0) {
    return {
      isEmpty: true,
      hasStructure: false,
      topicCategories: [],
      bulletPointCount: 0,
      questionCount: 0,
      numberCount: 0,
    }
  }

  // Check for structure (bullet points, numbering, etc.)
  const hasBulletPoints = /^[•\-*]\s/m.test(content)
  const hasNumbering = /^\d+\.\s/m.test(content)
  const hasStructure = hasBulletPoints || hasNumbering

  // Count bullet points
  const bulletPointCount = (content.match(/^[•\-*]\s/gm) || []).length

  // Count questions
  const questionCount = (content.match(/\?/g) || []).length

  // Count numbers (potential financial figures)
  const numberCount = (content.match(/\$\d+|\d+%|\d+,\d+/g) || []).length

  // Check for common financial topics
  const topicCategories = []
  if (/goal|objective|aim|target/i.test(content)) topicCategories.push("goals")
  if (/financ|money|budget|income|salary/i.test(content)) topicCategories.push("financial")
  if (/insur|coverage|policy|premium/i.test(content)) topicCategories.push("insurance")
  if (/invest|portfolio|stock|bond|fund/i.test(content)) topicCategories.push("investments")
  if (/retire|pension|401k|ira/i.test(content)) topicCategories.push("retirement")
  if (/tax|deduction|write-off/i.test(content)) topicCategories.push("taxes")
  if (/estate|will|trust|inherit/i.test(content)) topicCategories.push("estate")
  if (/debt|loan|mortgage|credit/i.test(content)) topicCategories.push("debt")
  if (/child|college|education|school/i.test(content)) topicCategories.push("education")

  return {
    isEmpty: false,
    hasStructure,
    topicCategories,
    bulletPointCount,
    questionCount,
    numberCount,
  }
}

// Calculate and track engagement metrics for a completed session
export const trackEngagementMetrics = (
  simulationId: string,
  userId: string,
  metrics: {
    totalMessages: number
    timeInSimulationMinutes: number
    usedNeedsHelp: boolean
    exitedEarly: boolean
    objectivesCompleted: number
    coachingInteractions: number
    // NEW: Note-taking metrics
    tookNotes: boolean
    noteLength?: number
    noteUpdateCount?: number
  },
) => {
  logEngagementEvent("simulation_exit", simulationId, userId, {
    ...metrics,
    isEngagementSummary: true,
  })
}
