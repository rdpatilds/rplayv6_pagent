import { getDifficultyLevels } from "@/lib/difficulty-db"

export async function fetchDifficultyLevels() {
  try {
    const levels = await getDifficultyLevels()
    return { levels }
  } catch (error) {
    console.error("Error fetching difficulty levels:", error)
    throw error
  }
} 