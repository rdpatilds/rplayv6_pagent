import { FusionPromptBlock } from "@/app/api/simulation/types"

type Mood = { key: string; label: string; description: string }
type CommunicationStyle = { key: string; label: string; description: string; example: string }
type Archetype = { key: string; name: string; description: string }
type AgeGroup = { key: string; name: string; range: string }

export function buildFusionPromptBlock({
    age,
    mood,
    communicationStyle,
    archetype,
    industry,
    subcategory,
    focusAreas = [],
    ageGroup,
  }: {
    age: number
    mood: Mood
    communicationStyle: CommunicationStyle
    archetype: Archetype
    industry: string
    subcategory?: string
    focusAreas?: { id: string; name: string }[]
    ageGroup: AgeGroup
}): FusionPromptBlock {
    return {
        age,
        lifeStage: ageGroup.name,
        mood: mood.key,
        communicationStyle: communicationStyle.key,
        archetype: archetype.key,
        culturalContext: "U.S. general adult population",
        vocabularyGuidance: `Speak as a ${age}-year-old would in a real-world ${subcategory || industry} scenario. Use language consistent with someone discussing ${focusAreas.map(f => f.name).join(", ") || "their needs"}. Avoid technical jargon unless prompted, and match the tone and style of the persona.`,
        toneGuidance: mood.description,
        referenceGuidance: communicationStyle.example,
      }
}
