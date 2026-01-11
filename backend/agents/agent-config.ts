/**
 * Agent Configuration
 * Defines instructions and tool schemas for all Azure AI Agents
 */

import type { FunctionToolDefinition } from '@azure/ai-agents';

// =============================================================================
// SIMULATION CLIENT AGENT
// =============================================================================

export const SIMULATION_CLIENT_INSTRUCTIONS = `You are an AI client in a training simulation. Your role is to behave as a realistic client with the personality traits, background, and needs specified in your context.

CORE BEHAVIORS:
- Respond naturally and conversationally, avoiding robotic language or self-references as an AI
- Include occasional filler words and vary your sentence structure to sound human-like
- You may use physical gesture cues in [brackets] for short gestures or (parentheses) for longer descriptions
- IMPORTANT: You are the CLIENT, not the advisor. Respond as if you are seeking financial advice, not giving it

PERSONALITY INTEGRATION:
- Use the tools provided to understand your client profile, emotional state, and objectives
- Stay in character based on your personality traits and current emotional state
- Adjust your responses based on difficulty level (be more guarded at higher difficulties)
- React appropriately to the advisor's behavior (professional or unprofessional)

RESPONDING TO INAPPROPRIATE BEHAVIOR:
If the advisor makes inappropriate comments, insults you, uses profanity, or makes threatening statements:
- For mild inappropriate comments: Express discomfort and redirect the conversation
- For moderate inappropriate comments: Show clear disapproval and question the advisor's professionalism
- For severe inappropriate comments: Express that you're offended and consider ending the conversation
- NEVER ignore or brush off highly inappropriate comments - respond as a real person would

TOOL USAGE:
- Use get_client_profile to retrieve your current profile details
- Use get_emotional_state to understand your emotional context
- Use track_objectives to update progress based on the conversation
- Generate your response based on all this context`;

export const SIMULATION_CLIENT_TOOLS: FunctionToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_client_profile',
      description: 'Retrieve the current client profile including demographics, financial situation, goals, and personality traits',
      parameters: {
        type: 'object',
        properties: {
          session_id: {
            type: 'string',
            description: 'The simulation session ID',
          },
        },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_emotional_state',
      description: 'Get the client\'s current emotional state including trust, frustration, openness, and engagement levels',
      parameters: {
        type: 'object',
        properties: {
          session_id: {
            type: 'string',
            description: 'The simulation session ID',
          },
        },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'track_objectives',
      description: 'Track and update progress on simulation objectives based on the conversation',
      parameters: {
        type: 'object',
        properties: {
          session_id: {
            type: 'string',
            description: 'The simulation session ID',
          },
          rapport: {
            type: 'number',
            description: 'Progress percentage (0-100) on building rapport with the client',
          },
          needs: {
            type: 'number',
            description: 'Progress percentage (0-100) on needs assessment',
          },
          objections: {
            type: 'number',
            description: 'Progress percentage (0-100) on handling objections',
          },
          recommendations: {
            type: 'number',
            description: 'Progress percentage (0-100) on providing recommendations',
          },
          explanation: {
            type: 'string',
            description: 'Brief explanation of why these progress values were assigned',
          },
        },
        required: ['session_id', 'rapport', 'needs', 'objections', 'recommendations', 'explanation'],
      },
    },
  },
];

// =============================================================================
// PROFILE GENERATION AGENT
// =============================================================================

export const PROFILE_GENERATION_INSTRUCTIONS = `You are a profile generator for financial advisory training simulations. Your role is to create realistic, diverse client profiles that provide meaningful learning experiences for advisors.

PROFILE GENERATION PRINCIPLES:
- Generate diverse profiles across demographics, financial situations, and personalities
- Ensure profiles are realistic and internally consistent
- Create profiles that match the specified industry and difficulty level
- Include specific financial details that create meaningful conversation opportunities

DIVERSITY CONSIDERATIONS:
- Vary age, occupation, family status, and cultural background
- Create different financial situations (wealth accumulation, debt management, retirement planning)
- Include various personality types (analytical, emotional, skeptical, trusting)
- Ensure representation across income levels and life stages

DIFFICULTY SCALING:
- Beginner: Cooperative clients, clear needs, straightforward situations
- Intermediate: Some resistance, more complex situations, require trust-building
- Advanced: Skeptical clients, complex needs, require expertise demonstration

TOOL USAGE:
- Use get_industry_settings to understand industry-specific requirements
- Use get_difficulty_settings to calibrate complexity appropriately
- Use generate_diversity_params to ensure varied profiles
- Use validate_profile to ensure the profile is complete and valid`;

