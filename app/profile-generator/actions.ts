"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
// Add import for difficulty settings
import { getDifficultySettings } from "@/app/api/simulation/data-store"

// Add a simple in-memory cache
const profileCache = new Map()

// Define the interface for profile generation parameters
// These parameters come from the UI form in page.tsx
export interface ProfileGenerationParams {
  industry: string // Selected industry (insurance, wealth-management, securities)
  subIndustry: string | null // Sub-industry (only for insurance)
  difficulty: string // Difficulty level (beginner, intermediate, advanced)
  complexity: number // Profile complexity percentage (10-100)
  includeFinancialDetails: boolean // Whether to include financial details
  includeFamilyDetails: boolean // Whether to include family details
  includePersonalityTraits: boolean // Whether to include personality traits
  includeRecentEvents: boolean // Whether to include recent life events
  // New parameters for enhanced personality realism
  ageGroup?: string
  communicationStyle?: string
  emotionalReactivity?: number
  lifeStageContext?: string
  culturalContext?: string
  // New parameter for quirks
  includeQuirks?: boolean
  selectedQuirks?: string[]
  // New parameter for industry settings
  industryTraits?: any
  // New parameter for focus areas
  focusAreas?: { id: string; name: string }[]
  // New parameter for cache control
  useCache?: boolean
}

// Main function to generate a profile using AI
export async function generateProfile(params: ProfileGenerationParams) {
  try {
    // Create a cache key based on the parameters
    const cacheKey = JSON.stringify({
      industry: params.industry,
      subIndustry: params.subIndustry,
      difficulty: params.difficulty,
      complexity: params.complexity,
      includeFinancialDetails: params.includeFinancialDetails,
      includeFamilyDetails: params.includeFamilyDetails,
      includePersonalityTraits: params.includePersonalityTraits,
      includeRecentEvents: params.includeRecentEvents,
      ageGroup: params.ageGroup,
      communicationStyle: params.communicationStyle,
      emotionalReactivity: params.emotionalReactivity,
      lifeStageContext: params.lifeStageContext,
      culturalContext: params.culturalContext,
      includeQuirks: params.includeQuirks,
      selectedQuirks: params.selectedQuirks,
      focusAreas: params.focusAreas,
    })

    // Check if we have a cached profile and should use it
    if (params.useCache !== false && profileCache.has(cacheKey)) {
      console.log("Using cached profile")
      return profileCache.get(cacheKey)
    }

    // Fetch industry-specific traits if not provided
    let industryTraits = params.industryTraits
    if (!industryTraits) {
      try {
        const response = await fetch(
          `/api/industry-settings?industry=${params.industry}${
            params.industry === "insurance" && params.subIndustry ? `&subcategory=${params.subIndustry}` : ""
          }`,
        )
        if (response.ok) {
          const data = await response.json()
          industryTraits = data.traits
        }
      } catch (error) {
        console.error("Error fetching industry traits:", error)
      }
    }

    // Create a detailed prompt for the AI based on the parameters
    // This is where the parameters are transformed into a natural language prompt
    const prompt = createPrompt(params, industryTraits)

    // Add diversity parameters to encourage varied profiles
    // This helps prevent the AI from generating similar profiles
    const diversityParams = generateDiversityParameters()
    const diversifiedPrompt = `${prompt}

To ensure diversity in profile generation, please create a profile with these characteristics:
- Name: Use "${diversityParams.suggestedName}" or a similar name with the same cultural background
- Gender: ${diversityParams.gender}
- Occupation: ${diversityParams.occupation} (or a related field if it better fits the narrative)
- Background: Consider a ${diversityParams.background} background
- Family Structure: Consider a "${diversityParams.familyStructure}" family structure if it fits the narrative
- Create a ${diversityParams.ethnicity} perspective

Important: Avoid stereotypical portrayals. Create a realistic, nuanced individual whose identity feels authentic rather than tokenistic. Ensure the name feels authentic and appropriate for the character's background.`

    // Generate the profile using the AI with diversity parameters
    // This calls the OpenAI API via the AI SDK
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: diversifiedPrompt,
      temperature: 0.8, // Slightly increased temperature for more variation
      maxTokens: 2500,
    })

    // Log the raw response for debugging
    console.log("Raw AI response:", text)

    // Try to extract JSON from the response
    let jsonStr = text
    let profile

    try {
      // First attempt: Try parsing the entire response as JSON
      profile = JSON.parse(jsonStr)
    } catch (parseError) {
      console.log("Could not parse entire response as JSON, trying to extract JSON block...")

      try {
        // Second attempt: If the response contains markdown code blocks
        if (text.includes("```")) {
          // Find content between the first \`\`\` and the last \`\`\`
          const codeBlockMatch = text.match(/```(?:json)?([\s\S]*?)```/)
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonStr = codeBlockMatch[1].trim()
            profile = JSON.parse(jsonStr)
          }
        } else {
          // Third attempt: Try to find a JSON object
          const jsonObjectMatch = text.match(/{[\s\S]*}/)
          if (jsonObjectMatch) {
            jsonStr = jsonObjectMatch[0]

            // Clean up potential issues in the JSON string
            // Replace trailing commas before closing braces or brackets
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1")

            // Fix property names without quotes
            jsonStr = jsonStr.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')

            profile = JSON.parse(jsonStr)
          }
        }
      } catch (extractError) {
        console.error("Error extracting and parsing JSON:", extractError)

        // Final attempt: Use a fallback profile based on difficulty
        console.log("Using fallback profile")
        profile = getFallbackProfile(params.difficulty || "beginner")
      }
    }

    // If we still don't have a valid profile, use a fallback
    if (!profile) {
      profile = getFallbackProfile(params.difficulty || "beginner")
    }

    // Store in cache for future use
    profileCache.set(cacheKey, profile)

    // Limit cache size to prevent memory issues
    if (profileCache.size > 50) {
      const oldestKey = profileCache.keys().next().value
      profileCache.delete(oldestKey)
    }

    return profile
  } catch (error) {
    console.error("Error in generateProfile:", error)
    throw error
  }
}

