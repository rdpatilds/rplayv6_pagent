/**
 * Simulation Service
 * Business logic for simulation operations
 */

import { simulationRepository } from '../db/repositories/simulation-repository.ts';
import type { SimulationSession } from '../db/repositories/simulation-repository.ts';
import { competencyRepository } from '../db/repositories/competency-repository.ts';
import { rubricRepository } from '../db/repositories/rubric-repository.ts';
import { feedbackRepository } from '../db/repositories/feedback-repository.ts';
import { engagementRepository } from '../db/repositories/engagement-repository.ts';
import type { SimulationData, StartSimulationRequest } from "@shared/types/api.types";

export interface SimulationWithDetails extends SimulationSession {
  competencies?: any[];
  rubrics?: any[];
  feedback?: any[];
}

export interface SimulationScore {
  overall: number;
  byCompetency: Record<string, number>;
  breakdown: Array<{
    competency: string;
    score: number;
    feedback: string;
  }>;
}

export class SimulationService {
  /**
   * Get simulation by ID
   */
  async getSimulationById(simulationId: string): Promise<SimulationSession | null> {
    try {
      return await simulationRepository.findById(simulationId);
    } catch (error) {
      console.error('Error getting simulation by ID:', error);
      throw error;
    }
  }

  /**
   * Get simulation by ID with full details
   */
  async getSimulationWithDetails(simulationId: string): Promise<SimulationWithDetails | null> {
    try {
      const simulation = await simulationRepository.findById(simulationId);
      if (!simulation) {
        return null;
      }

      // Try to get associated competencies (optional - may not exist)
      let competencies: any[] = [];
      try {
        competencies = await competencyRepository.findByIndustry(simulation.industry);
        console.log(`[GET SIMULATION DETAILS] Found ${competencies.length} competencies for ${simulation.industry}`);
      } catch (error: any) {
        console.warn(`[GET SIMULATION DETAILS] Could not fetch competencies (table may not exist):`, error.message);
        // Continue without competencies
      }

      // Try to get rubrics for this difficulty level (optional - may not exist)
      let rubrics: any[] = [];
      try {
        // Map difficulty text to number for rubric lookup (beginner=1, intermediate=3, advanced=5)
        const difficultyMap: Record<string, number> = {
          'beginner': 1,
          'intermediate': 3,
          'advanced': 5
        };
        const difficultyLevel = difficultyMap[(simulation as any).difficulty] || 1;
        rubrics = await rubricRepository.findByDifficultyLevel(difficultyLevel);
        console.log(`[GET SIMULATION DETAILS] Found ${rubrics.length} rubrics for difficulty ${difficultyLevel}`);
      } catch (error: any) {
        console.warn(`[GET SIMULATION DETAILS] Could not fetch rubrics (table may not exist):`, error.message);
        // Continue without rubrics
      }

      // Try to get feedback for this simulation (optional - may not exist yet)
      let feedback: any[] = [];
      try {
        feedback = await feedbackRepository.findBySimulationId(simulationId);
        console.log(`[GET SIMULATION DETAILS] Found ${feedback.length} feedback entries`);
      } catch (error: any) {
        console.warn(`[GET SIMULATION DETAILS] Could not fetch feedback:`, error.message);
        // Continue without feedback
      }

      return {
        ...simulation,
        competencies,
        rubrics,
        feedback,
      };
    } catch (error) {
      console.error('Error getting simulation with details:', error);
      throw error;
    }
  }

  /**
   * Get simulations by user ID
   */
  async getUserSimulations(userId: string): Promise<SimulationSession[]> {
    try {
      return await simulationRepository.findByUserId(userId);
    } catch (error) {
      console.error('Error getting user simulations:', error);
      throw error;
    }
  }

  /**
   * Get all simulations
   */
  async getAllSimulations(limit?: number): Promise<SimulationSession[]> {
    try {
      return await simulationRepository.findAll(limit);
    } catch (error) {
      console.error('Error getting all simulations:', error);
      throw error;
    }
  }

