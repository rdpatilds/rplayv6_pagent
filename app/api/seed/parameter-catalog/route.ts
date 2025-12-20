import { NextResponse } from "next/server"
import { seedParameterCatalog } from "@/scripts/seed-parameter-catalog"

export async function POST(request: Request) {
  try {
    // Only allow in development or with admin authentication
    if (process.env.NODE_ENV !== "development") {
      // In production, we should check for admin authentication
      // This is a simplified check - in a real app, use proper auth
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Simple token check - replace with proper auth in production
      const token = authHeader.split(" ")[1]
      if (token !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const result = await seedParameterCatalog()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error seeding parameter catalog:", error)
    return NextResponse.json({ error: "Failed to seed parameter catalog" }, { status: 500 })
  }
}
