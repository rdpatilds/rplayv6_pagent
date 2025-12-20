import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import crypto from "crypto"

// Generate a session token
function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    console.log(`Login attempt for: ${email}`)

    // Query the database for the user
    const users = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `

    if (users.length === 0) {
      console.log(`User not found: ${email}`)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]

    // In a real app, you would hash and compare the password
    // For this demo, we're just checking if the passwords match
    if (user.password !== password) {
      console.log(`Invalid password for user: ${email}`)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    console.log(`User authenticated: ${email}`)

    // Generate a token for the session
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 1) // 1 day from now

    // Create a session in the database
    await sql`
      INSERT INTO sessions (
        token, 
        user_id, 
        user_email, 
        user_name, 
        user_role, 
        created_at, 
        expires_at
      )
      VALUES (
        ${token}, 
        ${user.id}, 
        ${user.email}, 
        ${user.name}, 
        ${user.role}, 
        NOW(), 
        ${expiresAt}
      )
    `

    // Return the user data and token
    // We'll store this in localStorage on the client
    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        jobRole: user.job_role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during login" }, { status: 500 })
  }
}
