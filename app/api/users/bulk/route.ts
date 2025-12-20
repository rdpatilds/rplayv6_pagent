import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { users } = await request.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ success: false, message: "No users provided or invalid format" }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const user of users) {
      const { firstName, lastName, email, password, role, jobRole } = user

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !role) {
        results.failed++
        results.errors.push(`User ${email}: Missing required fields`)
        continue
      }

      try {
        // Check if email already exists
        const existingUsers = await sql`
          SELECT * FROM users WHERE email = ${email} LIMIT 1
        `

        if (existingUsers.length > 0) {
          results.failed++
          results.errors.push(`User ${email}: Email already exists`)
          continue
        }

        // Create the user
        const name = `${firstName} ${lastName}`.trim()

        await sql`
          INSERT INTO users (name, email, password, role, job_role, created_at)
          VALUES (${name}, ${email}, ${password}, ${role}, ${jobRole || null}, NOW())
        `

        results.success++
      } catch (error) {
        console.error(`Error creating user ${email}:`, error)
        results.failed++
        results.errors.push(`User ${email}: Database error`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error bulk creating users:", error)
    return NextResponse.json({ success: false, message: "An error occurred while processing users" }, { status: 500 })
  }
}
