import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    // Get all users
    const users = await sql`
      SELECT id, name, email, role, job_role, created_at
      FROM users
      ORDER BY created_at DESC
    `

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, message: "An error occurred while fetching users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, role, jobRole } = await request.json()

    // Validate input
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Check if email already exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ success: false, message: "Email already exists" }, { status: 400 })
    }

    // Create the user
    const name = `${firstName} ${lastName}`.trim()

    const newUser = await sql`
      INSERT INTO users (name, email, password, role, job_role, created_at)
      VALUES (${name}, ${email}, ${password}, ${role}, ${jobRole || null}, NOW())
      RETURNING id, name, email, role, job_role, created_at
    `

    return NextResponse.json({
      success: true,
      user: newUser[0],
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while creating user" }, { status: 500 })
  }
}
