import { NextResponse } from "next/server"
import { getIndustryCompetencies } from "@/app/api/simulation/data-store"

export async function GET() {
  try {
    const industryCompetencies = getIndustryCompetencies()
    return NextResponse.json({ industryCompetencies })
  } catch (error) {
    console.error("Error fetching industry competencies:", error)
    return NextResponse.json({ error: "Failed to fetch industry competencies" }, { status: 500 })
  }
}
