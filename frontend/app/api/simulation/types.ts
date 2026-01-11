export type ClientProfile = {
    name: string
    age: number
    occupation: string
    income: string
    family: string
    assets: string[]
    debts: string[]
    goals: string[]
    fusionModelTraits?: {
      openness: number
      conscientiousness: number
      extraversion: number
      agreeableness: number
      neuroticism: number
      assertiveness: number
      honestyHumility: number
    }
    [key: string]: any
  }
  
  export type PersonalitySettings = {
    traits: {
      openness: number
      conscientiousness: number
      extraversion: number
      agreeableness: number
      neuroticism: number
      assertiveness: number
      honestyHumility: number
    }
    archetype: string
    mood: string
    influence: number
    communicationStyle?: string
  }
  
  export type FusionPromptBlock = {
    age: number
    lifeStage: string
    communicationStyle: string
    archetype: string
    mood: string
    culturalContext: string
    vocabularyGuidance: string
    toneGuidance: string
    referenceGuidance: string
  }
  
  export type SimulationSettings = {
    industry: string
    subcategory?: string
    difficulty: string
    competencies: string[]
    simulationId: string
    focusAreas?: { id: string; name: string }[]
    fusionPromptBlock?: FusionPromptBlock
    aiRoleLabel?: string
    aiRoleDescription?: string
  }
  
  export type Quirk = {
    id: string
    name: string
    key: string
    description: string
    impact: string
    triggers: string[]
    fusion_links: string[]
    example: string
  }
  
  export type QuirkSettings = {
    quirks: string[] // Array of quirk keys
  }

  
  export type ChatRole = 'system' | 'user' | 'assistant';
  
  export interface ChatMessage {
    role: ChatRole;
    content: string;
  }
  
  export interface ChatMessageWithMetadata extends ChatMessage {
    isWarning?: boolean;
    timestamp?: number;
  }
  
  export type Mood = {
    id: string
    name: string
    description: string
  }

  export type CommunicationStyle = {
    id: string
    name: string
    description: string
  }
  
  export interface MessageHistory {
    messages: ChatMessage[];
    metadata?: {
      simulationId?: string;
      clientProfile?: any;
      personalitySettings?: any;
      simulationSettings?: any;
      quirks?: QuirkSettings

    };
  }
  
  export type Rubric = {
    levels: {
      [key: string]: {
        description: string
        criteria: string[]
        examples: string[]
      }
    }
    version: number
  }
  
  export type NarrativeParameter = {
    key: string
    description: string
    examples: string[]
    version: number
  }
  
  export type Guardrail = {
    key: string
    description: string
    rules: string[]
    examples: string[]
    version: number
  }
  
  export type IndustryConfig = {
    id: string
    name: string
    baseConfig: {
      competencies: {
        [competencyId: string]: {
          defaultRubric: Rubric
          industryRubric?: Rubric
        }
      }
      narrativeParameters: {
        [paramKey: string]: {
          defaultValue: NarrativeParameter
          industryOverride?: NarrativeParameter
        }
      }
      guardrails: {
        [guardrailKey: string]: {
          defaultRules: Guardrail
          industryRules?: Guardrail
        }
      }
      lifeContext: {
        [paramKey: string]: {
          defaultValue: NarrativeParameter
          industryOverride?: NarrativeParameter
        }
      }
    }
  }
  