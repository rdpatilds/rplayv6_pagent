import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params
    const data = await request.json()

    // Update the parameter
    const result = await sql`
      UPDATE parameters
      SET 
        name = ${data.name},
        description = ${data.description},
        range = ${data.range},
        examples = ${data.examples},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Parameter not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error(`Error updating parameter ${context.params.id}:`, error)
    return NextResponse.json(
      { 
        error: "Failed to update parameter", 
        details: error?.message || "Unknown error" 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params

    // Delete the parameter
    const result = await sql`
      DELETE FROM parameters
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Parameter not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error(`Error deleting parameter ${context.params.id}:`, error)
    return NextResponse.json(
      { 
        error: "Failed to delete parameter", 
        details: error?.message || "Unknown error" 
      },
      { status: 500 }
    )
  }
}
