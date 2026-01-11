import { query, querySingle, sql } from "./db"

// Types
export type SimulationSession = {
  id: string
  user_id: string
  industry_id?: string
  subcategory_id?: string
  focus_area_id?: string
  difficulty_level?: string
  client_profile?: any
  simulation_messages?: any
  is_replay: boolean
  original_session_id?: string
  xp_earned?: number
  started_at: Date
  ended_at?: Date
}

export type SimulationObjective = {
  id: string
  session_id: string
  objective_name: string
  status: "not_started" | "in_progress" | "completed"
  updated_at: Date
}

export type XpLogEntry = {
  id: string
  user_id: string
  session_id: string
  xp_source: string
  amount: number
  awarded_at: Date
}

export type FeedbackNps = {
  id: string
  user_id: string
  session_id: string
  rating: number
  comment?: string
  created_at: Date
}

export type EngagementEvent = {
  id: string
  user_id: string
  session_id: string
  event_type: string
  event_payload?: any
  occurred_at: Date
}

// Session functions
export async function createSimulationSession(
  userId: string,
  data: Partial<SimulationSession>,
): Promise<SimulationSession> {
  const result = await sql`
    INSERT INTO simulation_sessions (
      user_id, 
      industry_id, 
      subcategory_id, 
      focus_area_id, 
      difficulty_level, 
      client_profile, 
      simulation_messages, 
      is_replay, 
      original_session_id
    ) VALUES (
      ${userId}, 
      ${data.industry_id || null}, 
      ${data.subcategory_id || null}, 
      ${data.focus_area_id || null}, 
      ${data.difficulty_level || null}, 
      ${data.client_profile ? JSON.stringify(data.client_profile) : null}, 
      ${data.simulation_messages ? JSON.stringify(data.simulation_messages) : null}, 
      ${data.is_replay || false}, 
      ${data.original_session_id || null}
    ) RETURNING *
  `
  return result.rows[0]
}

export async function getSimulationSession(sessionId: string): Promise<SimulationSession | null> {
  return querySingle<SimulationSession>("SELECT * FROM simulation_sessions WHERE id = $1", [sessionId])
}

export async function getUserSimulationSessions(userId: string): Promise<SimulationSession[]> {
  return query<SimulationSession>("SELECT * FROM simulation_sessions WHERE user_id = $1 ORDER BY started_at DESC", [
    userId,
  ])
}

