// Define types for our rubric structure
export type ScoreRange = {
  range: string
  description: string
  criteria: string[]
}

export type DifficultyRubric = {
  beginner: ScoreRange[]
  intermediate: ScoreRange[]
  advanced: ScoreRange[]
}

export type CompetencyRubric = {
  id: string
  name: string
  description: string
  rubric: DifficultyRubric
}

// Define more detailed scoring ranges with specific criteria
export const defaultRubricRanges: ScoreRange[] = [
  {
    range: "1-2",
    description: "Critical improvement required",
    criteria: [
      "Failed to demonstrate basic competency",
      "Made significant errors or omissions",
      "Showed minimal understanding of concepts",
      "Did not address client needs",
    ],
  },
  {
    range: "3-4",
    description: "Below expectations",
    criteria: [
      "Demonstrated limited understanding",
      "Made notable errors or omissions",
      "Addressed some client needs but missed key elements",
      "Showed inconsistent application of concepts",
    ],
  },
  {
    range: "5-6",
    description: "Meets basic expectations",
    criteria: [
      "Demonstrated adequate understanding",
      "Made minor errors or omissions",
      "Addressed most client needs",
      "Applied concepts with some effectiveness",
    ],
  },
  {
    range: "7-8",
    description: "Exceeds expectations",
    criteria: [
      "Demonstrated strong understanding",
      "Made minimal errors or omissions",
      "Addressed all client needs effectively",
      "Applied concepts consistently and appropriately",
    ],
  },
  {
    range: "9-10",
    description: "Outstanding performance",
    criteria: [
      "Demonstrated exceptional understanding",
      "Made no significant errors or omissions",
      "Addressed all client needs comprehensively",
      "Applied concepts expertly and creatively",
    ],
  },
]

