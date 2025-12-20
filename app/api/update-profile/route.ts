import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { userId, firstName, lastName, email, jobRole } = await request.json()

    // Validate input
    if (!userId || !email) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Check if the user exists
    const users = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== users[0].email) {
      const existingUsers = await sql`
        SELECT * FROM users WHERE email = ${email} AND id != ${userId} LIMIT 1
      `

      if (existingUsers.length > 0) {
        return NextResponse.json({ success: false, message: "Email is already taken" }, { status: 400 })
      }
    }

    // Update the user profile
    const name = `${firstName} ${lastName}`.trim()

    await sql`
      UPDATE users
      SET 
        name = ${name},
        email = ${email},
        job_role = ${jobRole || null}
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        job_role: jobRole,
      },
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ success: false, message: "An error occurred while updating profile" }, { status: 500 })
  }
}
