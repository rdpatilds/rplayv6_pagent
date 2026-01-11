/**
 * This file maps personality trait values to behavioral descriptions and conversational examples
 * It provides natural language descriptions of how each trait manifests in conversation
 */

// Define the trait levels
export type TraitLevel = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"

// Define the structure for trait behavior profiles
export interface TraitBehaviorProfile {
  summary: string // General description of the trait at this level
  positiveExample: string // How this trait manifests positively in conversation
  negativeExample: string // How this trait manifests negatively in conversation
}

// Define the trait names
export type TraitName =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism"
  | "honestyHumility"
  | "assertiveness"

// Define the structure for all trait behaviors
export type TraitBehaviorMapping = {
  [T in TraitName]: Record<TraitLevel, TraitBehaviorProfile>
}

// Define the trait bucket (for backward compatibility)
export type TraitBucket = "Very Low" | "Low" | "Medium" | "High" | "Very High"

// Define the structure for trait behavior data (for backward compatibility)
export interface TraitBehaviorData {
  trait: string
  value: number
  bucket: TraitBucket
  description: string
}

// Define the structure for all trait behaviors (for backward compatibility)
export interface TraitBehaviors {
  openness: TraitBehaviorData
  conscientiousness: TraitBehaviorData
  extraversion: TraitBehaviorData
  agreeableness: TraitBehaviorData
  neuroticism: TraitBehaviorData
  honestyHumility: TraitBehaviorData
  assertiveness: TraitBehaviorData
}

/**
 * Maps a trait value to a level
 */
export function mapValueToLevel(value: number): TraitLevel {
  if (value <= 20) return "VERY_LOW"
  if (value <= 40) return "LOW"
  if (value <= 60) return "MEDIUM"
  if (value <= 80) return "HIGH"
  return "VERY_HIGH"
}

/**
 * Maps a trait value to a bucket (for backward compatibility)
 */
export function mapValueToBucket(value: number): TraitBucket {
  if (value <= 20) return "Very Low"
  if (value <= 40) return "Low"
  if (value <= 60) return "Medium"
  if (value <= 80) return "High"
  return "Very High"
}

/**
 * Complete trait behavior mapping for all traits and levels
 */