// Function to create the prompt for the AI based on the parameters
// This is where the detailed instructions for the AI are constructed
function createPrompt(params: ProfileGenerationParams, industryTraits: any = null): string {
  const {
    industry,
    subIndustry,
    difficulty,
    complexity,
    includeFinancialDetails,
    includeFamilyDetails,
    includePersonalityTraits,
    includeRecentEvents,
    ageGroup,
    communicationStyle,
    emotionalReactivity,
    lifeStageContext,
    culturalContext,
    includeQuirks,
    selectedQuirks,
    focusAreas,
  } = params

  // Get difficulty settings for this industry and difficulty level
  const difficultySettings = getDifficultySettings()
  const industrySettings = difficultySettings[industry] || {}
  const difficultyKey = difficulty.toLowerCase() as keyof typeof industrySettings
  const difficultyLevel = industrySettings[difficultyKey] || {}

  // Base prompt - This sets up the initial request
  let prompt = `Generate a detailed client profile for a ${difficulty} level simulation in the ${industry} industry`

  if (industry === "insurance" && subIndustry) {
    prompt += ` (${subIndustry} insurance)`
  }

  // Add focus areas if provided
  if (focusAreas && focusAreas.length > 0) {
    prompt += ` with a specific focus on ${focusAreas.map((area) => area.name).join(", ")}`
  }

  prompt += `. The profile should include a comprehensive life narrative and structured data.

The complexity level is ${complexity}%, so ${complexity > 70 ? "create a very detailed and nuanced profile" : complexity > 40 ? "create a moderately detailed profile" : "create a straightforward profile"}.

The profile should include:
1. Basic personal information (name, age, occupation)
2. A detailed life narrative that tells their story
3. Financial goals relevant to ${industry}
4. Concerns or challenges they're facing`

  // Add financial details section if requested
  if (includeFinancialDetails) {
    prompt += `
5. Financial details including:
- Income and income level (low, moderate, high, very high)
- Assets (be specific about types and amounts)
- Debts (be specific about types and amounts)`
  }

  // Add family details section if requested
  if (includeFamilyDetails) {
    prompt += `
6. Family status and details (married, children, dependents, etc.)
- Create diverse family structures - include a variety of family sizes ranging from no children to larger families (3-5 children)
- Don't default to the standard 1-2 children; vary the family size based on the client's life narrative
- For children, always specify their exact ages with units (e.g., "daughter, 7 years old" or "son, 7 months old")
- Be consistent with these ages throughout the entire profile
- Consider various family structures including blended families, multi-generational households, single parents, same-sex parents, adoptive families, etc.
- Include other dependents when appropriate (aging parents, relatives with special needs, etc.)`
  }

  // Add personality traits section if requested
  if (includePersonalityTraits) {
    prompt += `
7. Personality traits and characteristics:
- Include both positive and challenging traits
- Consider how these traits influence financial decisions
- Show how traits manifest in communication style
- Include emotional tendencies and coping mechanisms`

    // Add the new enhanced personality realism parameters
    prompt += `
- Enhanced personality realism attributes:
* ageGroup: ${ageGroup && ageGroup !== "any" ? ageGroup : "Choose from 'young-adult', 'midlife', 'pre-retirement', 'retired'"}
* communicationStyle: ${communicationStyle && communicationStyle !== "any" ? communicationStyle : "Choose from 'rambler', 'sniper', 'overthinker', 'optimist', 'mistrustful', 'balanced'"}
* emotionalReactivity: ${emotionalReactivity !== undefined ? emotionalReactivity : "RANDOM_VALUE_BETWEEN_10_AND_90"} (0-100, how quickly mood changes)
* lifeStageContext: ${lifeStageContext && lifeStageContext !== "any" ? lifeStageContext : "Choose from 'career-focused', 'family-building', 'empty-nester', 'retirement-planning', 'legacy-focused'"}
* culturalContext: ${culturalContext && culturalContext !== "any" ? culturalContext : "Choose from 'mainstream', 'traditional', 'progressive', 'international', 'technical', 'academic'"}`
  }

  // Add quirks section if requested
  if (includeQuirks) {
    prompt += `
- Communication quirks:
* quirks: ${
        selectedQuirks && selectedQuirks.length > 0
          ? JSON.stringify(selectedQuirks)
          : "Choose 1-3 from ['Sarcasm', 'Bluntness', 'Overthinking', 'Avoidance', 'Wit', 'Passive-Aggressiveness', 'Dismissiveness', 'Catastrophizing', 'People-Pleasing', 'Rambling', 'Nervous Humor', 'Stonewalling', 'Formalism', 'Exaggeration']"
      }
* quirkIntensity: RANDOM_VALUE_BETWEEN_30_AND_90 (how strongly the quirks influence communication)`
  }

  // Add recent events section if requested
  if (includeRecentEvents) {
    prompt += `
8. Recent events and life changes (within the last 6-12 months) that might impact financial decisions, such as:
- Career changes (promotion, job loss, career shift)
- Family changes (marriage, divorce, birth of a child, empty nest)
- Relocation (moving to a new city or state)
- Health events (diagnosis, recovery)
- Inheritance or windfall
- Major purchases or financial commitments
- Business changes (starting, expanding, or selling a business)
- Include 2-4 significant recent events and their potential financial impact

IMPORTANT: Ensure all recent events are consistent with the life narrative. For example, if the narrative mentions children of specific ages, any recent events about children should align with those ages. Double-check for consistency between all sections of the profile.`
  }

  // Add industry-specific traits if available
  if (industryTraits) {
    prompt += `

9. Industry-specific context:
- Knowledge areas: The client should have varying levels of knowledge about: ${industryTraits.knowledgeAreas.join(", ")}
- Common concerns: Include some of these typical concerns for this industry: ${industryTraits.commonConcerns.join(", ")}
- Typical goals: Reference some of these goals in the profile: ${industryTraits.typicalGoals.join(", ")}
- Industry terminology: The client may use or be familiar with some of these terms: ${industryTraits.industryTerminology.join(", ")}
- Regulatory considerations: The client's situation may involve these regulatory aspects: ${industryTraits.regulatoryConsiderations.join(", ")}

IMPORTANT: Incorporate these industry-specific elements naturally throughout the profile. Don't just list them - weave them into the narrative, goals, concerns, and background in a realistic way.`
  }

  // Add general consistency instruction
  prompt += `

IMPORTANT: Ensure complete consistency across all sections of the profile. Check that:
- Ages mentioned in recent events match ages in the life narrative
- Always specify ages clearly with units (e.g., "7 years old" or "7 months old") to avoid ambiguity
- When mentioning children, consistently use the same age format throughout the profile
- Family details are consistent throughout
- Career information is consistent
- Financial details align with the narrative
- Recent events logically fit with the overall life story
- The life stage context influences priorities and decision-making throughout the profile`

  // Final instructions for output format
  // This defines the structure of the JSON that the AI should return
  prompt += `

Return the profile as a JSON object with the following structure:
{
"name": "Client's full name",
"age": 42,
"occupation": "Their job title",
"familyStatus": "Their family situation",
"incomeLevel": "Low/Moderate/High/Very High",
"lifeNarrative": "A detailed paragraph describing their life story...",
"goals": ["Goal 1", "Goal 2", "Goal 3"],
"concerns": ["Concern 1", "Concern 2", "Concern 3"],`

  if (includeFinancialDetails) {
    prompt += `
"financialDetails": {
"income": "$X per year",
"assets": ["Asset 1 with amount", "Asset 2 with amount"],
"debts": ["Debt 1 with amount", "Debt 2 with amount"],
},`
  }

  if (includeRecentEvents) {
    prompt += `
"recentEvents": ["Recent event 1", "Recent event 2", "Recent event 3"],
"eventImpact": "A brief paragraph describing how these recent events impact the client's financial situation and decision-making",`
  }

  if (includePersonalityTraits) {
    prompt += `
"personalityTraits": {
"riskTolerance": "Low/Moderate/High",
"decisionMaking": "Analytical/Emotional/Balanced",
"financialKnowledge": "Limited/Moderate/Sophisticated",
"trustLevel": "Skeptical/Cautious/Trusting"
},
"fusionModelTraits": {
"openness": RANDOM_VALUE_BETWEEN_10_AND_90,
"conscientiousness": RANDOM_VALUE_BETWEEN_10_AND_90,
"extraversion": RANDOM_VALUE_BETWEEN_10_AND_90,
"agreeableness": RANDOM_VALUE_BETWEEN_10_AND_90,
"neuroticism": RANDOM_VALUE_BETWEEN_10_AND_90,
"assertiveness": RANDOM_VALUE_BETWEEN_10_AND_90,
"honestyHumility": RANDOM_VALUE_BETWEEN_10_AND_90
},
"fusionModelArchetype": "RANDOMLY_SELECTED_ARCHETYPE",
"fusionModelMood": "RANDOMLY_SELECTED_MOOD",
"fusionModelInfluence": RANDOM_VALUE_BETWEEN_30_AND_90,
"ageGroup": "young-adult/midlife/pre-retirement/retired",
"communicationStyle": "rambler/sniper/overthinker/optimist/mistrustful/balanced",
"emotionalReactivity": RANDOM_VALUE_BETWEEN_10_AND_90,
"lifeStageContext": "career-focused/family-building/empty-nester/retirement-planning/legacy-focused",
"culturalContext": "mainstream/traditional/progressive/international/technical/academic",`

    // Add quirks to JSON structure if requested
    if (includeQuirks) {
      prompt += `
"quirks": ["Quirk1", "Quirk2"],
"quirkIntensity": RANDOM_VALUE_BETWEEN_30_AND_90,`
    }
  }

  // Add industry-specific fields
  // These fields are tailored to the selected industry
  switch (industry) {
    case "insurance":
      prompt += `
"insuranceNeeds": ["Need 1", "Need 2", "Need 3"],
"currentCoverage": ["Coverage 1", "Coverage 2"],`
      break

    case "wealth-management":
      prompt += `
"investmentExperience": "None/Limited/Moderate/Extensive",
"timeHorizon": "Short/Medium/Long",
"retirementStatus": "Not started/In progress/Well-funded",`
      break

    case "securities":
      prompt += `
"investmentKnowledge": "Beginner/Intermediate/Advanced",
"preferredSecurities": ["Type 1", "Type 2"],
"tradingFrequency": "Rarely/Occasionally/Frequently",`
      break
  }

  // Add industry-specific knowledge fields
  if (industryTraits) {
    prompt += `
"industryKnowledge": {
  "familiarTerms": ["Term 1", "Term 2", "Term 3"],
  "knowledgeGaps": ["Gap 1", "Gap 2"],
  "misconceptions": ["Misconception 1", "Misconception 2"]
},`
  }

  // Close the JSON structure
  prompt += `
"industrySpecificDetails": {}
}`

  // Add focus area specific instructions if provided
  if (focusAreas && focusAreas.length > 0) {
    prompt += `

IMPORTANT: This client profile should specifically address needs related to ${focusAreas.map((area) => area.name).join(", ")}. Make sure the client's situation, concerns, and goals are directly relevant to these focus areas.`

    // Add specific instructions based on focus areas
    if (industry === "insurance" && subIndustry === "life-health") {
      const focusAreaIds = focusAreas.map((area) => area.id)

      if (focusAreaIds.includes("life-insurance")) {
        prompt += `
- Include specific life insurance needs such as income replacement, debt coverage, or estate planning
- Consider factors like family dependents, mortgage or other debts, and long-term financial obligations`
      }

      if (focusAreaIds.includes("annuities")) {
        prompt += `
- Include retirement income concerns and interest in guaranteed income streams
- Consider factors like retirement timeline, existing retirement assets, and income stability concerns`
      }

      if (focusAreaIds.includes("long-term-care")) {
        prompt += `
- Include concerns about future care needs, either for themselves or family members
- Consider factors like family health history, existing health conditions, and retirement planning`
      }

      if (focusAreaIds.includes("medical-expense")) {
        prompt += `
- Include concerns about healthcare costs, Medicare coverage gaps, or supplemental insurance needs
- Consider factors like existing health conditions, prescription drug needs, and healthcare utilization`
      }

      if (focusAreaIds.includes("disability-insurance")) {
        prompt += `
- Include concerns about income protection in case of disability or inability to work
- Consider factors like occupation hazards, income dependence, and existing emergency funds`
      }
    }

    if (industry === "insurance" && subIndustry === "property-casualty") {
      const focusAreaIds = focusAreas.map((area) => area.id)

      if (focusAreaIds.includes("homeowners-insurance")) {
        prompt += `
- Include specific home-related concerns such as property value, contents, liability, or natural disaster risks
- Consider factors like home location, value of possessions, home-based business, or rental properties`
      }

      if (focusAreaIds.includes("automobile-insurance")) {
        prompt += `
- Include specific auto-related concerns such as vehicle value, usage patterns, or driver profiles
- Consider factors like number of vehicles, drivers in household, commuting distance, or teen drivers`
      }
    }
  }

  return prompt
}

