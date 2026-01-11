/**
 * AI Service
 * Business logic for AI interactions
 * Supports Azure AI Agents with OpenAI fallback
 */

import OpenAI from 'openai';
import { parameterRepository } from '../db/repositories/parameter-repository.ts';
import { isAzureConfigured, isOpenAIConfigured } from '../config/index.ts';
import {
  areAgentsAvailable,
  simulationClientAgent,
  profileGenerationAgent,
  evaluationAgent,
  type SimulationContext,
} from '../agents/index.ts';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  message: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  source?: 'azure' | 'openai';
  objectiveProgress?: {
    rapport: number;
    needs: number;
    objections: number;
    recommendations: number;
    explanation?: string;
  };
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    if (!isOpenAIConfigured() && !isAzureConfigured()) {
      console.warn('Neither OPENAI_API_KEY nor AZURE_AI_PROJECT_ENDPOINT is set. AI features will not work.');
    } else if (!isOpenAIConfigured()) {
      console.warn('OPENAI_API_KEY not set. Fallback to OpenAI will not work.');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Check if Azure agents should be used
   */
  private shouldUseAzure(): boolean {
    return isAzureConfigured() && areAgentsAvailable();
  }

  /**
   * Generate AI client response for simulation
   * Uses Azure agents when available, falls back to OpenAI
   */
  async generateClientResponse(
    conversationHistory: ChatMessage[],
    clientProfile: any,
    contextParameters?: any
  ): Promise<AIResponse> {
    // Try Azure agents first
    if (this.shouldUseAzure()) {
      try {
        console.log('[AIService] Using Azure agent for client response');
        const context: SimulationContext = {
          sessionId: contextParameters?.sessionId || `session-${Date.now()}`,
          clientProfile,
          personalitySettings: contextParameters?.personalitySettings || {
            mood: 'neutral',
            archetype: 'Standard Client',
            traits: { openness: 50, agreeableness: 50, conscientiousness: 50, neuroticism: 50, extraversion: 50 },
            influence: 'balanced',
          },
          simulationSettings: contextParameters?.simulationSettings || {
            industry: 'insurance',
            difficulty: 'beginner',
          },
          emotionalState: contextParameters?.emotionalState,
        };

        const result = await simulationClientAgent.generateResponse(conversationHistory, context);

        if (result.success) {
          return {
            message: result.message,
            source: 'azure',
            objectiveProgress: result.objectiveProgress,
          };
        }

        console.warn('[AIService] Azure agent failed, falling back to OpenAI');
      } catch (error) {
        console.error('[AIService] Azure agent error:', error);
        console.warn('[AIService] Falling back to OpenAI');
      }
    }

    // Fallback to OpenAI
    try {
      // Get AI parameters from database
      const parameters = await this.getAIParameters();

      // Build system prompt with client profile
      const systemPrompt = this.buildSystemPrompt(clientProfile, parameters);

      // Prepare messages
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ];

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: parameters.model || 'gpt-4',
        messages: messages as any,
        temperature: parameters.temperature || 0.7,
        max_tokens: parameters.max_tokens || 500,
        top_p: parameters.top_p || 1.0,
        frequency_penalty: parameters.frequency_penalty || 0.0,
        presence_penalty: parameters.presence_penalty || 0.0,
      });

      const message = response.choices[0]?.message?.content || '';
      const tokenUsage = response.usage ? {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      } : undefined;

      return {
        message,
        tokenUsage,
        source: 'openai',
      };
    } catch (error) {
      console.error('Error generating client response:', error);
      throw error;
    }
  }

  /**
   * Generate evaluation/feedback
   * Uses Azure agents when available, falls back to OpenAI
   */
  async generateEvaluation(
    conversationHistory: ChatMessage[],
    competencies: any[],
    rubrics: any[],
    difficulty?: string
  ): Promise<{
    overallScore: number;
    competencyScores: Record<string, number>;
    feedback: string;
    strengths: string[];
    improvements: string[];
    source?: 'azure' | 'openai';
  }> {
    // Try Azure agents first
    if (this.shouldUseAzure()) {
      try {
        console.log('[AIService] Using Azure agent for evaluation');
        const result = await evaluationAgent.generateReview({
          messages: conversationHistory,
          competencies,
          difficulty: difficulty || 'beginner',
          rubrics,
        });

        if (result.success && result.review) {
          // Transform competency scores from object to numeric values
          const competencyScores: Record<string, number> = {};
          for (const [name, data] of Object.entries(result.review.competencyScores)) {
            competencyScores[name] = (data as any).score;
          }

          return {
            overallScore: result.review.overallScore,
            competencyScores,
            feedback: result.review.detailedFeedback,
            strengths: result.review.strengths,
            improvements: result.review.areasForImprovement,
            source: 'azure',
          };
        }

        console.warn('[AIService] Azure agent failed, falling back to OpenAI');
      } catch (error) {
        console.error('[AIService] Azure agent error:', error);
        console.warn('[AIService] Falling back to OpenAI');
      }
    }

    // Fallback to OpenAI
    try {
      // Build evaluation prompt
      const evaluationPrompt = this.buildEvaluationPrompt(competencies, rubrics);

      const messages: ChatMessage[] = [
        { role: 'system', content: evaluationPrompt },
        { role: 'user', content: `Please evaluate this conversation:\n\n${JSON.stringify(conversationHistory)}` },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        temperature: 0.3,
        max_tokens: 1000,
      });

      const evaluationText = response.choices[0]?.message?.content || '';

      // Parse evaluation (in production, you'd want structured output)
      return {
        ...this.parseEvaluation(evaluationText, competencies),
        source: 'openai',
      };
    } catch (error) {
      console.error('Error generating evaluation:', error);
      throw error;
    }
  }

  /**
   * Generate client profile
   * Uses Azure agents when available, falls back to OpenAI
   */
  async generateClientProfile(
    industry: string,
    difficultyLevel: number | string,
    parameters?: any
  ): Promise<any> {
    const difficultyString = typeof difficultyLevel === 'number'
      ? (difficultyLevel <= 1 ? 'beginner' : difficultyLevel <= 2 ? 'intermediate' : 'advanced')
      : difficultyLevel;

    // Try Azure agents first
    if (this.shouldUseAzure()) {
      try {
        console.log('[AIService] Using Azure agent for profile generation');
        const result = await profileGenerationAgent.generateProfile({
          industry,
          difficulty: difficultyString,
          subcategory: parameters?.subcategory,
          focusAreas: parameters?.focusAreas,
        });

        if (result.success && result.profile) {
          return {
            ...result.profile,
            source: 'azure',
          };
        }

        console.warn('[AIService] Azure agent failed, falling back to OpenAI');
      } catch (error) {
        console.error('[AIService] Azure agent error:', error);
        console.warn('[AIService] Falling back to OpenAI');
      }
    }

    // Fallback to OpenAI
    try {
      const prompt = `Generate a realistic client profile for a ${industry} simulation at difficulty level ${difficultyString}. Include:
- Name
- Age
- Occupation
- Financial situation
- Goals
- Personality traits
- Communication style
- Specific challenges or concerns

Return as JSON.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a profile generator for financial advisory simulations.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
      });

      const profileText = response.choices[0]?.message?.content || '{}';

      try {
        return {
          ...JSON.parse(profileText),
          source: 'openai',
        };
      } catch {
        // If parsing fails, return structured fallback
        return {
          name: 'Generated Client',
          profile: profileText,
          source: 'openai',
        };
      }
    } catch (error) {
      console.error('Error generating client profile:', error);
      throw error;
    }
  }

  /**
   * Generate conversation starter
   */
  async generateConversationStarter(clientProfile: any): Promise<string> {
    try {
      const prompt = `Given this client profile, generate a realistic opening message from the client starting the conversation with their financial advisor:

${JSON.stringify(clientProfile, null, 2)}

The message should be natural and reflect the client's personality and concerns.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are roleplaying as a financial advisory client.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || 'Hello, I\'d like to discuss my financial situation.';
    } catch (error) {
      console.error('Error generating conversation starter:', error);
      throw error;
    }
  }

  /**
   * Moderate content for safety
   */
  async moderateContent(text: string): Promise<{
    flagged: boolean;
    categories: string[];
  }> {
    try {
      const response = await this.openai.moderations.create({
        input: text,
      });

      const result = response.results[0];
      const flaggedCategories: string[] = [];

      if (result.flagged) {
        for (const [category, flagged] of Object.entries(result.categories)) {
          if (flagged) {
            flaggedCategories.push(category);
          }
        }
      }

      return {
        flagged: result.flagged,
        categories: flaggedCategories,
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }

  /**
   * Build system prompt for client
   */
  private buildSystemPrompt(clientProfile: any, parameters: any): string {
    const basePrompt = parameters.system_prompt || 'You are roleplaying as a financial advisory client.';

    const profileSection = `
Client Profile:
${JSON.stringify(clientProfile, null, 2)}

Roleplay as this client. Stay in character. Respond naturally based on the client's personality, goals, and concerns.`;

    return `${basePrompt}\n\n${profileSection}`;
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(competencies: any[], rubrics: any[]): string {
    const competencyList = competencies.map(c => `- ${c.name}: ${c.description}`).join('\n');
    const rubricList = rubrics.map(r => `- ${r.criteria} (weight: ${r.weight})`).join('\n');

    return `You are an expert evaluator for financial advisory simulations.

Evaluate the advisor's performance based on these competencies:
${competencyList}

Using these rubrics:
${rubricList}

Provide:
1. Overall score (0-100)
2. Score for each competency (0-100)
3. Overall feedback (2-3 paragraphs)
4. Key strengths (bullet points)
5. Areas for improvement (bullet points)

Return as structured text.`;
  }

  /**
   * Parse evaluation response
   */
  private parseEvaluation(
    evaluationText: string,
    competencies: any[]
  ): {
    overallScore: number;
    competencyScores: Record<string, number>;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } {
    // In production, you'd want more robust parsing or structured output from OpenAI
    // For now, return defaults
    const competencyScores: Record<string, number> = {};
    competencies.forEach(c => {
      competencyScores[c.name] = 75; // Default score
    });

    return {
      overallScore: 75,
      competencyScores,
      feedback: evaluationText,
      strengths: ['Good communication', 'Professional demeanor'],
      improvements: ['More probing questions', 'Better needs assessment'],
    };
  }

  /**
   * Get AI parameters from database
   */
  private async getAIParameters(): Promise<any> {
    try {
      const params = await parameterRepository.findByType('structured');

      // Convert parameter array to object
      const paramObj: any = {};
      params.forEach(p => {
        try {
          paramObj[p.name] = typeof p.value === 'string' ? JSON.parse(p.value) : p.value;
        } catch {
          paramObj[p.name] = p.value;
        }
      });

      return paramObj;
    } catch (error) {
      console.error('Error getting AI parameters:', error);
      // Return defaults
      return {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      };
    }
  }

  /**
   * Test OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return !!response.choices[0]?.message;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