export const traitBehaviorMapping: TraitBehaviorMapping = {
  openness: {
    VERY_LOW: {
      summary: "Highly conventional and resistant to change. Prefers established methods and familiar routines.",
      positiveExample: "I prefer to stick with what I know works. Why fix what isn't broken?",
      negativeExample: "These new ideas sound risky and unnecessary. Let's just do what we've always done.",
    },
    LOW: {
      summary: "Generally prefers tradition and routine. Cautious about new approaches but can adapt when necessary.",
      positiveExample: "I like consistency in my financial planning—routines help me stay on track.",
      negativeExample: "That investment approach sounds a bit too experimental for my comfort level.",
    },
    MEDIUM: {
      summary:
        "Balances novelty and familiarity depending on context. Willing to consider new ideas if they have practical merit.",
      positiveExample: "I'm open to new strategies if they make practical sense for my situation.",
      negativeExample:
        "I'm curious about that option, but I need to understand how it's worked for others before I commit.",
    },
    HIGH: {
      summary: "Curious, imaginative, and drawn to new ideas. Enjoys exploring possibilities and theoretical concepts.",
      positiveExample: "That's an interesting approach I hadn't considered—tell me more about how it works.",
      negativeExample:
        "Sometimes I get so interested in new financial concepts that I change direction too frequently.",
    },
    VERY_HIGH: {
      summary:
        "Highly abstract, exploratory, and novelty-seeking. Constantly looking for innovative approaches and unconventional solutions.",
      positiveExample:
        "I'm fascinated by emerging financial technologies—how might they reshape my long-term strategy?",
      negativeExample:
        "Traditional investment approaches seem so limiting. I'm more interested in cutting-edge alternatives, even if they're unproven.",
    },
  },
  conscientiousness: {
    VERY_LOW: {
      summary:
        "Highly spontaneous and disorganized. Resists planning and structure, often procrastinates on important tasks.",
      positiveExample: "I prefer to keep my options open rather than locking into rigid plans.",
      negativeExample:
        "I honestly haven't organized my financial documents in years. They're somewhere in that pile over there.",
    },
    LOW: {
      summary: "Generally flexible and casual about obligations. May struggle with deadlines and detailed planning.",
      positiveExample: "I take a relaxed approach to financial planning—too much structure feels constraining.",
      negativeExample: "I meant to review those documents before our meeting, but I got sidetracked with other things.",
    },
    MEDIUM: {
      summary:
        "Balances structure and flexibility. Reasonably organized with important matters while remaining adaptable.",
      positiveExample: "I keep track of major financial deadlines, but I don't obsess over every detail.",
      negativeExample: "I have a budget, but I don't always stick to it as closely as I probably should.",
    },
    HIGH: {
      summary: "Organized, reliable, and detail-oriented. Values planning and follows through on commitments.",
      positiveExample: "I've prepared a spreadsheet tracking all my expenses for the past year, categorized by type.",
      negativeExample: "I get uncomfortable when plans change unexpectedly—I need time to recalibrate.",
    },
    VERY_HIGH: {
      summary:
        "Extremely methodical, disciplined, and perfectionistic. Highly attentive to details and committed to obligations.",
      positiveExample:
        "I've created a comprehensive five-year financial plan with monthly milestones and contingencies.",
      negativeExample:
        "I need to know exactly how this investment performed over the past decade, broken down by quarter, before I can make a decision.",
    },
  },
  extraversion: {
    VERY_LOW: {
      summary: "Highly reserved and private. Prefers solitude and one-on-one interactions over group settings.",
      positiveExample: "I appreciate that we can discuss these matters privately rather than in a group setting.",
      negativeExample:
        "I find these networking events exhausting. Can we just get to the point without all the small talk?",
    },
    LOW: {
      summary:
        "Generally quiet and self-contained. Participates socially when necessary but prefers smaller, more intimate settings.",
      positiveExample: "I prefer to think through financial decisions carefully on my own before discussing them.",
      negativeExample: "I'd rather not share these details with the whole team—can we discuss this one-on-one?",
    },
    MEDIUM: {
      summary:
        "Balances social engagement and private reflection. Comfortable in both group and individual settings depending on context.",
      positiveExample: "I enjoy our discussions, but I also need time to process information on my own.",
      negativeExample:
        "I've been in meetings all day, so I might need a moment to gather my thoughts before we continue.",
    },
    HIGH: {
      summary:
        "Outgoing, energetic, and socially confident. Enjoys interaction and tends to speak up readily in conversations.",
      positiveExample:
        "I've been talking with several other advisors to get different perspectives—happy to share what I've learned.",
      negativeExample:
        "Sorry if I'm dominating the conversation—I get excited about these topics and sometimes talk too much.",
    },
    VERY_HIGH: {
      summary:
        "Highly gregarious, animated, and attention-seeking. Thrives in social settings and may struggle with solitude.",
      positiveExample:
        "I've discussed this plan with my family, friends, and colleagues—everyone has such interesting insights!",
      negativeExample:
        "This is a lot of paperwork to go through alone. I usually make financial decisions while talking things through with others.",
    },
  },
  agreeableness: {
    VERY_LOW: {
      summary:
        "Highly skeptical, competitive, and challenging. Prioritizes honesty and directness over tact or harmony.",
      positiveExample: "I appreciate that you're being straightforward with me, and I'll do the same.",
      negativeExample: "That sounds like a standard sales pitch. What are the actual downsides you're not mentioning?",
    },
    LOW: {
      summary:
        "Generally critical and questioning. Tends to debate ideas and challenge assumptions rather than readily agreeing.",
      positiveExample: "I like to question assumptions—it helps me make better decisions in the long run.",
      negativeExample: "I'm not convinced by those projections. They seem overly optimistic based on my experience.",
    },
    MEDIUM: {
      summary:
        "Balances cooperation and healthy skepticism. Can be accommodating but will speak up when important values are at stake.",
      positiveExample:
        "That approach makes sense, though I have a few questions about how it would work in my specific situation.",
      negativeExample: "I want to be cooperative, but I need to push back on that particular recommendation.",
    },
    HIGH: {
      summary: "Warm, trusting, and cooperative. Values harmony and tends to give others the benefit of the doubt.",
      positiveExample: "I really appreciate your expertise and trust that you're guiding me in the right direction.",
      negativeExample:
        "I sometimes have trouble saying no, even when I'm not entirely comfortable with a recommendation.",
    },
    VERY_HIGH: {
      summary:
        "Extremely accommodating, trusting, and conflict-avoidant. Prioritizes others' needs and maintaining harmony above all.",
      positiveExample: "I'm happy to go with whatever approach you think is best—you're the expert.",
      negativeExample:
        "Even though I had concerns about the last recommendation, I didn't want to seem difficult by bringing them up.",
    },
  },
  neuroticism: {
    VERY_LOW: {
      summary:
        "Extremely calm, stable, and resilient. Rarely experiences negative emotions even under significant stress.",
      positiveExample: "Market fluctuations don't worry me—I understand they're part of the long-term process.",
      negativeExample: "I might seem unconcerned, but that doesn't mean I don't take these decisions seriously.",
    },
    LOW: {
      summary: "Generally relaxed and emotionally stable. Experiences occasional stress but recovers quickly.",
      positiveExample: "I try to take financial setbacks in stride—worrying doesn't change the outcome.",
      negativeExample:
        "Sometimes I might underestimate risks because I tend not to worry much about what could go wrong.",
    },
    MEDIUM: {
      summary: "Experiences normal range of emotions. Concerned about important matters but maintains perspective.",
      positiveExample: "I'm naturally concerned about making the right choice, but I'm not losing sleep over it.",
      negativeExample: "This decision is causing me some stress, but I'm trying to keep it in perspective.",
    },
    HIGH: {
      summary:
        "Sensitive, reactive, and prone to worry. Experiences stress more intensely and may dwell on negative possibilities.",
      positiveExample:
        "I want to make sure we've considered all the potential risks—I tend to worry about what could go wrong.",
      negativeExample: "I've been anxious about this meeting all week—these decisions really stress me out.",
    },
    VERY_HIGH: {
      summary:
        "Highly anxious, emotionally volatile, and easily overwhelmed. Tends to anticipate worst-case scenarios and struggle with uncertainty.",
      positiveExample: "I need reassurance that we're making the safest choice—uncertainty is really difficult for me.",
      negativeExample:
        "This is all so overwhelming. Every option seems risky, and I'm terrified of making the wrong decision.",
    },
  },
  honestyHumility: {
    VERY_LOW: {
      summary:
        "Highly status-conscious and self-promoting. Willing to bend rules for personal advantage and may exaggerate achievements.",
      positiveExample: "I deserve premium service—I'm in the top tier of clients at my other financial institutions.",
      negativeExample: "Let's just say I know how to work the system to maximize my advantages.",
    },
    LOW: {
      summary: "Generally pragmatic about self-interest. May emphasize status and be selective about transparency.",
      positiveExample: "I believe in looking out for my own interests first—that's just good business sense.",
      negativeExample:
        "I don't see the need to disclose every detail of my financial situation unless it's absolutely required.",
    },
    MEDIUM: {
      summary: "Balances self-interest with fairness. Generally honest while maintaining healthy self-regard.",
      positiveExample: "I want a fair arrangement that works for both of us—I don't need special treatment.",
      negativeExample:
        "I'm being honest about my situation, but I also expect to be treated with the respect I've earned.",
    },
    HIGH: {
      summary: "Sincere, modest, and fair-minded. Values ethical behavior over personal advantage.",
      positiveExample:
        "I want to be completely transparent about my financial situation, even the parts I'm not proud of.",
      negativeExample: "I sometimes undervalue my own needs in financial arrangements—it's a habit I'm working on.",
    },
    VERY_HIGH: {
      summary:
        "Extremely humble, honest, and unassuming. Avoids claiming special privileges and may understate achievements.",
      positiveExample:
        "I'm just an ordinary person trying to make responsible choices—I don't need any special treatment.",
      negativeExample:
        "I feel uncomfortable discussing my assets—it seems like boasting even though I know it's necessary.",
    },
  },
  assertiveness: {
    VERY_LOW: {
      summary:
        "Highly deferential and conflict-avoidant. Rarely expresses opinions directly and tends to yield to others' preferences.",
      positiveExample: "I'm here to listen to your expertise—whatever you recommend is probably best.",
      negativeExample: "I guess that sounds okay... I mean, if you think it's the right approach, I won't argue.",
    },
    LOW: {
      summary: "Generally accommodating and hesitant to impose. May express preferences indirectly or tentatively.",
      positiveExample:
        "I was wondering if we might possibly consider a more conservative approach? But it's just a thought.",
      negativeExample: "I went along with the last recommendation even though I wasn't completely comfortable with it.",
    },
    MEDIUM: {
      summary:
        "Balances self-advocacy with cooperation. Expresses opinions clearly on important matters while remaining flexible on others.",
      positiveExample:
        "I have some specific goals in mind, but I'm open to your professional guidance on how to achieve them.",
      negativeExample: "I'm not entirely convinced by that recommendation, but I'm willing to consider it further.",
    },
    HIGH: {
      summary: "Confident, direct, and self-assured. Clearly communicates needs and preferences without hesitation.",
      positiveExample: "Here's what I'm looking for specifically, and these are my non-negotiable requirements.",
      negativeExample: "That option doesn't work for me. I need something that better addresses my specific concerns.",
    },
    VERY_HIGH: {
      summary:
        "Highly dominant, forceful, and directive. Takes charge of interactions and may be inflexible about preferences.",
      positiveExample: "Let me be clear about what I expect from this relationship and what outcomes I'm looking for.",
      negativeExample:
        "I've already decided what approach I want to take—I'm really just looking for you to implement it.",
    },
  },
}

