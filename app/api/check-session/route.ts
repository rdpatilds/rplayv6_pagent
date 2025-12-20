import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Log all cookies for debugging
    const allCookies = cookies().getAll()
    console.log(
      "All cookies:",
      allCookies.map((c) => c.name),
    )

    const token = cookies().get("session_token")?.value

    if (!token) {
      console.log("No session_token cookie found")
      return NextResponse.json({ authenticated: false })
    }

    console.log("Found session_token:", token.substring(0, 10) + "...")

    // Check if the session exists and is valid
    const sessions = await sql`
      SELECT * FROM sessions 
      WHERE token = ${token} AND expires_at > NOW()
      LIMIT 1
    `

    if (sessions.length === 0) {
      console.log("No valid session found in database")
      return NextResponse.json({ authenticated: false })
    }

    const session = sessions[0]
    console.log("Valid session found for user:", session.user_email)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user_id,
        email: session.user_email,
        name: session.user_name,
        role: session.user_role,
      },
    })
  } catch (error) {
    console.error("Error checking session:", error)
    return NextResponse.json({ authenticated: false, error: "Server error" })
  }
}
