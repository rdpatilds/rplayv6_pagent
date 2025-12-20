const { neon } = require("@neondatabase/serverless")
const fs = require("fs")

// Load environment variables manually
const envContent = fs.readFileSync(".env", "utf-8")
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    process.env[match[1]] = match[2]
  }
})

const sql = neon(process.env.DATABASE_URL)

async function testConnection() {
  try {
    console.log("Testing database connection...")
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)

    // Try to query the database
    const result = await sql`SELECT NOW() as current_time`
    console.log("✅ Database connection successful!")
    console.log("Current time from database:", result[0].current_time)

    // Try to query users table
    console.log("\nChecking users table...")
    const users = await sql`SELECT id, email, name, role FROM users LIMIT 5`
    console.log(`Found ${users.length} users:`)
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`)
    })

    // Try to query sessions table structure
    console.log("\nChecking sessions table structure...")
    const sessionCheck = await sql`SELECT column_name, data_type
                                    FROM information_schema.columns
                                    WHERE table_name = 'sessions'`
    console.log("Sessions table columns:")
    sessionCheck.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

  } catch (error) {
    console.error("❌ Database connection failed!")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)
  }
}

testConnection()
