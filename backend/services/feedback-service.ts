/**
 * Feedback Service
 * Business logic for feedback operations
 */

import { feedbackRepository } from '../db/repositories/feedback-repository.ts';
import type { FeedbackData, CreateFeedbackRequest, UpdateFeedbackRequest } from '../db/repositories/feedback-repository.ts';
import { simulationRepository } from '../db/repositories/simulation-repository.ts';
import { competencyRepository } from '../db/repositories/competency-repository.ts';

export class FeedbackService {
  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: string): Promise<FeedbackData | null> {
    try {
      return await feedbackRepository.findById(id);
    } catch (error) {
      console.error('Error getting feedback by ID:', error);
      throw error;
    }
  }

  /**
   * Get feedback by simulation
   */
  async getFeedbackBySimulation(simulationId: string): Promise<FeedbackData[]> {
    try {
      return await feedbackRepository.findBySimulationId(simulationId);
    } catch (error) {
      console.error('Error getting feedback by simulation:', error);
      throw error;
    }
  }

  /**
   * Get feedback by user
   */
  async getFeedbackByUser(userId: string): Promise<FeedbackData[]> {
    try {
      return await feedbackRepository.findByUserId(userId);
    } catch (error) {
      console.error('Error getting feedback by user:', error);
      throw error;
    }
  }

  /**
   * Get feedback by competency
   */
  async getFeedbackByCompetency(competencyId: string): Promise<FeedbackData[]> {
    try {
      return await feedbackRepository.findByCompetencyId(competencyId);
    } catch (error) {
      console.error('Error getting feedback by competency:', error);
      throw error;
    }
  }

  /**
   * Get feedback with filters
   */
  async getFeedback(filters: {
    simulationId?: string;
    userId?: string;
    competencyId?: string;
    feedbackType?: string;
  }): Promise<FeedbackData[]> {
    try {
      if (filters.simulationId) {
        return await this.getFeedbackBySimulation(filters.simulationId);
      }
      if (filters.userId) {
        return await this.getFeedbackByUser(filters.userId);
      }
      if (filters.competencyId) {
        return await this.getFeedbackByCompetency(filters.competencyId);
      }
      if (filters.feedbackType) {
        return await feedbackRepository.findByType(filters.feedbackType as any);
      }

      // No filters, return all (with limit)
      return await feedbackRepository.findAll(100);
    } catch (error) {
      console.error('Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Create feedback
   */
  async createFeedback(feedbackData: CreateFeedbackRequest): Promise<FeedbackData> {
    try {
      // Validate feedback data
      await this.validateFeedback(feedbackData);

      return await feedbackRepository.create(feedbackData);
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  /**
   * Update feedback
   */
  async updateFeedback(id: string, feedbackData: UpdateFeedbackRequest): Promise<FeedbackData> {
    try {
      const existing = await feedbackRepository.findById(id);
      if (!existing) {
        throw new Error('Feedback not found');
      }

      return await feedbackRepository.update(id, feedbackData);
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(id: string): Promise<void> {
    try {
      const existing = await feedbackRepository.findById(id);
      if (!existing) {
        throw new Error('Feedback not found');
      }

      await feedbackRepository.delete(id);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  /**
   * Get average rating by competency
   */
  async getAverageRatingByCompetency(competencyId: string): Promise<number> {
    try {
      return await feedbackRepository.getAverageRatingByCompetency(competencyId);
    } catch (error) {
      console.error('Error getting average rating:', error);
      throw error;
    }
  }

  /**
   * Get user feedback statistics
   */
  async getUserFeedbackStats(userId: string): Promise<{
    total: number;
    avgRating: number;
    byType: Record<string, number>;
  }> {
    try {
      return await feedbackRepository.getUserFeedbackStats(userId);
    } catch (error) {
      console.error('Error getting user feedback stats:', error);
      throw error;
    }
  }

  /**
   * Get feedback summary for simulation
   */
  async getSimulationFeedbackSummary(simulationId: string): Promise<{
    totalFeedback: number;
    avgRating: number;
    byCompetency: Record<string, {count: number; avgRating: number}>;
    recentFeedback: FeedbackData[];
  }> {
    try {
      const feedback = await feedbackRepository.findBySimulationId(simulationId);

      // Calculate average rating
      const ratingsWithValues = feedback.filter(f => f.rating !== null && f.rating !== undefined);
      const avgRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsWithValues.length
        : 0;

      // Group by competency
      const byCompetency: Record<string, {count: number; avgRating: number; total: number}> = {};

      feedback.forEach(f => {
        if (f.competency_id) {
          if (!byCompetency[f.competency_id]) {
            byCompetency[f.competency_id] = {count: 0, avgRating: 0, total: 0};
          }
          byCompetency[f.competency_id].count++;
          if (f.rating !== null && f.rating !== undefined) {
            byCompetency[f.competency_id].total += f.rating;
          }
        }
      });

      // Calculate averages
      const byCompetencySummary: Record<string, {count: number; avgRating: number}> = {};
      for (const [compId, data] of Object.entries(byCompetency)) {
        byCompetencySummary[compId] = {
          count: data.count,
          avgRating: data.count > 0 ? data.total / data.count : 0,
        };
      }

      return {
        totalFeedback: feedback.length,
        avgRating,
        byCompetency: byCompetencySummary,
        recentFeedback: feedback.slice(0, 5),
      };
    } catch (error) {
      console.error('Error getting simulation feedback summary:', error);
      throw error;
    }
  }

  /**
   * Validate feedback data
   */
  private async validateFeedback(feedbackData: CreateFeedbackRequest): Promise<void> {
    if (!feedbackData.simulation_id) {
      throw new Error('Simulation ID is required');
    }

    if (!feedbackData.user_id) {
      throw new Error('User ID is required');
    }

    if (!feedbackData.feedback_type) {
      throw new Error('Feedback type is required');
    }

    if (!['ai_generated', 'user_submitted', 'peer_review'].includes(feedbackData.feedback_type)) {
      throw new Error('Invalid feedback type');
    }

    // Check if simulation exists (using simulation_id text field, not UUID)
    console.log('Looking for simulation with simulation_id:', feedbackData.simulation_id);
    const simulation = await simulationRepository.findBySimulationId(feedbackData.simulation_id);
    console.log('Simulation found:', simulation ? 'YES' : 'NO');
    if (!simulation) {
      throw new Error(`Simulation not found with simulation_id: ${feedbackData.simulation_id}`);
    }

    // Check if competency exists (if provided)
    // Note: nps_feedback table doesn't have competency_id, so we skip this validation
    if (feedbackData.competency_id) {
      console.warn('[FEEDBACK SERVICE] competency_id provided but nps_feedback table does not support competencies');
    }

    // Validate rating range
    if (feedbackData.rating !== undefined && feedbackData.rating !== null) {
      if (feedbackData.rating < 0 || feedbackData.rating > 100) {
        throw new Error('Rating must be between 0 and 100');
      }
    }
  }

  /**
   * Generate feedback insights
   */
  async generateFeedbackInsights(userId: string): Promise<{
    strengths: string[];
    areasForImprovement: string[];
    overallTrend: 'improving' | 'declining' | 'stable';
  }> {
    try {
      const feedback = await feedbackRepository.findByUserId(userId);

      // Simple insights generation (could be enhanced with AI)
      const recentFeedback = feedback.slice(0, 10);
      const olderFeedback = feedback.slice(10, 20);

      const recentAvg = this.calculateAverageRating(recentFeedback);
      const olderAvg = this.calculateAverageRating(olderFeedback);

      let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recentAvg > olderAvg + 5) overallTrend = 'improving';
      else if (recentAvg < olderAvg - 5) overallTrend = 'declining';

      return {
        strengths: ['Good communication skills', 'Professional approach'],
        areasForImprovement: ['Active listening', 'Needs assessment'],
        overallTrend,
      };
    } catch (error) {
      console.error('Error generating feedback insights:', error);
      throw error;
    }
  }

  /**
   * Calculate average rating from feedback array
   */
  private calculateAverageRating(feedback: FeedbackData[]): number {
    const ratingsWithValues = feedback.filter(f => f.rating !== null && f.rating !== undefined);
    if (ratingsWithValues.length === 0) return 0;
    return ratingsWithValues.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingsWithValues.length;
  }

  /**
   * Get NPS statistics
   */
  async getNPSStats(): Promise<{
    totalResponses: number;
    npsScore: number;
    promoters: number;
    passives: number;
    detractors: number;
    averageScore: number;
  }> {
    try {
      const allFeedback = await feedbackRepository.findAll();

      const promoters = allFeedback.filter(f => f.feedback_type === 'promoter').length;
      const passives = allFeedback.filter(f => f.feedback_type === 'passive').length;
      const detractors = allFeedback.filter(f => f.feedback_type === 'detractor').length;
      const totalResponses = allFeedback.length;

      // NPS Score = (% Promoters - % Detractors)
      const npsScore = totalResponses > 0
        ? Math.round(((promoters - detractors) / totalResponses) * 100)
        : 0;

      const averageScore = this.calculateAverageRating(allFeedback);

      return {
        totalResponses,
        npsScore,
        promoters,
        passives,
        detractors,
        averageScore,
      };
    } catch (error) {
      console.error('Error getting NPS stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();