// Add the getFallbackProfile function to the actions.ts file
// Add this function after the createPrompt function:

// Function to provide a fallback profile if JSON parsing fails
function getFallbackProfile(difficulty: string) {
  console.log(`Creating fallback profile for ${difficulty} difficulty`)

  if (difficulty === "beginner") {
    return {
      name: "John Smith",
      age: 42,
      occupation: "High School Teacher",
      income: "$65,000",
      incomeLevel: "Moderate",
      family: "Married with 2 children (ages 10 and 8)",
      familyStatus: "Married with 2 children (ages 10 and 8)",
      assets: ["$25,000 emergency fund", "403(b) with $120,000", "Home equity"],
      debts: ["$180,000 mortgage", "$15,000 auto loan"],
      goals: [
        "Protect family financially",
        "Save for children's college education",
        "Ensure adequate retirement savings",
      ],
      fusionModelTraits: {
        openness: 60,
        conscientiousness: 70,
        extraversion: 50,
        agreeableness: 75,
        neuroticism: 30,
        assertiveness: 40,
        honestyHumility: 80,
      },
      difficulty: "beginner",
    }
  } else if (difficulty === "intermediate") {
    return {
      name: "Sarah Johnson",
      age: 58,
      occupation: "Marketing Executive",
      income: "$95,000",
      incomeLevel: "High",
      family: "Divorced, 1 adult child",
      familyStatus: "Divorced, 1 adult child",
      assets: ["$150,000 in 401(k)", "$50,000 in savings", "Paid-off condo"],
      debts: ["$5,000 credit card debt"],
      goals: ["Plan for retirement in 7-10 years", "Maximize investment returns", "Minimize tax burden"],
      fusionModelTraits: {
        openness: 50,
        conscientiousness: 65,
        extraversion: 45,
        agreeableness: 60,
        neuroticism: 45,
        assertiveness: 55,
        honestyHumility: 70,
      },
      difficulty: "intermediate",
    }
  } else {
    return {
      name: "Michael Torres",
      age: 35,
      occupation: "Entrepreneur",
      income: "Variable ($120,000-$200,000)",
      incomeLevel: "High",
      family: "Single, no children",
      familyStatus: "Single, no children",
      assets: ["Business equity", "Investment portfolio", "$30,000 in savings"],
      debts: ["$40,000 business loan", "$15,000 student loans"],
      goals: ["Business expansion", "Personal financial security", "Future retirement planning"],
      fusionModelTraits: {
        openness: 40,
        conscientiousness: 60,
        extraversion: 60,
        agreeableness: 40,
        neuroticism: 60,
        assertiveness: 75,
        honestyHumility: 50,
      },
      difficulty: "advanced",
    }
  }
}