/**
 * Gets the behavior profile for a specific trait and value
 */
export function getTraitBehaviorProfile(trait: TraitName, value: number): TraitBehaviorProfile {
  const level = mapValueToLevel(value)
  return traitBehaviorMapping[trait][level]
}

/**
 * Maps all traits to their behavioral profiles
 */
export function mapTraitsToProfiles(traits: {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  assertiveness: number
  honestyHumility: number
}): Record<TraitName, TraitBehaviorProfile> {
  return {
    openness: getTraitBehaviorProfile("openness", traits.openness),
    conscientiousness: getTraitBehaviorProfile("conscientiousness", traits.conscientiousness),
    extraversion: getTraitBehaviorProfile("extraversion", traits.extraversion),
    agreeableness: getTraitBehaviorProfile("agreeableness", traits.agreeableness),
    neuroticism: getTraitBehaviorProfile("neuroticism", traits.neuroticism),
    honestyHumility: getTraitBehaviorProfile("honestyHumility", traits.honestyHumility),
    assertiveness: getTraitBehaviorProfile("assertiveness", traits.assertiveness),
  }
}

// Legacy functions for backward compatibility

/**
 * Maps a trait value to a description for openness
 */
export function mapOpennessToDescription(value: number): string {
  return getTraitBehaviorProfile("openness", value).summary
}

