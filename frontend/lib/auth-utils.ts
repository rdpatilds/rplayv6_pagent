import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import crypto from "crypto"
import { sql } from "@/lib/db"

// Generate a session token
export function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

// Get current session
export async function getSession() {
  const token = cookies().get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const sessions = await sql`
      SELECT * FROM sessions 
      WHERE token = ${token} AND expires_at > NOW()
      LIMIT 1
    `

    if (sessions.length === 0) {
      // Session expired or not found
      cookies().delete("auth-token")
      return null
    }

    const session = sessions[0]

    return {
      user: {
        id: session.user_id,
        email: session.user_email,
        name: session.user_name,
        role: session.user_role,
      },
    }
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

// Check if user is authenticated
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

// Check if user has required role
export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard")
  }

  return session
}

// Logout function
export async function logout() {
  const token = cookies().get("auth-token")?.value

  if (token) {
    try {
      await sql`DELETE FROM sessions WHERE token = ${token}`
    } catch (error) {
      console.error("Error deleting session:", error)
    }

    cookies().delete("auth-token")
  }

  redirect("/login")
}
