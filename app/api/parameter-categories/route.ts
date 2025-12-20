import { NextResponse } from "next/server"
import { getParameterCategories, getParameterCategoriesByType, createParameterCategory } from "@/lib/parameter-db"

// Update the GET function to handle errors more gracefully
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    let categories = []
    try {
      if (type) {
        categories = await getParameterCategoriesByType(type)
      } else {
        categories = await getParameterCategories()
      }
    } catch (error) {
      console.error("Database error:", error)
      // Return empty array with a 200 status instead of an error
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error in parameter categories API:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.parameter_type) {
      return NextResponse.json({ error: "Name and parameter_type are required" }, { status: 400 })
    }

    // Generate key if not provided
    if (!data.key) {
      data.key = data.name.toLowerCase().replace(/\s+/g, "-")
    }

    const category = await createParameterCategory(data)
    return NextResponse.json(category)
  } catch (error) {
    console.error("Error creating parameter category:", error)
    return NextResponse.json(
      { error: "Failed to create parameter category", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}
