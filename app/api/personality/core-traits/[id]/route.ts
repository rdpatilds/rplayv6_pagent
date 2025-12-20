import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    
    const result = await sql`
      UPDATE fusion_model_core_traits
      SET name = ${data.name},
          description = ${data.description},
          category = ${data.category},
          weight = ${data.weight},
          influence = ${data.influence}
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Core trait not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating core trait:", error)
    return NextResponse.json(
      { error: "Failed to update core trait" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    const result = await sql`
      DELETE FROM fusion_model_core_traits
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Core trait not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting core trait:", error)
    return NextResponse.json(
      { error: "Failed to delete core trait" },
      { status: 500 }
    )
  }
} 