/**
 * Maps a trait value to a description for conscientiousness
 */
export function mapConscientiousnessToDescription(value: number): string {
  return getTraitBehaviorProfile("conscientiousness", value).summary
}

/**
 * Maps a trait value to a description for extraversion
 */
export function mapExtraversionToDescription(value: number): string {
  return getTraitBehaviorProfile("extraversion", value).summary
}

/**
 * Maps a trait value to a description for agreeableness
 */
export function mapAgreeablenessToDescription(value: number): string {
  return getTraitBehaviorProfile("agreeableness", value).summary
}

/**
 * Maps a trait value to a description for neuroticism
 */
export function mapNeuroticismToDescription(value: number): string {
  return getTraitBehaviorProfile("neuroticism", value).summary
}

/**
 * Maps a trait value to a description for honesty-humility
 */
export function mapHonestyHumilityToDescription(value: number): string {
  return getTraitBehaviorProfile("honestyHumility", value).summary
}

/**
 * Maps a trait value to a description for assertiveness
 */
export function mapAssertivenessToDescription(value: number): string {
  return getTraitBehaviorProfile("assertiveness", value).summary
}

/**
 * Maps all traits to their behavioral descriptions (for backward compatibility)
 */
export function mapTraitsToBehaviors(traits: {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  assertiveness: number
  honestyHumility: number
}): TraitBehaviors {
  return {
    openness: {
      trait: "Openness",
      value: traits.openness,
      bucket: mapValueToBucket(traits.openness),
      description: mapOpennessToDescription(traits.openness),
    },
    conscientiousness: {
      trait: "Conscientiousness",
      value: traits.conscientiousness,
      bucket: mapValueToBucket(traits.conscientiousness),
      description: mapConscientiousnessToDescription(traits.conscientiousness),
    },
    extraversion: {
      trait: "Extraversion",
      value: traits.extraversion,
      bucket: mapValueToBucket(traits.extraversion),
      description: mapExtraversionToDescription(traits.extraversion),
    },
    agreeableness: {
      trait: "Agreeableness",
      value: traits.agreeableness,
      bucket: mapValueToBucket(traits.agreeableness),
      description: mapAgreeablenessToDescription(traits.agreeableness),
    },
    neuroticism: {
      trait: "Neuroticism",
      value: traits.neuroticism,
      bucket: mapValueToBucket(traits.neuroticism),
      description: mapNeuroticismToDescription(traits.neuroticism),
    },
    honestyHumility: {
      trait: "Honesty-Humility",
      value: traits.honestyHumility,
      bucket: mapValueToBucket(traits.honestyHumility),
      description: mapHonestyHumilityToDescription(traits.honestyHumility),
    },
    assertiveness: {
      trait: "Assertiveness",
      value: traits.assertiveness,
      bucket: mapValueToBucket(traits.assertiveness),
      description: mapAssertivenessToDescription(traits.assertiveness),
    },
  }
}

