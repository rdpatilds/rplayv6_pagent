// Quirks taxonomy for enhanced personality realism
export const quirksTaxonomy = {
  quirks: [
    {
      name: "Sarcasm",
      description: "Uses ironic or mocking statements, often to deflect or express skepticism.",
      impact: "Tone becomes cutting, ironic, or humorously critical.",
      triggers: ["low_agreeableness > 40", "mood == Skeptical", "recent_life_event == bad experience"],
      fusion_links: ["low Agreeableness", "high Openness", "moderate Neuroticism"],
    },
    {
      name: "Bluntness",
      description: "Speaks directly and without softening, often perceived as tactless.",
      impact: "Short, assertive statements; low tolerance for fluff.",
      triggers: ["high_assertiveness > 70", "low_agreeableness < 40"],
      fusion_links: ["high Assertiveness", "low Agreeableness"],
    },
    {
      name: "Overthinking",
      description: "Analyzes excessively and struggles to reach decisions.",
      impact: "Loops in questions, asks for repeated clarification.",
      triggers: ["neuroticism > 60", "recent_life_event == financial uncertainty"],
      fusion_links: ["high Neuroticism", "moderate Conscientiousness"],
    },
    {
      name: "Avoidance",
      description: "Shifts topics or disengages when uncomfortable.",
      impact: "Dodges personal or emotional questions; may redirect with surface-level chatter.",
      triggers: ["mood == Hesitant", "neuroticism > 50", "recent_life_event == trauma"],
      fusion_links: ["moderate Neuroticism", "low Assertiveness"],
    },
    {
      name: "Wit",
      description: "Clever use of humor or irony to lighten the mood or express intelligence.",
      impact: "Engages with playful language, creative comparisons.",
      triggers: ["openness > 70", "extraversion > 60"],
      fusion_links: ["high Openness", "moderate to high Extraversion"],
    },
    {
      name: "Passive-Aggressiveness",
      description: "Indirect resistance or negativity expressed through subtle jabs.",
      impact: "Sarcasm with hidden criticism, polite avoidance of agreement.",
      triggers: ["low assertiveness", "moderate neuroticism", "bad prior advisor experience"],
      fusion_links: ["low Assertiveness", "moderate Neuroticism"],
    },
    {
      name: "Dismissiveness",
      description: "Downplays the importance of the conversation or advice.",
      impact: "Casual or brushing-off language; may say 'it's not a big deal'.",
      triggers: ["agreeableness < 30", "mood == Skeptical"],
      fusion_links: ["low Agreeableness"],
    },
    {
      name: "Catastrophizing",
      description: "Imagines worst-case scenarios and overestimates risk.",
      impact: "Responses reflect anxiety and fatalism.",
      triggers: ["neuroticism > 70", "recent_life_event == job loss or illness"],
      fusion_links: ["high Neuroticism"],
    },
    {
      name: "People-Pleasing",
      description: "Quickly agrees to avoid conflict, may not express true concerns.",
      impact: "Excessive agreement, hesitance to say no.",
      triggers: ["high agreeableness", "low assertiveness"],
      fusion_links: ["high Agreeableness", "low Assertiveness"],
    },
    {
      name: "Rambling",
      description: "Speech wanders without clear direction, often due to nervousness.",
      impact: "Long-winded responses; changes subject mid-sentence.",
      triggers: ["low conscientiousness", "extraversion > 60"],
      fusion_links: ["low Conscientiousness", "high Extraversion"],
    },
    {
      name: "Nervous Humor",
      description: "Uses humor to cope with stress or discomfort.",
      impact: "Makes jokes to mask discomfort or vulnerability.",
      triggers: ["neuroticism > 60", "mood == Hesitant"],
      fusion_links: ["high Neuroticism", "moderate Extraversion"],
    },
    {
      name: "Stonewalling",
      description: "Shuts down communication entirely when feeling overwhelmed or mistrustful.",
      impact: "Short or silent replies; may signal end of conversation.",
      triggers: ["very low agreeableness", "prior trust violation"],
      fusion_links: ["low Agreeableness", "low Openness"],
    },
    {
      name: "Formalism",
      description: "Overly structured, impersonal tone often used to assert control or avoid emotion.",
      impact: "Precise, emotionless phrasing; may feel cold or professional.",
      triggers: ["high conscientiousness", "low extraversion"],
      fusion_links: ["high Conscientiousness", "low Extraversion"],
    },
    {
      name: "Exaggeration",
      description: "Amplifies concerns or benefits to make a point.",
      impact: "Dramatic expressions of risk, reward, or cost.",
      triggers: ["openness > 60", "mood == Excited or Skeptical"],
      fusion_links: ["moderate Openness", "moderate Neuroticism"],
    },
  ],
}

// Helper function to get quirk by name
export function getQuirkByName(name: string) {
  return quirksTaxonomy.quirks.find((quirk) => quirk.name === name)
}

// Helper function to get all quirk names
export function getAllQuirkNames() {
  return quirksTaxonomy.quirks.map((quirk) => quirk.name)
}

// Helper function to get quirks that match certain personality traits
export function getMatchingQuirks(traits: any) {
  // This is a simplified matching algorithm
  // In a real implementation, you would use the triggers array to determine matches
  const matches = []

  // Example matching logic (simplified)
  if (traits.agreeableness < 40) {
    matches.push("Sarcasm", "Bluntness", "Dismissiveness")
  }

  if (traits.neuroticism > 60) {
    matches.push("Overthinking", "Catastrophizing", "Nervous Humor")
  }

  if (traits.extraversion > 60 && traits.openness > 60) {
    matches.push("Wit")
  }

  // Return unique matches
  return [...new Set(matches)]
}