  /**
   * Start new simulation
   */
  async startSimulation(startData: StartSimulationRequest): Promise<SimulationSession> {
    try {
      // Validate industry and difficulty level
      if (!this.isValidIndustry(startData.industry)) {
        throw new Error('Invalid industry');
      }

      // Convert difficulty_level to text if it's a number, or use as-is if it's text
      const difficulty = typeof startData.difficulty_level === 'number'
        ? (['beginner', 'intermediate', 'advanced'][Math.min(Math.max(startData.difficulty_level - 1, 0), 2)] || 'beginner')
        : (startData.difficulty_level as any);

      // Try to get competencies for this industry (optional - may not exist)
      let competencies: any[] = [];
      try {
        competencies = await competencyRepository.findByIndustry(startData.industry);
        console.log(`[START SIMULATION] Found ${competencies.length} competencies for ${startData.industry}`);
      } catch (error) {
        console.warn(`[START SIMULATION] Could not fetch competencies (table may not exist):`, error.message);
        // Continue without competencies - this is okay for frontend-only mode
      }

      // Map difficulty text to number for objectives generation
      const difficultyMap: Record<string, number> = {
        'beginner': 1,
        'intermediate': 3,
        'advanced': 5
      };
      const difficultyNum = difficultyMap[difficulty] || 1;

      // Get objectives (could be generated based on competencies and difficulty)
      const objectives = competencies.length > 0
        ? this.generateObjectives(competencies, difficultyNum)
        : [];

      // Create simulation session
      const simulation = await simulationRepository.create({
        user_id: startData.user_id,
        industry: startData.industry,
        difficulty: difficulty,
        subcategory: (startData as any).subcategory,
        client_profile: startData.client_profile || {},
        objectives_completed: [],  // Start with no objectives completed
      });

      console.log(`[START SIMULATION] Created simulation: ${simulation.id}`);

      // Track engagement event (optional)
      try {
        await engagementRepository.create({
          user_id: startData.user_id,
          simulation_id: simulation.id,
          event_type: 'simulation_start',
          event_data: {
            industry: startData.industry,
            difficulty: difficulty,
          },
        });
      } catch (error) {
        console.warn('[START SIMULATION] Could not track engagement event:', error.message);
        // Continue - engagement tracking is optional
      }

      return simulation;
    } catch (error) {
      console.error('Error starting simulation:', error);
      throw error;
    }
  }

