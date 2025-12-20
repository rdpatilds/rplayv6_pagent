import { neon } from "@neondatabase/serverless"

// Connect to the database
const sql = neon(process.env.DATABASE_URL)

export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...")
    const result = await sql`SELECT NOW() as time`
    console.log("Database connection successful:", result)
    return { success: true, message: "Database connection successful", time: result[0].time }
  } catch (error) {
    console.error("Database connection error:", error)
    return { success: false, message: `Database connection failed: ${error.message}` }
  }
}
