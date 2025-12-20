import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, key, label, description, example 
      FROM communication_styles
      ORDER BY label ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching communication styles:', error)
    return NextResponse.json({ error: 'Failed to fetch communication styles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { key, label, description, example } = await request.json()
    
    const { rows } = await sql`
      INSERT INTO communication_styles (key, label, description, example)
      VALUES (${key}, ${label}, ${description}, ${example})
      RETURNING id, key, label, description, example
    `
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error creating communication style:', error)
    return NextResponse.json({ error: 'Failed to create communication style' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, key, label, description, example } = await request.json()
    
    const { rows } = await sql`
      UPDATE communication_styles
      SET key = ${key},
          label = ${label},
          description = ${description},
          example = ${example}
      WHERE id = ${id}
      RETURNING id, key, label, description, example
    `
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Communication style not found' }, { status: 404 })
    }
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error updating communication style:', error)
    return NextResponse.json({ error: 'Failed to update communication style' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    await sql`
      DELETE FROM communication_styles
      WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting communication style:', error)
    return NextResponse.json({ error: 'Failed to delete communication style' }, { status: 500 })
  }
} 