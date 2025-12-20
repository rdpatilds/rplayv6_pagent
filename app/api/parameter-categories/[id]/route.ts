import { NextResponse } from "next/server"
import { updateParameterCategory, deleteParameterCategory } from "@/lib/parameter-db"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const data = await request.json()

    const category = await updateParameterCategory(id, data)
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error(`Error updating parameter category ${params.id}:`, error)
    return NextResponse.json(
      { error: "Failed to update parameter category", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const success = await deleteParameterCategory(id)

    if (!success) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting parameter category ${params.id}:`, error)
    return NextResponse.json(
      { error: "Failed to delete parameter category", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}