export async function updateSimulationSession(
  sessionId: string,
  data: Partial<SimulationSession>,
): Promise<SimulationSession | null> {
  const updates = []
  const values = []
  let paramIndex = 1

  // Build dynamic update query
  if (data.industry_id !== undefined) {
    updates.push(`industry_id = $${paramIndex++}`)
    values.push(data.industry_id)
  }
  if (data.subcategory_id !== undefined) {
    updates.push(`subcategory_id = $${paramIndex++}`)
    values.push(data.subcategory_id)
  }
  if (data.focus_area_id !== undefined) {
    updates.push(`focus_area_id = $${paramIndex++}`)
    values.push(data.focus_area_id)
  }
  if (data.difficulty_level !== undefined) {
    updates.push(`difficulty_level = $${paramIndex++}`)
    values.push(data.difficulty_level)
  }
  if (data.client_profile !== undefined) {
    updates.push(`client_profile = $${paramIndex++}`)
    values.push(JSON.stringify(data.client_profile))
  }
  if (data.simulation_messages !== undefined) {
    updates.push(`simulation_messages = $${paramIndex++}`)
    values.push(JSON.stringify(data.simulation_messages))
  }
  if (data.xp_earned !== undefined) {
    updates.push(`xp_earned = $${paramIndex++}`)
    values.push(data.xp_earned)
  }
  if (data.ended_at !== undefined) {
    updates.push(`ended_at = $${paramIndex++}`)
    values.push(data.ended_at)
  }

  if (updates.length === 0) {
    return getSimulationSession(sessionId)
  }

  // Add session ID to values
  values.push(sessionId)

  const result = await query<SimulationSession>(
    `UPDATE simulation_sessions SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )

  return result.length > 0 ? result[0] : null
}

export async function endSimulationSession(sessionId: string): Promise<SimulationSession | null> {
  return querySingle<SimulationSession>("UPDATE simulation_sessions SET ended_at = NOW() WHERE id = $1 RETURNING *", [
    sessionId,
  ])
}

// Objectives functions
export async function createSimulationObjective(
  sessionId: string,
  objectiveName: string,
): Promise<SimulationObjective> {
  const result = await sql`
    INSERT INTO simulation_objectives (session_id, objective_name)
    VALUES (${sessionId}, ${objectiveName})
    RETURNING *
  `
  return result.rows[0]
}

export async function getSessionObjectives(sessionId: string): Promise<SimulationObjective[]> {
  return query<SimulationObjective>("SELECT * FROM simulation_objectives WHERE session_id = $1", [sessionId])
}

export async function updateObjectiveStatus(
  objectiveId: string,
  status: "not_started" | "in_progress" | "completed",
): Promise<SimulationObjective | null> {
  return querySingle<SimulationObjective>(
    "UPDATE simulation_objectives SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
    [status, objectiveId],
  )
}

// XP functions
export async function awardXp(userId: string, sessionId: string, amount: number, source: string): Promise<XpLogEntry> {
  const result = await sql`
    INSERT INTO xp_log (user_id, session_id, amount, xp_source)
    VALUES (${userId}, ${sessionId}, ${amount}, ${source})
    RETURNING *
  `

  // Update the session's xp_earned
  await sql`
    UPDATE simulation_sessions 
    SET xp_earned = COALESCE(xp_earned, 0) + ${amount}
    WHERE id = ${sessionId}
  `

  return result.rows[0]
}

export async function getUserXpTotal(userId: string): Promise<number> {
  const result = await sql`
    SELECT SUM(amount) as total_xp
    FROM xp_log
    WHERE user_id = ${userId}
  `
  return result.rows[0]?.total_xp || 0
}

export async function getUserXpLog(userId: string): Promise<XpLogEntry[]> {
  return query<XpLogEntry>("SELECT * FROM xp_log WHERE user_id = $1 ORDER BY awarded_at DESC", [userId])
}

// NPS feedback functions
export async function submitNpsFeedback(
  userId: string,
  sessionId: string,
  rating: number,
  comment?: string,
): Promise<FeedbackNps> {
  const result = await sql`
    INSERT INTO feedback_nps (user_id, session_id, rating, comment)
    VALUES (${userId}, ${sessionId}, ${rating}, ${comment || null})
    RETURNING *
  `
  return result.rows[0]
}

export async function getSessionFeedback(sessionId: string): Promise<FeedbackNps | null> {
  return querySingle<FeedbackNps>("SELECT * FROM feedback_nps WHERE session_id = $1", [sessionId])
}

export async function getAllFeedback(): Promise<FeedbackNps[]> {
  return query<FeedbackNps>("SELECT * FROM feedback_nps ORDER BY created_at DESC")
}

// Engagement events functions
export async function logEngagementEvent(
  userId: string,
  sessionId: string,
  eventType: string,
  payload?: any,
): Promise<EngagementEvent> {
  const result = await sql`
    INSERT INTO engagement_events (user_id, session_id, event_type, event_payload)
    VALUES (${userId}, ${sessionId}, ${eventType}, ${payload ? JSON.stringify(payload) : null})
    RETURNING *
  `
  return result.rows[0]
}

export async function getSessionEngagementEvents(sessionId: string): Promise<EngagementEvent[]> {
  return query<EngagementEvent>("SELECT * FROM engagement_events WHERE session_id = $1 ORDER BY occurred_at ASC", [
    sessionId,
  ])
}

export async function getUserEngagementEvents(userId: string): Promise<EngagementEvent[]> {
  return query<EngagementEvent>("SELECT * FROM engagement_events WHERE user_id = $1 ORDER BY occurred_at DESC", [
    userId,
  ])
}
