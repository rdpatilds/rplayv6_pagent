import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/db-test"

export async function GET() {
  try {
    const result = await testDatabaseConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing database:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
