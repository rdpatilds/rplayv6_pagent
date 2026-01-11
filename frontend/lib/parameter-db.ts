import { sql } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Types
export interface ParameterCategory {
  id: string
  name: string
  key: string
  parameter_type: string
  description?: string
  sort_order?: number
  created_at?: string
}

export interface Parameter {
  id: string
  name: string
  description?: string
  type?: string
  range?: string
  examples?: string
  global?: boolean
  category_id?: string
  category_key?: string
  applicable_industries?: any
  created_at?: string
  updated_at?: string
  sort_order?: number 
}

// Cache for table existence to avoid repeated checks
const tableExistsCache: Record<string, boolean> = {}

// Function to create parameter_categories table if it doesn't exist
async function createParameterCategoriesTableIfNotExists() {
  try {
    // Try to create the table directly and catch the error if it already exists
    await sql`
      CREATE TABLE IF NOT EXISTS parameter_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        parameter_type TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log("Parameter categories table check completed")
    return true
  } catch (error) {
    console.error("Error with parameter_categories table:", error)
    throw error
  }
}

// Function to create parameters table if it doesn't exist
async function createParametersTableIfNotExists() {
  try {
    // Try to create the table directly and catch the error if it already exists
    await sql`
      CREATE TABLE IF NOT EXISTS parameters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        type TEXT,
        range TEXT,
        examples TEXT,
        global BOOLEAN DEFAULT false,
        category_id UUID REFERENCES parameter_categories(id),
        category_key TEXT,
        applicable_industries JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log("Parameters table check completed")
    return true
  } catch (error) {
    console.error("Error with parameters table:", error)
    throw error
  }
}

