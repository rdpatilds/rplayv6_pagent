import { neon } from "@neondatabase/serverless"

// 🔥 Debug: Check if the env variable is being loaded
console.log("🔥 DATABASE_URL:", process.env.DATABASE_URL);

// Create a SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Get all users
export async function getUsers() {
  try {
    const users = await sql`
      SELECT * FROM users
      ORDER BY role, name
    `
    return users
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

// Get all parameters
export async function getParameters() {
  try {
    const parameters = await sql`
      SELECT p.*, pc.name as category_name
      FROM parameters p
      LEFT JOIN parameter_categories pc ON p.category_id = pc.id
      ORDER BY pc.name, p.name
    `
    return parameters
  } catch (error) {
    console.error("Error fetching parameters:", error)
    return []
  }
}

// Get all parameter categories
export async function getParameterCategories() {
  try {
    const categories = await sql`
      SELECT * FROM parameter_categories
      ORDER BY name
    `
    return categories
  } catch (error) {
    console.error("Error fetching parameter categories:", error)
    return []
  }
}
