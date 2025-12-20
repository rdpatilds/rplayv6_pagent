import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    // Check if the session exists and is valid
    const sessions = await sql`
      SELECT * FROM sessions 
      WHERE token = ${token} AND expires_at > NOW()
      LIMIT 1
    `

    if (sessions.length === 0) {
      return NextResponse.json({ authenticated: false })
    }

    const session = sessions[0]

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
    console.error("Error checking auth:", error)
    return NextResponse.json({ authenticated: false, error: "Server error" })
  }
}
