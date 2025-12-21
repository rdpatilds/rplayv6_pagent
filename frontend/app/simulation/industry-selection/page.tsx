import IndustrySelectionClient from "./client"

interface DifficultyLevel {
  key: string;
  label: string;
  description: string;
}

// This is now a server component
export default function IndustrySelection() {
  // Hardcoded difficulty levels
  const difficultyLevels: DifficultyLevel[] = [
    {
      key: "beginner",
      label: "Beginner",
      description: "Friendly and cooperative client, ideal for learning basic conversation flow"
    },
    {
      key: "intermediate",
      label: "Intermediate",
      description: "More reserved client who requires some persuasion and rapport building"
    },
    {
      key: "advanced",
      label: "Advanced",
      description: "Challenging client with strong objections and high expectations"
    }
  ]

  // Pass the data to the client component
  return <IndustrySelectionClient initialDifficultyLevels={difficultyLevels} />
}
