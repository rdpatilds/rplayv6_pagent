import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"

// Generate a session token
function generateToken() {
  return crypto.randomBytes(32).toString("hex")
}

export async function POST(request: Request) {
  try {
    const { name, email, password, jobRole, company } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ success: false, message: "Email already in use" }, { status: 409 })
    }

    // Create a new user with default role "learner"
    const userId = uuidv4()
    const defaultRole = "learner" // Default role for all new users

    // Handle company
    let companyId = null
    if (company && company.trim()) {
      // Check if company exists
      const existingCompanies = await sql`
        SELECT id FROM companies WHERE name = ${company} LIMIT 1
      `

      if (existingCompanies.length > 0) {
        // Use existing company
        companyId = existingCompanies[0].id
      } else {
        // Create new company
        const newCompanyId = uuidv4()
        await sql`
          INSERT INTO companies (id, name, created_at)
          VALUES (${newCompanyId}, ${company}, NOW())
        `
        companyId = newCompanyId
      }
    }

    // Create user
    await sql`
      INSERT INTO users (
        id, 
        name, 
        email, 
        password, 
        role,
        job_role,
        company_id,
        created_at
      )
      VALUES (
        ${userId}, 
        ${name}, 
        ${email}, 
        ${password}, 
        ${defaultRole},
        ${jobRole || null},
        ${companyId},
        NOW()
      )
    `

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
        ${userId}, 
        ${email}, 
        ${name}, 
        ${defaultRole}, 
        NOW(), 
        ${expiresAt}
      )
    `

    // Return the user data and token
    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      token: token,
      user: {
        id: userId,
        email: email,
        name: name,
        role: defaultRole,
        jobRole: jobRole || null,
        companyId: companyId,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: `An error occurred during registration: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
