import { NextResponse } from "next/server"
import { deleteExpiredSessions } from "@/lib/session-service"

export async function GET() {
  try {
    const result = await deleteExpiredSessions()
    return NextResponse.json({ success: true, message: "Expired sessions cleaned up" })
  } catch (error) {
    console.error("Session cleanup error:", error)
    return NextResponse.json({ success: false, message: "Failed to clean up sessions" }, { status: 500 })
  }
}
