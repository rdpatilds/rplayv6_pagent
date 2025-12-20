import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM fusion_model_core_traits
      ORDER BY category, name ASC
    `
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching core traits:", error)
    return NextResponse.json(
      { error: "Failed to fetch core traits" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const result = await sql`
      INSERT INTO fusion_model_core_traits (name, description, category, weight, influence)
      VALUES (${data.name}, ${data.description}, ${data.category}, ${data.weight}, ${data.influence})
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating core trait:", error)
    return NextResponse.json(
      { error: "Failed to create core trait" },
      { status: 500 }
    )
  }
} 