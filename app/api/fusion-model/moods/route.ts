import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, key, label, description 
      FROM moods
      ORDER BY label ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error fetching moods:', error)
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { key, label, description } = await request.json()
    
    const { rows } = await sql`
      INSERT INTO moods (key, label, description)
      VALUES (${key}, ${label}, ${description})
      RETURNING id, key, label, description
    `
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error creating mood:', error)
    return NextResponse.json({ error: 'Failed to create mood' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, key, label, description } = await request.json()
    
    const { rows } = await sql`
      UPDATE moods
      SET key = ${key},
          label = ${label},
          description = ${description}
      WHERE id = ${id}
      RETURNING id, key, label, description
    `
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Mood not found' }, { status: 404 })
    }
    
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('Error updating mood:', error)
    return NextResponse.json({ error: 'Failed to update mood' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    
    await sql`
      DELETE FROM moods
      WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mood:', error)
    return NextResponse.json({ error: 'Failed to delete mood' }, { status: 500 })
  }
} 