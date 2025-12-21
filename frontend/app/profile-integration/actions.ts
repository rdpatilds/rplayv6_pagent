"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function testProfileIntegration(profile: any) {
  try {
    // Create a detailed prompt for the AI to analyze the profile
    const prompt = createAnalysisPrompt(profile)

    // Generate the analysis using the AI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 2000,
    })

    // Parse the JSON response
    try {
      // The AI should return a JSON object
      const analysis = JSON.parse(text)
      return analysis
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/)

      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1] || jsonMatch[0])
        } catch (e) {
          throw new Error("Could not parse analysis data from AI response")
        }
      } else {
        throw new Error("AI response did not contain valid JSON")
      }
    }
  } catch (error) {
    console.error("Error in testProfileIntegration:", error)
    throw error
  }
}

function createAnalysisPrompt(profile: any): string {
  // Convert profile to string for the prompt
  const profileStr = JSON.stringify(profile, null, 2)

  return `Analyze the following client profile JSON to determine how well it would integrate with a financial services simulation system. The system requires specific parameters for client profiles in insurance, wealth management, and securities industries.

CLIENT PROFILE:
${profileStr}

Your task is to:
1. Extract key parameters needed for the simulation system
2. Assess compatibility with the simulation system
3. Provide a preview of how this profile would appear in the simulation
4. Predict how this client would behave in a simulation

Return your analysis as a JSON object with the following structure:

{
  "parameterMapping": [
    {
      "parameter": "name",
      "value": "Extracted value",
      "source": "Direct field or derived from narrative",
      "confidence": 100
    },
    // Include all relevant parameters:
    // name, age, occupation, familyStatus, income, incomeLevel, assets, debts, goals, etc.
  ],
  
  "extractionNotes": [
    "Note about any challenges in extracting parameters",
    "Note about any assumptions made",
    "Note about any missing information"
  ],
  
  "compatibility": {
    "score": 85,
    "summary": "Overall assessment of compatibility",
    "strengths": [
      "Strength 1",
      "Strength 2"
    ],
    "gaps": [
      "Gap 1",
      "Gap 2"
    ],
    "industries": [
      {
        "name": "Insurance",
        "score": 90,
        "notes": "Particularly well-suited for insurance simulations because..."
      },
      {
        "name": "Wealth Management",
        "score": 80,
        "notes": "Good fit for wealth management with some limitations..."
      },
      {
        "name": "Securities",
        "score": 70,
        "notes": "Could work for securities but missing some key details..."
      }
    ]
  },
  
  "simulationPreview": {
    "family": "Formatted family status for display",
    "income": "Formatted income for display",
    "assets": ["Formatted asset 1", "Formatted asset 2"],
    "debts": ["Formatted debt 1", "Formatted debt 2"],
    "goals": ["Formatted goal 1", "Formatted goal 2"],
    "behavior": {
      "communicationStyle": "Description of how this client would communicate",
      "informationSharing": "How readily they would share information",
      "decisionMaking": "How they would approach decisions",
      "likelyChallenges": [
        "Challenge 1 for the advisor",
        "Challenge 2 for the advisor"
      ]
    }
  }
}

Be thorough in your analysis but focus on practical implications for the simulation system.`
}
