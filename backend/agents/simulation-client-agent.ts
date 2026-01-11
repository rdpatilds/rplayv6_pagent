/**
 * Simulation Client Agent
 * Simulates realistic client personas in training conversations
 */

import { BaseAgent, ChatMessage, AgentResponse, ToolHandler } from './base-agent.js';
import { AGENT_NAMES } from './agent-config.js';

export interface ClientProfile {
  name: string;
  age: number;
  occupation: string;
  income: string;
  family: string;
  assets?: string[];
  debts?: string[];
  goals?: string[];
  fusionModelTraits?: Record<string, number>;
}

export interface EmotionalState {
  trust: number;
  frustration: number;
  openness: number;
  engagement: number;
  flags?: {
    veryLowTrust?: boolean;
    highFrustration?: boolean;
    lowOpenness?: boolean;
  };
}

export interface ObjectiveProgress {
  rapport: number;
  needs: number;
  objections: number;
  recommendations: number;
  explanation?: string;
}

export interface SimulationContext {
  sessionId: string;
  clientProfile: ClientProfile;
  personalitySettings: {
    mood: string;
    archetype: string;
    traits: Record<string, number>;
    influence: string;
    communicationStyle?: string;
  };
  simulationSettings: {
    industry: string;
    subcategory?: string;
    difficulty: string;
    competencies?: string[];
    focusAreas?: Array<{ id: string; name: string }>;
  };
  emotionalState?: EmotionalState;
  objectives?: ObjectiveProgress;
}

// In-memory context store (in production, use Redis or database)
const contextStore = new Map<string, SimulationContext>();

/**
 * Simulation Client Agent Implementation
 */
export class SimulationClientAgent extends BaseAgent {
  constructor() {
    super(AGENT_NAMES.SIMULATION_CLIENT);
  }

  /**
   * Register tool handlers
   */
  protected registerToolHandlers(): void {
    this.toolHandlers.set('get_client_profile', this.handleGetClientProfile.bind(this));
    this.toolHandlers.set('get_emotional_state', this.handleGetEmotionalState.bind(this));
    this.toolHandlers.set('track_objectives', this.handleTrackObjectives.bind(this));
  }

  /**
   * Tool: Get client profile
   */
  private async handleGetClientProfile(args: { session_id: string }): Promise<ClientProfile | { error: string }> {
    const context = contextStore.get(args.session_id);
    if (!context) {
      return { error: `Session not found: ${args.session_id}` };
    }
    return context.clientProfile;
  }

  /**
   * Tool: Get emotional state
   */
  private async handleGetEmotionalState(args: { session_id: string }): Promise<EmotionalState> {
    const context = contextStore.get(args.session_id);
    if (!context || !context.emotionalState) {
      // Return default emotional state
      return {
        trust: 50,
        frustration: 0,
        openness: 50,
        engagement: 50,
      };
    }
    return context.emotionalState;
  }

  /**
   * Tool: Track objectives
   */
  private async handleTrackObjectives(args: {
    session_id: string;
    rapport: number;
    needs: number;
    objections: number;
    recommendations: number;
    explanation: string;
  }): Promise<{ success: boolean; objectives: ObjectiveProgress }> {
    const context = contextStore.get(args.session_id);
    const objectives: ObjectiveProgress = {
      rapport: args.rapport,
      needs: args.needs,
      objections: args.objections,
      recommendations: args.recommendations,
      explanation: args.explanation,
    };

    if (context) {
      context.objectives = objectives;
      contextStore.set(args.session_id, context);
    }

    return { success: true, objectives };
  }

  /**
   * Set simulation context for a session
   */
  setContext(sessionId: string, context: SimulationContext): void {
    context.sessionId = sessionId;
    contextStore.set(sessionId, context);
  }

  /**
   * Get simulation context for a session
   */
  getContext(sessionId: string): SimulationContext | undefined {
    return contextStore.get(sessionId);
  }

  /**
   * Clear simulation context for a session
   */
  clearContext(sessionId: string): void {
    contextStore.delete(sessionId);
  }

  /**
   * Update emotional state for a session
   */
  updateEmotionalState(sessionId: string, state: Partial<EmotionalState>): void {
    const context = contextStore.get(sessionId);
    if (context) {
      context.emotionalState = {
        ...(context.emotionalState || { trust: 50, frustration: 0, openness: 50, engagement: 50 }),
        ...state,
      };
      contextStore.set(sessionId, context);
    }
  }

  /**
   * Generate client response with context
   */
  async generateResponse(
    messages: ChatMessage[],
    simulationContext: SimulationContext
  ): Promise<AgentResponse & { objectiveProgress?: ObjectiveProgress }> {
    // Store context for tool access
    this.setContext(simulationContext.sessionId, simulationContext);

    // Build enhanced context for the agent
    const enhancedContext = {
      sessionId: simulationContext.sessionId,
      clientProfile: simulationContext.clientProfile,
      personality: simulationContext.personalitySettings,
      industry: simulationContext.simulationSettings.industry,
      subcategory: simulationContext.simulationSettings.subcategory,
      difficulty: simulationContext.simulationSettings.difficulty,
      focusAreas: simulationContext.simulationSettings.focusAreas,
      emotionalState: simulationContext.emotionalState,
      difficultyGuidelines: this.getDifficultyGuidelines(simulationContext.simulationSettings.difficulty),
    };

    // Call base chat method
    const response = await this.chat(messages, enhancedContext);

    // Extract objective progress from tool calls
    let objectiveProgress: ObjectiveProgress | undefined;
    const objectiveCall = response.toolCalls?.find(tc => tc.name === 'track_objectives');
    if (objectiveCall?.result?.objectives) {
      objectiveProgress = objectiveCall.result.objectives;
    } else {
      // Get from context if updated during the run
      const updatedContext = this.getContext(simulationContext.sessionId);
      objectiveProgress = updatedContext?.objectives;
    }

    return {
      ...response,
      objectiveProgress,
    };
  }

  /**
   * Get difficulty guidelines for prompting
   */
  private getDifficultyGuidelines(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return `Be friendly, cooperative, and open. Provide information readily when asked. You have basic financial knowledge but need explanations for industry-specific concepts. Share your financial details, family situation, and goals when asked directly.`;
      case 'intermediate':
        return `Be somewhat reserved and hesitant to share all information immediately. Some financial details and goals should only be revealed when asked specifically or when trust is established. You have moderate financial knowledge. Do not volunteer detailed financial information unless specifically asked.`;
      case 'advanced':
        return `Be skeptical, challenging, and resistant initially. Question recommendations, raise objections, and only reveal sensitive information after significant trust-building. You have substantial financial knowledge but may have misconceptions that need correction. Be very guarded with information and require the advisor to demonstrate expertise before opening up.`;
      default:
        return `Be friendly and cooperative, with a balanced approach to sharing information.`;
    }
  }
}

// Export singleton instance
export const simulationClientAgent = new SimulationClientAgent();

export default simulationClientAgent;
