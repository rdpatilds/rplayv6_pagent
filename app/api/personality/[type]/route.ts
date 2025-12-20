import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type
    const table = getTableName(type)
    
    const result = await sql`
      SELECT * FROM "${table}"
      ORDER BY name ASC
    `
    
    return NextResponse.json(result)
  } catch (error) {
    console.error(`Error fetching ${params.type}:`, error)
    return NextResponse.json(
      { error: `Failed to fetch ${params.type}` },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const type = params.type
    const table = getTableName(type)
    const data = await request.json()
    
    const result = await sql`
      INSERT INTO "${table}" (name, description, data)
      VALUES (${data.name}, ${data.description}, ${JSON.stringify(data)})
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error(`Error creating ${params.type}:`, error)
    return NextResponse.json(
      { error: `Failed to create ${params.type}` },
      { status: 500 }
    )
  }
}

function getTableName(type: string): string {
  switch (type) {
    case 'mood':
      return 'fusion_model_moods'
    case 'communication-style':
      return 'fusion_model_communication_styles'
    case 'archetype':
      return 'fusion_model_archetypes'
    case 'quirk':
      return 'fusion_model_quirks'
    default:
      throw new Error(`Invalid type: ${type}`)
  }
} 