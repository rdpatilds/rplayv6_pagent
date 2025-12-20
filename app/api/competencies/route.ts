import { NextResponse } from "next/server"
import { getCompetencies } from "@/app/api/simulation/data-store"

export async function GET() {
  try {
    const competencies = getCompetencies()
    return NextResponse.json({ competencies })
  } catch (error) {
    console.error("Error fetching competencies:", error)
    return NextResponse.json({ error: "Failed to fetch competencies" }, { status: 500 })
  }
}
