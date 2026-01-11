/**
 * Fusion Model Service
 * Business logic for fusion model (combining multiple AI models/approaches)
 */

import { aiService, ChatMessage } from './ai-service.ts';
import { parameterRepository } from '../db/repositories/parameter-repository.ts';
import { competencyRepository } from '../db/repositories/competency-repository.ts';

export interface FusionModelResponse {
  response: string;
  confidence: number;
  sources: string[];
  metadata?: any;
}

export class FusionModelService {
  /**
   * Generate response using fusion model approach
   */
  async generateFusedResponse(
    conversationHistory: ChatMessage[],
    clientProfile: any,
    context: any
  ): Promise<FusionModelResponse> {
    try {
      // Get fusion model parameters
      const parameters = await this.getFusionParameters();

      // Generate response using primary AI service
      const aiResponse = await aiService.generateClientResponse(
        conversationHistory,
        clientProfile,
        parameters
      );

      // In a full implementation, this would combine multiple models/approaches
      // For now, return the AI response with metadata
      return {
        response: aiResponse.message,
        confidence: 0.85,
        sources: ['gpt-4'],
        metadata: {
          tokenUsage: aiResponse.tokenUsage,
        },
      };
    } catch (error) {
      console.error('Error generating fused response:', error);
      throw error;
    }
  }

  /**
   * Evaluate using fusion approach (multiple evaluation methods)
   */
  async evaluateWithFusion(
    conversationHistory: ChatMessage[],
    simulationId: string
  ): Promise<{
    scores: Record<string, number>;
    overallScore: number;
    feedback: string;
    evaluationSources: string[];
  }> {
    try {
      // Get competencies for evaluation
      const competencies = await competencyRepository.findAll();

      // Generate AI evaluation
      const aiEvaluation = await aiService.generateEvaluation(
        conversationHistory,
        competencies,
        []
      );

      // In full implementation, would combine multiple evaluation sources
      // (AI, rule-based, rubric-based, etc.)
      return {
        scores: aiEvaluation.competencyScores,
        overallScore: aiEvaluation.overallScore,
        feedback: aiEvaluation.feedback,
        evaluationSources: ['ai-evaluation'],
      };
    } catch (error) {
      console.error('Error evaluating with fusion:', error);
      throw error;
    }
  }

  /**
   * Generate hybrid response (AI + rules + templates)
   */
  async generateHybridResponse(
    conversationHistory: ChatMessage[],
    clientProfile: any,
    triggers?: string[]
  ): Promise<FusionModelResponse> {
    try {
      // Check for rule-based triggers
      const ruleResponse = this.checkRuleTriggers(conversationHistory, triggers);

      if (ruleResponse) {
        return {
          response: ruleResponse,
          confidence: 1.0,
          sources: ['rule-based'],
        };
      }

      // Fall back to AI response
      const aiResponse = await aiService.generateClientResponse(
        conversationHistory,
        clientProfile
      );

      return {
        response: aiResponse.message,
        confidence: 0.85,
        sources: ['ai'],
        metadata: {
          tokenUsage: aiResponse.tokenUsage,
        },
      };
    } catch (error) {
      console.error('Error generating hybrid response:', error);
      throw error;
    }
  }

  /**
   * Get fusion model parameters
   */
  private async getFusionParameters(): Promise<any> {
    try {
      const params = await parameterRepository.findAll();

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
      console.error('Error getting fusion parameters:', error);
      return {};
    }
  }

  /**
   * Check for rule-based triggers
   */
  private checkRuleTriggers(
    conversationHistory: ChatMessage[],
    triggers?: string[]
  ): string | null {
    if (!triggers || triggers.length === 0) {
      return null;
    }

    const lastMessage = conversationHistory[conversationHistory.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return null;
    }

    const content = lastMessage.content.toLowerCase();

    // Simple rule-based checks
    if (triggers.includes('greeting') && (content.includes('hello') || content.includes('hi'))) {
      return 'Hello! How can I help you today?';
    }

    if (triggers.includes('closing') && (content.includes('goodbye') || content.includes('bye'))) {
      return 'Thank you for our conversation. Have a great day!';
    }

    return null;
  }

  /**
   * Combine multiple model outputs
   */
  private combineModelOutputs(outputs: string[]): string {
    // Simple implementation - could use more sophisticated combination logic
    // For now, just return the first output
    return outputs[0] || '';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(sources: string[], agreement: number): number {
    // Simple confidence calculation
    // In full implementation, would use more sophisticated metrics
    const sourceWeight = sources.length > 1 ? 0.9 : 0.8;
    return sourceWeight * agreement;
  }
}

// Export singleton instance
export const fusionModelService = new FusionModelService();