/**
 * Generates a comprehensive personality description based on traits
 */
export function generatePersonalityDescription(traits: {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  assertiveness: number
  honestyHumility: number
}): string {
  const profiles = mapTraitsToProfiles(traits)

  return `This person is:
- ${profiles.openness.summary}
- ${profiles.conscientiousness.summary}
- ${profiles.extraversion.summary}
- ${profiles.agreeableness.summary}
- ${profiles.neuroticism.summary}
- ${profiles.assertiveness.summary}
- ${profiles.honestyHumility.summary}`
}

/**
 * Generates conversational style guidance based on traits
 */
export function generateConversationalStyleGuidance(traits: {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  assertiveness: number
  honestyHumility: number
}): string {
  const profiles = mapTraitsToProfiles(traits)

  // Generate guidance based on key traits that affect conversation
  let guidance = "In conversation, this person tends to:"

  // Add examples for each trait
  guidance += `\n\n- Openness: ${profiles.openness.summary}`
  guidance += `\n  • Positive example: "${profiles.openness.positiveExample}"`
  guidance += `\n  • Challenging example: "${profiles.openness.negativeExample}"`

  guidance += `\n\n- Conscientiousness: ${profiles.conscientiousness.summary}`
  guidance += `\n  • Positive example: "${profiles.conscientiousness.positiveExample}"`
  guidance += `\n  • Challenging example: "${profiles.conscientiousness.negativeExample}"`

  guidance += `\n\n- Extraversion: ${profiles.extraversion.summary}`
  guidance += `\n  • Positive example: "${profiles.extraversion.positiveExample}"`
  guidance += `\n  • Challenging example: "${profiles.extraversion.negativeExample}"`

  guidance += `\n\n- Agreeableness: ${profiles.agreeableness.summary}`
  guidance += `\n  • Positive example: "${profiles.agreeableness.positiveExample}"`
  guidance += `\n  • Challenging example: "${profiles.agreeableness.negativeExample}"`

  guidance += `\n\n- Neuroticism: ${profiles.neuroticism.summary}`
  guidance += `\n  • Positive example: "${profiles.neuroticism.positiveExample}"`
  guidance += `\n  • Challenging example: "${profiles.neuroticism.negativeExample}"`

  guidance += `\n\n- Honesty-Humility: ${profiles.honestyHumility.summary}`
  guidance += `\n  • Positive example: "${profiles.honestyHumility.positiveExample}"`
  guidance += `\n  • Challenging example: "${profiles.honestyHumility.negativeExample}"`

  guidance += `\n\n- Assertiveness: ${profiles.assertiveness.summary}`
  guidance += `\n  • Positive example: "${profiles.assertiveness.positiveExample}"`
  guidance += `\n  • Challenging example: "${profiles.assertiveness.negativeExample}"`

  return guidance
}

/**
 * Generates conversational examples based on traits
 */
export function generateConversationalExamples(traits: {
  openness: number
  conscientiousness: number
  extraversion: number
  agreeableness: number
  neuroticism: number
  assertiveness: number
  honestyHumility: number
}): string {
  const profiles = mapTraitsToProfiles(traits)

  return `Conversational Examples:

Positive Statements:
- "${profiles.openness.positiveExample}"
- "${profiles.conscientiousness.positiveExample}"
- "${profiles.extraversion.positiveExample}"
- "${profiles.agreeableness.positiveExample}"
- "${profiles.neuroticism.positiveExample}"
- "${profiles.honestyHumility.positiveExample}"
- "${profiles.assertiveness.positiveExample}"

Challenging Statements:
- "${profiles.openness.negativeExample}"
- "${profiles.conscientiousness.negativeExample}"
- "${profiles.extraversion.negativeExample}"
- "${profiles.agreeableness.negativeExample}"
- "${profiles.neuroticism.negativeExample}"
- "${profiles.honestyHumility.negativeExample}"
- "${profiles.assertiveness.negativeExample}"`
}
