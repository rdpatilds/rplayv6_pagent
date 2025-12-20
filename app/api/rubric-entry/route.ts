import { NextRequest, NextResponse } from "next/server"
import { saveRubricEntry } from "@/lib/rubric-db"
import type { RubricEntry } from "@/types/rubric"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RubricEntry

    const result = await saveRubricEntry(body)

    return result.success
      ? NextResponse.json({ success: true })
      : NextResponse.json({ success: false }, { status: 500 })
  } catch (err) {
    console.error("Error saving rubric entry:", err)
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 500 })
  }
}
