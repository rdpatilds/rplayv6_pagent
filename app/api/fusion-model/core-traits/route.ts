import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, key, name, description 
      FROM personality_traits
      ORDER BY name ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching personality traits:', error)
    return NextResponse.json({ error: 'Failed to fetch personality traits' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { key, name, description } = await request.json()
    
    const { rows } = await sql`
      INSERT INTO personality_traits (key, name, description)
      VALUES (${key}, ${name}, ${description})
      RETURNING id, key, name, description
    `
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error creating personality trait:', error)
    return NextResponse.json({ error: 'Failed to create personality trait' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, key, name, description } = await request.json()
    
    const { rows } = await sql`
      UPDATE personality_traits
      SET key = ${key},
          name = ${name},
          description = ${description}
      WHERE id = ${id}
      RETURNING id, key, name, description
    `
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Personality trait not found' }, { status: 404 })
    }
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error updating personality trait:', error)
    return NextResponse.json({ error: 'Failed to update personality trait' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    await sql`
      DELETE FROM personality_traits
      WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting personality trait:', error)
    return NextResponse.json({ error: 'Failed to delete personality trait' }, { status: 500 })
  }
} 