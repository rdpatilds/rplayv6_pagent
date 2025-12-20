import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    // Get user by ID
    const users = await sql`
      SELECT id, name, email, role, job_role, created_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user: users[0] })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while fetching user" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const { firstName, lastName, email, password, role, jobRole } = await request.json()

    // Validate input
    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Check if user exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `

    if (existingUsers.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email !== existingUsers[0].email) {
      const emailCheck = await sql`
        SELECT * FROM users WHERE email = ${email} AND id != ${userId} LIMIT 1
      `

      if (emailCheck.length > 0) {
        return NextResponse.json({ success: false, message: "Email is already taken by another user" }, { status: 400 })
      }
    }

    // Update the user
    const name = `${firstName} ${lastName}`.trim()

    // If password is provided, update it too
    let updatedUser
    if (password) {
      updatedUser = await sql`
        UPDATE users
        SET 
          name = ${name},
          email = ${email},
          password = ${password},
          role = ${role},
          job_role = ${jobRole || null}
        WHERE id = ${userId}
        RETURNING id, name, email, role, job_role, created_at
      `
    } else {
      updatedUser = await sql`
        UPDATE users
        SET 
          name = ${name},
          email = ${email},
          role = ${role},
          job_role = ${jobRole || null}
        WHERE id = ${userId}
        RETURNING id, name, email, role, job_role, created_at
      `
    }

    return NextResponse.json({
      success: true,
      user: updatedUser[0],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while updating user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    // Check if user exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `

    if (existingUsers.length === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Delete the user
    await sql`
      DELETE FROM users
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while deleting user" }, { status: 500 })
  }
}
