import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params
    const table = getTableName(type)
    const data = await request.json()
    
    const result = await sql`
      UPDATE "${table}"
      SET name = ${data.name},
          description = ${data.description},
          data = ${JSON.stringify(data)}
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: `${type} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error(`Error updating ${params.type}:`, error)
    return NextResponse.json(
      { error: `Failed to update ${params.type}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params
    const table = getTableName(type)
    
    const result = await sql`
      DELETE FROM "${table}"
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: `${type} not found` },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting ${params.type}:`, error)
    return NextResponse.json(
      { error: `Failed to delete ${params.type}` },
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