// Function to generate diversity parameters
// This helps ensure that the AI creates diverse profiles
function generateDiversityParameters() {
  // Generate random parameters to encourage diversity
  const genders = ["male", "female", "non-binary"]
  const gender = genders[Math.floor(Math.random() * genders.length)]

  // Diverse set of first names across different cultural backgrounds
  const firstNames = [
    // Western names
    "Olivia",
    "Noah",
    "Emma",
    "Liam",
    "Charlotte",
    "Elijah",
    "Ava",
    "William",
    "Sophia",
    "James",
    "Amelia",
    "Benjamin",
    "Isabella",
    "Lucas",
    "Mia",
    "Henry",
    // Hispanic names
    "Sofia",
    "Mateo",
    "Isabella",
    "Santiago",
    "Valentina",
    "Diego",
    "Camila",
    "Sebastián",
    // Asian names
    "Mei",
    "Hiroshi",
    "Ji-Woo",
    "Arjun",
    "Priya",
    "Chen",
    "Seo-yun",
    "Raj",
    "Anika",
    "Kai",
    // African/African American names
    "Zuri",
    "Jamal",
    "Amara",
    "Kwame",
    "Nia",
    "Malik",
    "Imani",
    "Darius",
    "Aaliyah",
    "Kofi",
    // Middle Eastern names
    "Amir",
    "Fatima",
    "Zara",
    "Omar",
    "Leila",
    "Hassan",
    "Yasmin",
    "Ibrahim",
    "Noor",
    "Rayan",
    // Less common Western names
    "Silas",
    "Freya",
    "Declan",
    "Wren",
    "Rowan",
    "Juniper",
    "Finn",
    "Sage",
    "Asher",
    "Willow",
  ]

  // Diverse set of last names across different cultural backgrounds
  const lastNames = [
    // Various cultural backgrounds
    "Smith",
    "Johnson",
    "Williams",
    "Garcia",
    "Martinez",
    "Brown",
    "Davis",
    "Rodriguez",
    "Wilson",
    "Anderson",
    "Kim",
    "Nguyen",
    "Patel",
    "Singh",
    "Wang",
    "Zhang",
    "Liu",
    "Chen",
    "Tanaka",
    "Suzuki",
    "Yamamoto",
    "Okafor",
    "Mensah",
    "Abara",
    "Osei",
    "Adeyemi",
    "Diallo",
    "Mandela",
    "Nkosi",
    "Okeke",
    "Afolayan",
    "Al-Farsi",
    "Hassan",
    "Khalid",
    "Rahman",
    "Saleh",
    "Amir",
    "Hakim",
    "Karimi",
    "Mostafa",
    "Nassar",
    "Kowalski",
    "Novak",
    "Ivanov",
    "Andersson",
    "Müller",
    "Petrov",
    "Smirnov",
    "Bauer",
    "Jansen",
    "Rossi",
    "Fitzgerald",
    "O'Brien",
    "Kaur",
    "Gupta",
    "Sharma",
    "Choi",
    "Park",
    "Nakamura",
    "Sato",
    "Watanabe",
  ]

  // Randomly select names
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const fullName = `${firstName} ${lastName}`

  // Diverse set of occupations across different fields
  const occupations = [
    // Business & Finance
    "Financial Analyst",
    "Marketing Director",
    "Human Resources Manager",
    "Small Business Owner",
    "Corporate Executive",
    "Accountant",
    "Real Estate Agent",

    // Healthcare
    "Physician",
    "Nurse Practitioner",
    "Physical Therapist",
    "Pharmacist",
    "Medical Researcher",
    "Dentist",
    "Veterinarian",

    // Technology
    "Software Engineer",
    "Data Scientist",
    "IT Manager",
    "Cybersecurity Specialist",
    "UX Designer",
    "Systems Administrator",

    // Education
    "Elementary Teacher",
    "University Professor",
    "School Administrator",
    "Educational Consultant",
    "Special Education Teacher",
    "School Counselor",

    // Trades & Services
    "Electrician",
    "Plumber",
    "Chef",
    "Mechanic",
    "Construction Manager",
    "Firefighter",
    "Police Officer",
    "Flight Attendant",
    "Pilot",

    // Creative & Arts
    "Graphic Designer",
    "Journalist",
    "Photographer",
    "Musician",
    "Interior Designer",
    "Architect",
    "Writer",
    "Film Producer",

    // Other
    "Social Worker",
    "Attorney",
    "Agricultural Manager",
    "Environmental Scientist",
    "Public Relations Specialist",
    "Government Employee",
    "Non-profit Director",
    "Retail Manager",
    "Sales Representative",
    "Consultant",
  ]

  const occupation = occupations[Math.floor(Math.random() * occupations.length)]

  // Diverse backgrounds
  const backgrounds = [
    "urban",
    "suburban",
    "rural",
    "immigrant",
    "first-generation college graduate",
    "multi-generational family business",
  ]
  const background = backgrounds[Math.floor(Math.random() * backgrounds.length)]

  // Diverse ethnicities (handled sensitively)
  const ethnicities = ["diverse", "multicultural"]
  const ethnicity = ethnicities[Math.floor(Math.random() * ethnicities.length)]

  // Family structure diversity
  const familyStructures = [
    "no children",
    "single child",
    "two children",
    "three children",
    "four or more children",
    "blended family",
    "multi-generational household",
    "single parent",
    "same-sex parents",
    "adoptive family",
  ]
  const familyStructure = familyStructures[Math.floor(Math.random() * familyStructures.length)]

  return { gender, occupation, background, ethnicity, suggestedName: fullName, familyStructure }
}