// Function to ensure tables exist with retry logic
async function ensureTablesExist() {
  const maxRetries = 3
  let retries = 0
  let lastError: Error | null = null

  while (retries < maxRetries) {
    try {
      // First check if we can connect to the database at all
      await sql`SELECT 1`

      // Then try to create tables if needed
      await createParameterCategoriesTableIfNotExists()
      await createParametersTableIfNotExists()
      return true
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Database operation failed (attempt ${retries + 1}/${maxRetries}):`, lastError)

      // If we're getting a rate limit error, wait longer between retries
      if (
        lastError.message &&
        (lastError.message.includes("Too Many") || 
         lastError.message.includes("rate limit") || 
         lastError.message.includes("429"))
      ) {
        console.log("Rate limit detected, waiting longer before retry...")
        await new Promise((resolve) => setTimeout(resolve, 2000 * (retries + 1)))
      } else {
        // For other errors, wait a shorter time
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      retries++
    }
  }

  console.error("Failed to ensure tables exist after multiple retries:", lastError)
  throw new Error("Database operation failed after multiple retries. Please try again later.")
}

// Update the getParameterCategories function to handle the case where tables don't exist
export async function getParameterCategories() {
  try {
    // Try to ensure tables exist
    try {
      await ensureTablesExist()
    } catch (error) {
      console.error("Error ensuring tables exist:", error)
      // Return empty array instead of throwing if we can't create tables
      return []
    }

    const categories = await sql`
      SELECT * FROM parameter_categories
      ORDER BY sort_order ASC NULLS LAST, name ASC;
    `
    return categories
  } catch (error) {
    console.error("Error getting parameter categories:", error)
    // Return empty array instead of throwing
    return []
  }
}

// Update the getParameterCategoriesByType function similarly
export async function getParameterCategoriesByType(type: string) {
  try {
    // Try to ensure tables exist
    try {
      await ensureTablesExist()
    } catch (error) {
      console.error("Error ensuring tables exist:", error)
      // Return empty array instead of throwing if we can't create tables
      return []
    }

    const categories = await sql`
      SELECT * FROM parameter_categories
      WHERE parameter_type = ${type}
      ORDER BY sort_order ASC NULLS LAST, name ASC;
    `
    return categories
  } catch (error) {
    console.error(`Error getting parameter categories by type ${type}:`, error)
    // Return empty array instead of throwing
    return []
  }
}

// Create a new parameter category
export async function createParameterCategory(data: {
  name: string
  key: string
  parameter_type: string
  description?: string
  sort_order?: number
}) {
  try {
    // Ensure tables exist
    await ensureTablesExist()

    const { name, key, parameter_type, description, sort_order } = data

    const result = await sql`
      INSERT INTO parameter_categories (name, key, parameter_type, description, sort_order)
      VALUES (${name}, ${key}, ${parameter_type}, ${description || null}, ${sort_order ?? null})
      RETURNING *;
    `

    return result[0]
  } catch (error) {
    console.error("Error creating parameter category:", error)
    throw error
  }
}

// Update a parameter category
export async function updateParameterCategory(id: string, data: Partial<ParameterCategory>) {
  try {
    const updates = []

    if (data.name !== undefined) {
      updates.push(`name = ${data.name}`)
    }

    if (data.key !== undefined) {
      updates.push(`key = ${data.key}`)
    }

    if (data.parameter_type !== undefined) {
      updates.push(`parameter_type = ${data.parameter_type}`)
    }
    if (data.description !== undefined) {
      updates.push(`description = ${data.description}`)
    }
    
    if (data.sort_order !== undefined) {
      updates.push(`sort_order = ${data.sort_order}`)
    }
    
    if (updates.length === 0) {
      return null
    }

    const setClause = updates.join(", ")

    const result = await sql`
      UPDATE parameter_categories
      SET ${sql.unsafe(setClause)}
      WHERE id = ${id}
      RETURNING *;
    `

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error(`Error updating parameter category ${id}:`, error)
    throw error
  }
}

// Delete a parameter category
export async function deleteParameterCategory(id: string) {
  try {
    // First delete all parameters in this category
    await sql`
      DELETE FROM parameters
      WHERE category_id = ${id};
    `

    // Then delete the category
    const result = await sql`
      DELETE FROM parameter_categories
      WHERE id = ${id}
      RETURNING id;
    `

    return result.length > 0
  } catch (error) {
    console.error(`Error deleting parameter category ${id}:`, error)
    throw error
  }
}

// Get all parameters
export async function getParameters(categoryId?: string) {
  try {
    // Ensure tables exist
    await ensureTablesExist()

    let parameters

    if (categoryId) {
      parameters = await sql`
        SELECT * FROM parameters
        WHERE category_id = ${categoryId}
        ORDER BY sort_order ASC NULLS LAST, name ASC;
      `
    } else {
      parameters = await sql`
        SELECT * FROM parameters
        ORDER BY sort_order ASC NULLS LAST, name ASC;
      `
    }

    return parameters
  } catch (error) {
    console.error("Error getting parameters:", error)
    throw error
  }
}

// Create a new parameter
export async function createParameter(data: {
  name: string
  description?: string
  type?: string
  range?: string
  examples?: string
  global?: boolean
  category_id?: string
  category_key?: string
  applicable_industries?: any
  sort_order?: number  
}) {
  try {
    // Ensure tables exist
    await ensureTablesExist()

    const { name, description, type, range, examples, global, category_id, category_key, applicable_industries, sort_order } = data

    const result = await sql`
      INSERT INTO parameters (
        name, description, type, range, examples, global, 
        category_id, category_key, applicable_industries, sort_order
      )
      VALUES (
        ${name}, 
        ${description || null}, 
        ${type || null}, 
        ${range || null}, 
        ${examples || null}, 
        ${global !== undefined ? global : false}, 
        ${category_id || null}, 
        ${category_key || null}, 
        ${applicable_industries ? JSON.stringify(applicable_industries) : null},
        ${sort_order ?? null}
      )
      RETURNING *;
    `

    return result[0]
  } catch (error) {
    console.error("Error creating parameter:", error)
    throw error
  }
}

// Update a parameter
export async function updateParameter(id: string, data: Partial<Parameter>) {
  try {
    const updates = []

    if (data.name !== undefined) {
      updates.push(`name = ${data.name}`)
    }

    if (data.description !== undefined) {
      updates.push(`description = ${data.description}`)
    }

    if (data.type !== undefined) {
      updates.push(`type = ${data.type}`)
    }

    if (data.range !== undefined) {
      updates.push(`range = ${data.range}`)
    }

    if (data.examples !== undefined) {
      updates.push(`examples = ${data.examples}`)
    }

    if (data.global !== undefined) {
      updates.push(`global = ${data.global}`)
    }

    if (data.category_id !== undefined) {
      updates.push(`category_id = ${data.category_id}`)
    }

    if (data.category_key !== undefined) {
      updates.push(`category_key = ${data.category_key}`)
    }

    if (data.applicable_industries !== undefined) {
      updates.push(`applicable_industries = ${JSON.stringify(data.applicable_industries)}`)
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`)

    if (updates.length === 0) {
      return null
    }

    const setClause = updates.join(", ")

    const result = await sql`
      UPDATE parameters
      SET ${sql.unsafe(setClause)}
      WHERE id = ${id}
      RETURNING *;
    `

    if (result.length === 0) {
      return null
    }

    return result[0]
  } catch (error) {
    console.error(`Error updating parameter ${id}:`, error)
    throw error
  }
}

