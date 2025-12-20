import sql from "./db"
import crypto from "crypto"

// Generate a random token
export function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

// Generate a valid UUID v4
export function generateUUID() {
  return crypto.randomUUID()
}

// Check if a string is a valid UUID
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Convert any ID to a valid UUID
function ensureValidUUID(id) {
  if (isValidUUID(id)) {
    return id
  }

  // For simple numeric IDs, generate a deterministic UUID based on the ID
  // This ensures the same ID always maps to the same UUID
  const namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8" // A fixed namespace UUID
  const hash = crypto.createHash("sha1")
  hash.update(namespace)
  hash.update(String(id))
  const uuid = hash.digest("hex")

  // Format as UUID
  return `${uuid.substr(0, 8)}-${uuid.substr(8, 4)}-${uuid.substr(12, 4)}-${uuid.substr(16, 4)}-${uuid.substr(20, 12)}`
}

// Create a session in the database
export async function createSession({ token, id, email, name, role }) {
  try {
    console.log(`Creating session for user: ${email}, role: ${role}, id: ${id}`)

    // Set expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Convert user ID to a valid UUID if it's not already
    const userId = ensureValidUUID(id)
    console.log(`Converted user ID: ${id} to UUID: ${userId}`)

    // Insert the session into the database
    await sql`
      INSERT INTO sessions (token, user_id, user_email, user_name, user_role, expires_at)
      VALUES (${token}, ${userId}, ${email}, ${name || ""}, ${role}, ${expiresAt})
    `

    console.log(`Session created with token: ${token}`)
    return token
  } catch (error) {
    console.error("Error creating session:", error)
    throw error
  }
}

// Get a session by token
export async function getSessionByToken(token) {
  try {
    console.log(`Getting session for token: ${token}`)

    // Get the session from the database
    const sessions = await sql`
      SELECT * FROM sessions
      WHERE token = ${token}
      AND expires_at > NOW()
    `

    if (sessions.length === 0) {
      console.log("No session found for token")
      return null
    }

    console.log(`Session found: ${JSON.stringify(sessions[0])}`)
    return sessions[0]
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

// Verify a session by token (alias for getSessionByToken for compatibility)
export async function verifySession(token) {
  return getSessionByToken(token)
}

// Delete a session by token
export async function deleteSessionByToken(token) {
  try {
    console.log(`Deleting session for token: ${token}`)

    // Delete the session from the database
    await sql`
      DELETE FROM sessions
      WHERE token = ${token}
    `

    console.log("Session deleted")
    return true
  } catch (error) {
    console.error("Error deleting session:", error)
    return false
  }
}

// Delete expired sessions
export async function deleteExpiredSessions() {
  try {
    console.log("Deleting expired sessions")

    // Delete expired sessions from the database
    const result = await sql`
      DELETE FROM sessions
      WHERE expires_at < NOW()
    `

    console.log(`Deleted ${result.count} expired sessions`)
    return result.count
  } catch (error) {
    console.error("Error deleting expired sessions:", error)
    return 0
  }
}
