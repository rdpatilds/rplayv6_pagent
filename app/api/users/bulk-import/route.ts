import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { parse } from "csv-parse/sync"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const importMethod = formData.get("importMethod") as string

    let users = []

    if (importMethod === "csv") {
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 })
      }

      // Read the file content
      const fileContent = await file.text()

      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })

      users = records.map((record) => ({
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        password: record.password,
        role: record.role || "learner", // Default to learner if not specified
        jobRole: record.jobRole || null,
        company: record.company || null,
      }))
    } else if (importMethod === "json") {
      const jsonData = formData.get("jsonData") as string

      if (!jsonData) {
        return NextResponse.json({ success: false, message: "No JSON data provided" }, { status: 400 })
      }

      const parsedUsers = JSON.parse(jsonData)

      // Ensure default values
      users = parsedUsers.map((user) => ({
        ...user,
        role: user.role || "learner",
        jobRole: user.jobRole || null,
        company: user.company || null,
      }))
    } else {
      return NextResponse.json({ success: false, message: "Invalid import method" }, { status: 400 })
    }

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
      const { firstName, lastName, email, password, role, jobRole, company } = user

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        results.failed++
        results.errors.push(`User ${email || "unknown"}: Missing required fields`)
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        results.failed++
        results.errors.push(`User ${email}: Invalid email format`)
        continue
      }

      // Validate role
      const validRoles = ["super_admin", "company_admin", "trainer", "learner"]
      const userRole = role.toLowerCase()
      if (!validRoles.includes(userRole)) {
        results.failed++
        results.errors.push(`User ${email}: Invalid role. Must be one of: ${validRoles.join(", ")}`)
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

        // Handle company if provided
        let companyId = null
        if (company) {
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

        // Create the user
        const name = `${firstName} ${lastName}`.trim()
        const userId = uuidv4()

        await sql`
          INSERT INTO users (id, name, email, password, role, job_role, company_id, created_at)
          VALUES (${userId}, ${name}, ${email}, ${password}, ${userRole}, ${jobRole}, ${companyId}, NOW())
        `

        results.success++
      } catch (error) {
        console.error(`Error creating user ${email}:`, error)
        results.failed++
        results.errors.push(`User ${email}: Database error - ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error bulk importing users:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing users",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
