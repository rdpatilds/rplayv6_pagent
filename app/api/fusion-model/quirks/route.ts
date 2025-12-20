import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, key, name, description, impact, triggers, fusion_links, example, created_at, updated_at 
      FROM communication_quirks
      ORDER BY name ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching communication quirks:', error)
    return NextResponse.json({ error: 'Failed to fetch communication quirks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { key, name, description, impact, triggers, fusion_links, example } = await request.json()
    
    const { rows } = await sql`
      INSERT INTO communication_quirks (key, name, description, impact, triggers, fusion_links, example)
      VALUES (${key}, ${name}, ${description}, ${impact}, ${triggers}, ${fusion_links}, ${example})
      RETURNING id, key, name, description, impact, triggers, fusion_links, example, created_at, updated_at
    `
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error creating communication quirk:', error)
    return NextResponse.json({ error: 'Failed to create communication quirk' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, key, name, description, impact, triggers, fusion_links, example } = await request.json()
    
    const { rows } = await sql`
      UPDATE communication_quirks
      SET key = ${key},
          name = ${name},
          description = ${description},
          impact = ${impact},
          triggers = ${triggers},
          fusion_links = ${fusion_links},
          example = ${example},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, key, name, description, impact, triggers, fusion_links, example, created_at, updated_at
    `
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Communication quirk not found' }, { status: 404 })
    }
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error updating communication quirk:', error)
    return NextResponse.json({ error: 'Failed to update communication quirk' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    await sql`
      DELETE FROM communication_quirks
      WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting communication quirk:', error)
    return NextResponse.json({ error: 'Failed to delete communication quirk' }, { status: 500 })
  }
} 