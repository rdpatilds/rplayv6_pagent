import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionByToken } from "@/lib/session-service"

export async function GET() {
  try {
    // Get the auth token from cookies
    const token = cookies().get("auth-token")?.value
    console.log(`Auth check for token: ${token ? token.substring(0, 10) + "..." : "missing"}`)

    if (!token) {
      console.log("No auth token found")
      return NextResponse.json({ authenticated: false })
    }

    // Get the session from the database
    const session = await getSessionByToken(token)

    if (!session) {
      console.log("No valid session found for token")
      return NextResponse.json({ authenticated: false })
    }

    console.log(`Valid session found for user: ${session.user_email}`)

    // Return the user data
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
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false, error: error.message })
  }
}
