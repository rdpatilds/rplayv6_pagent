import { NextResponse } from "next/server"
import { getParameters, createParameter } from "@/lib/parameter-db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    let parameters
    if (categoryId) {
      parameters = await getParameters(categoryId)
    } else {
      parameters = await getParameters()
    }

    return NextResponse.json(parameters)
  } catch (error) {
    console.error("Error fetching parameters:", error)
    return NextResponse.json(
      { error: "Failed to fetch parameters", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.category_id) {
      return NextResponse.json({ error: "Name and category_id are required" }, { status: 400 })
    }

    const parameter = await createParameter(data)
    return NextResponse.json(parameter)
  } catch (error) {
    console.error("Error creating parameter:", error)
    return NextResponse.json(
      { error: "Failed to create parameter", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}