// Define competency-specific criteria
export const competencyCriteria = {
  communication: {
    name: "Communication Skills",
    criteria: {
      "1-2": [
        "Used inappropriate or unprofessional language",
        "Failed to listen to client concerns",
        "Communicated in a confusing or unclear manner",
        "Used jargon without explanation",
      ],
      "3-4": [
        "Used mostly appropriate language with some issues",
        "Showed limited active listening",
        "Communicated with some clarity but had gaps",
        "Occasionally used unexplained jargon",
      ],
      "5-6": [
        "Used appropriate professional language",
        "Demonstrated basic active listening",
        "Communicated clearly most of the time",
        "Explained most technical terms",
      ],
      "7-8": [
        "Used consistently professional language",
        "Demonstrated strong active listening",
        "Communicated clearly and effectively",
        "Explained all technical terms appropriately",
      ],
      "9-10": [
        "Used exemplary professional language",
        "Demonstrated exceptional active listening",
        "Communicated with outstanding clarity and impact",
        "Made complex concepts accessible and understandable",
      ],
    },
  },
  "needs-assessment": {
    name: "Needs Assessment",
    criteria: {
      "1-2": [
        "Failed to ask relevant discovery questions",
        "Did not identify client's basic needs",
        "Ignored client's stated goals",
        "Made inappropriate assumptions",
      ],
      "3-4": [
        "Asked few relevant discovery questions",
        "Identified some basic client needs",
        "Acknowledged but didn't fully address stated goals",
        "Made some assumptions without verification",
      ],
      "5-6": [
        "Asked adequate discovery questions",
        "Identified most client needs",
        "Addressed most stated goals",
        "Verified most assumptions",
      ],
      "7-8": [
        "Asked comprehensive discovery questions",
        "Identified all stated client needs",
        "Addressed all stated goals",
        "Verified assumptions consistently",
      ],
      "9-10": [
        "Asked insightful and thorough discovery questions",
        "Identified stated and unstated client needs",
        "Addressed all goals with prioritization",
        "Verified all assumptions and clarified ambiguities",
      ],
    },
  },
  "objection-handling": {
    name: "Objection Handling",
    criteria: {
      "1-2": [
        "Ignored or dismissed client objections",
        "Became defensive when challenged",
        "Failed to address concerns",
        "Did not acknowledge client hesitations",
      ],
      "3-4": [
        "Acknowledged but inadequately addressed objections",
        "Showed some defensiveness when challenged",
        "Addressed concerns superficially",
        "Minimally acknowledged client hesitations",
      ],
      "5-6": [
        "Acknowledged and partially addressed objections",
        "Remained mostly professional when challenged",
        "Addressed most concerns adequately",
        "Acknowledged client hesitations appropriately",
      ],
      "7-8": [
        "Effectively addressed most objections",
        "Remained professional when challenged",
        "Addressed all concerns thoroughly",
        "Validated client hesitations respectfully",
      ],
      "9-10": [
        "Expertly addressed all objections",
        "Welcomed challenges as opportunities",
        "Addressed concerns comprehensively and proactively",
        "Transformed hesitations into opportunities",
      ],
    },
  },
  "bias-awareness": {
    name: "Bias Awareness",
    criteria: {
      "1-2": [
        "Showed clear biases in recommendations",
        "Made stereotypical assumptions",
        "Treated client inequitably",
        "Pushed personal preferences",
      ],
      "3-4": [
        "Showed some biases in recommendations",
        "Made some assumptions without verification",
        "Showed inconsistent treatment",
        "Occasionally prioritized personal views",
      ],
      "5-6": [
        "Showed minimal bias in recommendations",
        "Verified most assumptions",
        "Treated client equitably most of the time",
        "Generally prioritized client needs",
      ],
      "7-8": [
        "Showed no apparent bias in recommendations",
        "Verified assumptions consistently",
        "Treated client equitably",
        "Prioritized client needs consistently",
      ],
      "9-10": [
        "Demonstrated exceptional awareness of potential biases",
        "Proactively verified all assumptions",
        "Treated client with exemplary equity",
        "Completely prioritized client needs over personal views",
      ],
    },
  },
  "option-suggestions": {
    name: "Solution Recommendations",
    criteria: {
      "1-2": [
        "Recommended inappropriate solutions",
        "Failed to explain recommendations",
        "Ignored client's risk tolerance or goals",
        "Provided generic advice without personalization",
      ],
      "3-4": [
        "Recommended partially appropriate solutions",
        "Provided limited explanation of recommendations",
        "Considered some aspects of client's situation",
        "Provided somewhat personalized advice",
      ],
      "5-6": [
        "Recommended mostly appropriate solutions",
        "Explained recommendations adequately",
        "Considered most aspects of client's situation",
        "Provided personalized advice",
      ],
      "7-8": [
        "Recommended appropriate solutions",
        "Explained recommendations thoroughly",
        "Considered all aspects of client's situation",
        "Provided well-personalized advice",
      ],
      "9-10": [
        "Recommended optimal solutions",
        "Explained recommendations comprehensively with pros/cons",
        "Holistically considered client's situation",
        "Provided expertly tailored advice",
      ],
    },
  },
  "time-management": {
    name: "Time Management",
    criteria: {
      "1-2": [
        "Failed to cover essential topics",
        "Spent too much time on irrelevant matters",
        "Did not progress the conversation effectively",
        "Left critical issues unaddressed",
      ],
      "3-4": [
        "Covered some essential topics",
        "Spent some time on irrelevant matters",
        "Progressed the conversation inconsistently",
        "Left some critical issues unaddressed",
      ],
      "5-6": [
        "Covered most essential topics",
        "Generally focused on relevant matters",
        "Progressed the conversation adequately",
        "Addressed most critical issues",
      ],
      "7-8": [
        "Covered all essential topics",
        "Focused on relevant matters consistently",
        "Progressed the conversation effectively",
        "Addressed all critical issues",
      ],
      "9-10": [
        "Covered all topics comprehensively",
        "Maintained optimal focus throughout",
        "Progressed the conversation expertly",
        "Addressed all issues with appropriate prioritization",
      ],
    },
  },
}

// Helper function to get criteria for a specific competency and score range
export function getCompetencyCriteria(competencyId: string, scoreRange: string): string[] {
  const competency = competencyCriteria[competencyId as keyof typeof competencyCriteria]
  if (!competency) {
    return defaultRubricRanges.find((range) => range.range === scoreRange)?.criteria || []
  }
  return (
    competency.criteria[scoreRange as keyof typeof competency.criteria] ||
    defaultRubricRanges.find((range) => range.range === scoreRange)?.criteria ||
    []
  )
}

// Helper function to find the appropriate score range for a given score
export function findScoreRange(score: number, ranges: ScoreRange[]): ScoreRange | undefined {
  return ranges.find((range) => {
    const [min, max] = range.range.split("-").map(Number)
    return score >= min && score <= max
  })
}

// Helper function to get the score range for a specific competency, difficulty level, and score
export function getScoreRange(
  competencyId: string,
  difficultyLevel: string,
  score: number,
  rubrics: CompetencyRubric[],
): ScoreRange | undefined {
  const rubric = rubrics.find((r) => r.id === competencyId)
  if (!rubric) return undefined

  const difficulty = difficultyLevel.toLowerCase() as keyof DifficultyRubric
  if (!rubric.rubric[difficulty]) return undefined

  return findScoreRange(score, rubric.rubric[difficulty])
}