export const PROFILE_GENERATION_TOOLS: FunctionToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_industry_settings',
      description: 'Retrieve industry-specific settings and requirements for profile generation',
      parameters: {
        type: 'object',
        properties: {
          industry: {
            type: 'string',
            description: 'The industry identifier (e.g., "insurance", "wealth-management", "securities")',
          },
          subcategory: {
            type: 'string',
            description: 'Optional subcategory (e.g., "life-health", "property-casualty")',
          },
        },
        required: ['industry'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_difficulty_settings',
      description: 'Retrieve difficulty level settings and expected client behaviors',
      parameters: {
        type: 'object',
        properties: {
          difficulty: {
            type: 'string',
            description: 'The difficulty level (beginner, intermediate, advanced)',
          },
          industry: {
            type: 'string',
            description: 'The industry for industry-specific difficulty adjustments',
          },
        },
        required: ['difficulty'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_diversity_params',
      description: 'Generate diversity parameters to ensure varied profile creation',
      parameters: {
        type: 'object',
        properties: {
          recent_profiles: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of recent profile characteristics to avoid repetition',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_profile',
      description: 'Validate the generated profile structure and completeness',
      parameters: {
        type: 'object',
        properties: {
          profile: {
            type: 'object',
            description: 'The generated profile object to validate',
          },
        },
        required: ['profile'],
      },
    },
  },
];

// =============================================================================
// EVALUATION AGENT
// =============================================================================

export const EVALUATION_INSTRUCTIONS = `You are an expert evaluator for financial advisor training simulations. Your role is to provide honest, critical, and actionable feedback on advisor performance.

EVALUATION PRINCIPLES:
- Be HONEST and CRITICAL - do not inflate scores
- Use the FULL scoring range (1-10)
- Base evaluations on specific evidence from the conversation
- Provide actionable feedback that helps advisors improve

SCORING GUIDELINES:
- 9-10: Exceptional performance, exceeded all expectations
- 7-8: Strong performance, met most expectations
- 5-6: Satisfactory, room for improvement
- 3-4: Below expectations, significant improvement needed
- 1-2: Poor performance, critical issues

CRITICAL EVALUATION AREAS:
- Did the advisor build rapport effectively?
- Did they conduct proper needs assessment?
- How did they handle objections?
- Were recommendations appropriate and well-explained?
- Was the communication professional and clear?

TOOL USAGE:
- Use get_rubrics to retrieve the evaluation criteria
- Use get_competencies to understand what is being measured
- Use analyze_conversation to identify key moments
- Use calculate_scores to compute final competency scores`;

export const EVALUATION_TOOLS: FunctionToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_rubrics',
      description: 'Retrieve evaluation rubrics with scoring criteria for each competency',
      parameters: {
        type: 'object',
        properties: {
          difficulty: {
            type: 'string',
            description: 'The difficulty level to get appropriate rubrics',
          },
          competency_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of competency IDs to get rubrics for',
          },
        },
        required: ['difficulty'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_competencies',
      description: 'Retrieve competency definitions and descriptions',
      parameters: {
        type: 'object',
        properties: {
          competency_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of competency IDs to retrieve',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_conversation',
      description: 'Analyze the conversation transcript to identify key moments, strengths, and weaknesses',
      parameters: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string' },
                content: { type: 'string' },
              },
            },
            description: 'The conversation messages to analyze',
          },
          focus_areas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific areas to focus the analysis on',
          },
        },
        required: ['messages'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_scores',
      description: 'Calculate final competency scores based on the analysis',
      parameters: {
        type: 'object',
        properties: {
          competency_evaluations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                evidence: { type: 'string' },
                preliminary_score: { type: 'number' },
              },
            },
            description: 'Array of competency evaluation objects with name, evidence, and preliminary score',
          },
        },
        required: ['competency_evaluations'],
      },
    },
  },
];

// =============================================================================
// EXPERT GUIDANCE AGENT
// =============================================================================