  /**
   * Update simulation conversation history
   */
  async updateConversation(
    simulationId: string,
    conversationHistory: any
  ): Promise<SimulationSession> {
    try {
      return await simulationRepository.update(simulationId, {
        conversation_history: conversationHistory,
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  /**
   * Complete simulation
   */
  async completeSimulation(
    simulationId: string,
    score: number,
    review: any
  ): Promise<SimulationSession> {
    try {
      const simulation = await simulationRepository.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      if (simulation.completed_at) {
        throw new Error('Simulation already completed');
      }

      // Complete simulation (map score to total_xp and review to performance_review)
      const completedSimulation = await simulationRepository.complete(simulationId, score, review);

      // Track engagement event (optional)
      try {
        await engagementRepository.create({
          user_id: simulation.user_id,
          simulation_id: simulationId,
          event_type: 'simulation_complete',
          event_data: {
            score,
            duration: this.calculateDuration(simulation.started_at, new Date()),
          },
        });
      } catch (error: any) {
        console.warn('[COMPLETE SIMULATION] Could not track engagement event:', error.message);
        // Continue - engagement tracking is optional
      }

      return completedSimulation;
    } catch (error) {
      console.error('Error completing simulation:', error);
      throw error;
    }
  }

  /**
   * Calculate simulation score
   */
  async calculateScore(simulationId: string): Promise<SimulationScore> {
    try {
      const simulation = await simulationRepository.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      // Try to get feedback for this simulation (optional - may not exist yet)
      let feedback: any[] = [];
      try {
        feedback = await feedbackRepository.findBySimulationId(simulationId);
      } catch (error: any) {
        console.warn(`[CALCULATE SCORE] Could not fetch feedback:`, error.message);
        // Continue without feedback
      }

      // Try to get competencies for this industry (optional - may not exist)
      let competencies: any[] = [];
      try {
        competencies = await competencyRepository.findByIndustry(simulation.industry);
      } catch (error: any) {
        console.warn(`[CALCULATE SCORE] Could not fetch competencies (table may not exist):`, error.message);
        // Continue without competencies
      }

      // Calculate scores by competency
      const byCompetency: Record<string, number> = {};
      const breakdown: Array<{ competency: string; score: number; feedback: string }> = [];

      for (const competency of competencies) {
        const competencyFeedback = feedback.filter(
          f => f.competency_id === competency.id
        );

        const avgRating = competencyFeedback.length > 0
          ? competencyFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / competencyFeedback.length
          : 0;

        byCompetency[competency.name] = avgRating;

        breakdown.push({
          competency: competency.name,
          score: avgRating,
          feedback: competencyFeedback.map(f => f.comments).join(' '),
        });
      }

      // Calculate overall score (weighted average)
      const overall = Object.values(byCompetency).reduce((sum, score) => sum + score, 0) / Object.keys(byCompetency).length || 0;

      return {
        overall,
        byCompetency,
        breakdown,
      };
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    }
  }

  /**
   * Delete simulation
   */
  async deleteSimulation(simulationId: string): Promise<void> {
    try {
      // Check if simulation exists
      const simulation = await simulationRepository.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      // Delete associated feedback
      await feedbackRepository.deleteBySimulationId(simulationId);

      // Delete associated engagement events
      await engagementRepository.deleteBySimulationId(simulationId);

      // Delete simulation
      await simulationRepository.delete(simulationId);
    } catch (error) {
      console.error('Error deleting simulation:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    completed: number;
    avgScore: number;
  }> {
    try {
      return await simulationRepository.getUserStats(userId);
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Get simulation leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    avgScore: number;
    completedSimulations: number;
  }>> {
    try {
      // This would require a more complex query joining users and simulations
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get simulation analytics
   */
  async getSimulationAnalytics(simulationId: string): Promise<{
    duration: number;
    messageCount: number;
    competencyScores: Record<string, number>;
    engagementMetrics: any;
  }> {
    try {
      const simulation = await simulationRepository.findById(simulationId);
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      const duration = simulation.completed_at
        ? this.calculateDuration(simulation.started_at, simulation.completed_at)
        : 0;

      const messageCount = simulation.conversation_history
        ? (Array.isArray(simulation.conversation_history) ? simulation.conversation_history.length : 0)
        : 0;

      const scoreData = await this.calculateScore(simulationId);

      return {
        duration,
        messageCount,
        competencyScores: scoreData.byCompetency,
        engagementMetrics: {},
      };
    } catch (error) {
      console.error('Error getting simulation analytics:', error);
      throw error;
    }
  }

  /**
   * Validate industry
   */
  private isValidIndustry(industry: string): boolean {
    const validIndustries = ['wealth-management', 'banking', 'insurance', 'financial-planning'];
    return validIndustries.includes(industry);
  }

  /**
   * Validate difficulty level
   */
  private isValidDifficultyLevel(level: number): boolean {
    return level >= 1 && level <= 5;
  }

  /**
   * Generate objectives based on competencies
   */
  private generateObjectives(competencies: any[], difficultyLevel: number): string[] {
    // Generate simple objectives based on competencies
    return competencies.slice(0, 3).map(c => `Demonstrate ${c.name}`);
  }

  /**
   * Calculate duration in minutes
   */
  private calculateDuration(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
  }
}

// Export singleton instance
export const simulationService = new SimulationService();
