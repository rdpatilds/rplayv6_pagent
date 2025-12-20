import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, key, name, description 
      FROM archetypes
      ORDER BY name ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching archetypes:', error)
    return NextResponse.json({ error: 'Failed to fetch archetypes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { key, name, description } = await request.json()
    
    const { rows } = await sql`
      INSERT INTO archetypes (key, name, description)
      VALUES (${key}, ${name}, ${description})
      RETURNING id, key, name, description
    `
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error creating archetype:', error)
    return NextResponse.json({ error: 'Failed to create archetype' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, key, name, description } = await request.json()
    
    const { rows } = await sql`
      UPDATE archetypes
      SET key = ${key},
          name = ${name},
          description = ${description}
      WHERE id = ${id}
      RETURNING id, key, name, description
    `
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Archetype not found' }, { status: 404 })
    }
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error updating archetype:', error)
    return NextResponse.json({ error: 'Failed to update archetype' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    await sql`
      DELETE FROM archetypes
      WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting archetype:', error)
    return NextResponse.json({ error: 'Failed to delete archetype' }, { status: 500 })
  }
} 