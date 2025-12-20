import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json()

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Check if the user exists and password matches
    const users = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Check if current password matches
    // In a real app, you would use bcrypt to compare hashed passwords
    if (user.password !== currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
          field: "currentPassword",
        },
        { status: 400 },
      )
    }

    // Update the password
    await sql`
      UPDATE users
      SET password = ${newPassword}
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ success: false, message: "An error occurred while changing password" }, { status: 500 })
  }
}
