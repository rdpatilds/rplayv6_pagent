import { NextResponse } from "next/server"
import { resetParameterCatalog } from "@/lib/parameter-db"

export async function POST() {
  try {
    const result = await resetParameterCatalog()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error resetting parameter catalog:", error)
    return NextResponse.json(
      { error: "Failed to reset parameter catalog", details: error.message || "Unknown error" },
      { status: 500 },
    )
  }
}
