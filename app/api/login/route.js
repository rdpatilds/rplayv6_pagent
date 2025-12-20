import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSession, generateToken } from "@/lib/session-service"
import sql from "@/lib/db"

export async function POST(request) {
  console.log("✅ Login route hit");

  try {
    const { email, password } = await request.json();
    console.log("✅ Parsed login body:", { email, password });


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

    // In a real app, you would hash the password and compare it
    // For this demo, we're just checking if the passwords match
    if (user.password !== password) {
      console.log(`Invalid password for user: ${email}`)
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 })
    }

    console.log(`User authenticated: ${email}`)

    // Generate a token for the session
    const token = generateToken()

    // Create a session in the database
    await createSession({
      token,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    // Set the token in a cookie
    cookies().set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    })

    // Return the user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("💥 Login error:", error);
    console.error("💥 Login stack:", error.stack);

    return NextResponse.json({ success: false, message: "An error occurred during login" }, { status: 500 })
  }
}
