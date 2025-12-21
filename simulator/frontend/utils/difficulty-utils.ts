// Function to safely handle difficulty level
export function getSafeDifficultyLevel(difficultyLevel: any): string {
  // If difficultyLevel is undefined or null, return default
  if (difficultyLevel === undefined || difficultyLevel === null) {
    return "beginner"
  }

  // If it's a string, normalize it
  if (typeof difficultyLevel === "string") {
    const normalized = difficultyLevel.toLowerCase().trim()

    // Map to valid values
    if (["beginner", "basic", "easy", "novice"].includes(normalized)) {
      return "beginner"
    } else if (["intermediate", "medium", "moderate"].includes(normalized)) {
      return "intermediate"
    } else if (["advanced", "expert", "hard", "difficult"].includes(normalized)) {
      return "advanced"
    }

    // If no match, return default
    return "beginner"
  }

  // If it's an object (like from JSON), convert to string first
  if (typeof difficultyLevel === "object") {
    try {
      const strValue = String(difficultyLevel)
      return getSafeDifficultyLevel(strValue) // Recursively process the string value
    } catch (e) {
      console.error("Error converting difficulty level to string:", e)
      return "beginner"
    }
  }

  // Default fallback
  return "beginner"
}

// Function to get display name for difficulty level
export function getDifficultyDisplayName(difficultyLevel: any): string {
  const normalized = getSafeDifficultyLevel(difficultyLevel)

  switch (normalized) {
    case "beginner":
      return "Beginner"
    case "intermediate":
      return "Intermediate"
    case "advanced":
      return "Advanced"
    default:
      return "Beginner"
  }
}