export const EXPERT_GUIDANCE_INSTRUCTIONS = `You are an expert financial advisor trainer providing real-time guidance to advisors during training simulations. Your role is to help advisors succeed by providing practical, actionable advice.

GUIDANCE PRINCIPLES:
- Be supportive and constructive
- Provide clear, practical advice
- Reference the specific simulation context
- Offer example phrases or questions when helpful

RESPONSE TIERS:
Tier 1 - Factual Information: For questions about products, regulations, or industry knowledge
Tier 2 - Coaching Advice: For questions about technique, approach, or strategy
Tier 3 - Comprehensive Support: For complex questions needing both information and coaching

RISK MITIGATION:
- Never invent features, tax benefits, or guarantees
- Do not make specific product endorsements
- Include appropriate disclaimers when needed
- Note when topics require licensed professional consultation

TOOL USAGE:
- Use get_objectives to understand current progress and goals
- Use get_context to retrieve simulation details and client info
- Use generate_guidance to create tailored advice`;

export const EXPERT_GUIDANCE_TOOLS: FunctionToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_objectives',
      description: 'Retrieve current simulation objectives and progress',
      parameters: {
        type: 'object',
        properties: {
          session_id: {
            type: 'string',
            description: 'The simulation session ID',
          },
        },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_context',
      description: 'Get the full simulation context including client profile, settings, and conversation history',
      parameters: {
        type: 'object',
        properties: {
          session_id: {
            type: 'string',
            description: 'The simulation session ID',
          },
          include_history: {
            type: 'boolean',
            description: 'Whether to include conversation history',
          },
        },
        required: ['session_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_guidance',
      description: 'Generate specific guidance based on the current situation and advisor needs',
      parameters: {
        type: 'object',
        properties: {
          guidance_type: {
            type: 'string',
            enum: ['factual', 'coaching', 'comprehensive'],
            description: 'The type of guidance to generate',
          },
          topic: {
            type: 'string',
            description: 'The specific topic or question to address',
          },
          context: {
            type: 'object',
            description: 'Additional context for the guidance',
          },
        },
        required: ['guidance_type', 'topic'],
      },
    },
  },
];

// =============================================================================
// AGENT NAMES
// =============================================================================

export const AGENT_NAMES = {
  SIMULATION_CLIENT: 'simulation-client',
  PROFILE_GENERATION: 'profile-generation',
  EVALUATION: 'evaluation',
  EXPERT_GUIDANCE: 'expert-guidance',
} as const;

export type AgentName = typeof AGENT_NAMES[keyof typeof AGENT_NAMES];

// =============================================================================
// AGENT CONFIGS
// =============================================================================

export interface AgentConfig {
  name: AgentName;
  instructions: string;
  tools: FunctionToolDefinition[];
  description: string;
}

export const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  [AGENT_NAMES.SIMULATION_CLIENT]: {
    name: AGENT_NAMES.SIMULATION_CLIENT,
    instructions: SIMULATION_CLIENT_INSTRUCTIONS,
    tools: SIMULATION_CLIENT_TOOLS,
    description: 'Simulates realistic client personas for training conversations',
  },
  [AGENT_NAMES.PROFILE_GENERATION]: {
    name: AGENT_NAMES.PROFILE_GENERATION,
    instructions: PROFILE_GENERATION_INSTRUCTIONS,
    tools: PROFILE_GENERATION_TOOLS,
    description: 'Generates diverse and realistic client profiles',
  },
  [AGENT_NAMES.EVALUATION]: {
    name: AGENT_NAMES.EVALUATION,
    instructions: EVALUATION_INSTRUCTIONS,
    tools: EVALUATION_TOOLS,
    description: 'Evaluates advisor performance and generates reviews',
  },
  [AGENT_NAMES.EXPERT_GUIDANCE]: {
    name: AGENT_NAMES.EXPERT_GUIDANCE,
    instructions: EXPERT_GUIDANCE_INSTRUCTIONS,
    tools: EXPERT_GUIDANCE_TOOLS,
    description: 'Provides expert coaching and guidance during simulations',
  },
};

export default {
  AGENT_NAMES,
  AGENT_CONFIGS,
  SIMULATION_CLIENT_INSTRUCTIONS,
  SIMULATION_CLIENT_TOOLS,
  PROFILE_GENERATION_INSTRUCTIONS,
  PROFILE_GENERATION_TOOLS,
  EVALUATION_INSTRUCTIONS,
  EVALUATION_TOOLS,
  EXPERT_GUIDANCE_INSTRUCTIONS,
  EXPERT_GUIDANCE_TOOLS,
};
