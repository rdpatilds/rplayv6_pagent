import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    const token = cookies().get("session_token")?.value

    if (token) {
      // Delete the session from the database
      await sql`DELETE FROM sessions WHERE token = ${token}`

      // Clear the cookie
      cookies().delete("session_token")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during logout" })
  }
}