// Delete a parameter
export async function deleteParameter(id: string) {
  try {
    const result = await sql`
      DELETE FROM parameters
      WHERE id = ${id}
      RETURNING id;
    `

    return result.length > 0
  } catch (error) {
    console.error(`Error deleting parameter ${id}:`, error)
    throw error
  }
}

// Seed the parameter catalog with default values
export async function seedParameterCatalog() {
  console.log("🌱 Seeding parameter catalog...")

  await sql`BEGIN`

  try {
    // Clear existing data
    await sql`DELETE FROM parameters`
    await sql`DELETE FROM parameter_categories`

    const now = new Date()

    // --- Category Setup ---
    const categories = [
      { name: "Age Groups", key: "age-groups", parameter_type: "structured" },
      { name: "Income Ranges", key: "income-ranges", parameter_type: "structured" },
      { name: "Debt Levels", key: "debt-levels", parameter_type: "structured" },
      { name: "Credit Scores", key: "credit-scores", parameter_type: "structured" },
      { name: "Education Levels", key: "education-levels", parameter_type: "structured" },
      { name: "Industry Guardrails", key: "industry-guardrails", parameter_type: "guardrail" },
    ]

    const categoryMap: Record<string, string> = {}

    for (const cat of categories) {
      const id = uuidv4()
      categoryMap[cat.key] = id

      await sql`
        INSERT INTO parameter_categories (id, name, key, parameter_type, created_at)
        VALUES (${id}, ${cat.name}, ${cat.key}, ${cat.parameter_type}, ${now})
      `
    }

    // --- Structured Parameters ---
    const structuredParams = [
      // Age Groups
      { name: "Young Adults", range: "18-24", category_key: "age-groups" },
      { name: "Early Career", range: "25-34", category_key: "age-groups" },
      { name: "Mid Career", range: "35-44", category_key: "age-groups" },
      { name: "Late Career", range: "45-54", category_key: "age-groups" },
      { name: "Pre-Retirement", range: "55-64", category_key: "age-groups" },
      { name: "Retirees", range: "65+", category_key: "age-groups" },

      // Income Ranges
      { name: "Low Income", range: "$0-$40,000", category_key: "income-ranges" },
      { name: "Moderate Income", range: "$40,001-$85,000", category_key: "income-ranges" },
      { name: "High Income", range: "$85,001-$200,000", category_key: "income-ranges" },
      { name: "Very High Income", range: "$200,001+", category_key: "income-ranges" },

      // Debt Levels
      { name: "No Debt", range: "$0-$1,000", category_key: "debt-levels" },
      { name: "Low Debt", range: "$1,001-$25,000", category_key: "debt-levels" },
      { name: "Moderate Debt", range: "$25,001-$100,000", category_key: "debt-levels" },
      { name: "High Debt", range: "$100,001-$300,000", category_key: "debt-levels" },
      { name: "Very High Debt", range: "$300,001+", category_key: "debt-levels" },

      // Credit Score
      { name: "Poor", range: "300-579", category_key: "credit-scores" },
      { name: "Fair", range: "580-669", category_key: "credit-scores" },
      { name: "Good", range: "670-739", category_key: "credit-scores" },
      { name: "Very Good", range: "740-799", category_key: "credit-scores" },
      { name: "Excellent", range: "800-850", category_key: "credit-scores" },

      // Education Level
      {
        name: "High School or GED",
        description: "Completed secondary education or equivalent",
        category_key: "education-levels",
      },
      {
        name: "Some College",
        description: "Attended post-secondary education without completing a degree",
        category_key: "education-levels",
      },
      {
        name: "Associates Degree",
        description: "Completed a two-year degree program",
        category_key: "education-levels",
      },
      {
        name: "Bachelor's Degree",
        description: "Completed a four-year undergraduate degree",
        category_key: "education-levels",
      },
      {
        name: "Master's Degree",
        description: "Completed a graduate-level master's program",
        category_key: "education-levels",
      },
      {
        name: "Professional Degree",
        description: "Completed specialized professional education (JD, MD, etc.)",
        category_key: "education-levels",
      },
      {
        name: "Doctoral Degree",
        description: "Completed a doctoral program (PhD, EdD, etc.)",
        category_key: "education-levels",
      },
      {
        name: "Trade/Vocational Training",
        description: "Completed specialized vocational or technical training",
        category_key: "education-levels",
      },
      {
        name: "No Formal Degree",
        description: "Did not complete high school or formal educational program",
        category_key: "education-levels",
      },
    ]

    for (const param of structuredParams) {
      await sql`
        INSERT INTO parameters (name, description, type, category_id, category_key, range, global, created_at, updated_at)
        VALUES (
          ${param.name},
          ${param.description || null},
          'structured',
          ${categoryMap[param.category_key]},
          ${param.category_key},
          ${param.range || null},
          ${true},
          ${now},
          ${now}
        )
      `
    }

    // --- Guardrail Parameters ---
    const guardrailParams = [
      {
        name: "Basic terminology understanding",
        description:
          "Defines the scope of knowledge the simulated client should demonstrate about industry-specific concepts",
        examples: `Client can discuss terms like 'mutual fund', 'premium', or 'interest rate' but won't use highly technical jargon.`,
      },
      {
        name: "Awareness of common products",
        description: "Client should show familiarity with common financial products relevant to their situation",
        examples: `Client might mention 401(k), life insurance, or mortgage products in general terms but won't discuss complex product features.`,
      },
      {
        name: "Limited technical knowledge",
        description: "Client should have limited technical understanding of financial concepts",
        examples: `Client might express confusion about concepts like 'tax-loss harvesting' or 'options trading strategies'.`,
      },
      {
        name: "No specific product recommendations",
        description: "Client should not ask for or expect specific product recommendations",
        examples: `Client might say 'I'm looking for general advice' rather than 'Should I buy XYZ fund?'`,
      },
      {
        name: "Limited tax advice",
        description: "Client should not expect detailed tax advice or tax planning strategies",
        examples: `Client might express general concern about taxes but won't ask for specific tax avoidance strategies.`,
      },
      {
        name: "No technical regulatory knowledge",
        description: "Client should not demonstrate detailed knowledge of specific regulations or regulatory bodies",
        examples: `Client won't reference specific SEC rules or FINRA regulations by number or technical name.`,
      },
    ]

    for (const param of guardrailParams) {
      await sql`
        INSERT INTO parameters (name, description, type, category_id, category_key, examples, global, created_at, updated_at)
        VALUES (
          ${param.name},
          ${param.description},
          'guardrail',
          ${categoryMap["industry-guardrails"]},
          'industry-guardrails',
          ${param.examples},
          ${true},
          ${now},
          ${now}
        )
      `
    }

    await sql`COMMIT`
    console.log("✅ Parameter catalog seeded successfully")
    return { success: true, message: "Parameter catalog seeded successfully" }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("❌ Failed to seed parameter catalog:", error)
    throw error
  }
}

// Delete all parameter categories and parameters and reset to defaults
export async function resetParameterCatalog() {
  try {
    // Seed with default values (this function already handles clearing existing data)
    const result = await seedParameterCatalog()
    return result
  } catch (error) {
    console.error("Error resetting parameter catalog:", error)
    throw error
  }
}

export default {
  getParameterCategories,
  getParameterCategoriesByType,
  createParameterCategory,
  updateParameterCategory,
  deleteParameterCategory,
  getParameters,
  createParameter,
  updateParameter,
  deleteParameter,
  resetParameterCatalog,
  seedParameterCatalog,
}
