/**
 * Feedback Repository
 * Data access layer for feedback operations
 * Now uses nps_feedback table with NPS scoring system
 */

import { sql } from '../connection.ts';

export interface FeedbackData {
  id: string;
  simulation_id: string;
  user_id: string;
  competency_id?: string; // Not stored in nps_feedback, kept for API compatibility
  rating?: number; // 0-100 scale (converted from score)
  score?: number; // 0-10 scale (actual DB column)
  comments?: string;
  feedback_type: 'promoter' | 'passive' | 'detractor' | 'ai_generated' | 'user_submitted' | 'peer_review';
  created_at?: Date; // Mapped from submitted_at
  submitted_at?: Date; // Actual DB column
  updated_at?: Date; // Not in nps_feedback, kept for API compatibility
  reasons?: string[]; // NPS-specific field
}

export interface CreateFeedbackRequest {
  simulation_id: string;
  user_id: string;
  competency_id?: string; // Ignored for nps_feedback
  rating?: number; // 0-100 scale, will be converted to 0-10 score
  comments?: string;
  feedback_type: 'ai_generated' | 'user_submitted' | 'peer_review';
  reasons?: string[]; // Optional NPS reasons
}

export interface UpdateFeedbackRequest {
  rating?: number; // 0-100 scale
  comments?: string;
}

/**
 * Helper function to convert 0-100 rating to 0-10 NPS score
 */
function ratingToScore(rating: number): number {
  return Math.round(rating / 10);
}

/**
 * Helper function to convert 0-10 NPS score to 0-100 rating
 */
function scoreToRating(score: number): number {
  return score * 10;
}

/**
 * Helper function to determine NPS feedback type from score
 * 9-10 = Promoter, 7-8 = Passive, 0-6 = Detractor
 */
function scoreToFeedbackType(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export class FeedbackRepository {
  /**
   * Find feedback by ID
   */
  async findById(id: string): Promise<FeedbackData | null> {
    try {
      const result = await sql`
        SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
        FROM nps_feedback
        WHERE id = ${id}
      `;
      if (!result[0]) return null;

      // Convert to API format
      return {
        ...result[0],
        rating: scoreToRating(result[0].score),
        created_at: result[0].submitted_at,
      };
    } catch (error) {
      console.error('Error finding feedback by ID:', error);
      throw error;
    }
  }

  /**
   * Get feedback by simulation ID
   */
  async findBySimulationId(simulationId: string): Promise<FeedbackData[]> {
    try {
      const result = await sql`
        SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
        FROM nps_feedback
        WHERE simulation_id = ${simulationId}
        ORDER BY submitted_at DESC
      `;

      // Convert to API format
      return result.map((row: any) => ({
        ...row,
        rating: scoreToRating(row.score),
        created_at: row.submitted_at,
      }));
    } catch (error) {
      console.error('Error fetching feedback by simulation:', error);
      throw error;
    }
  }

  /**
   * Get feedback by user ID
   */
  async findByUserId(userId: string): Promise<FeedbackData[]> {
    try {
      const result = await sql`
        SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
        FROM nps_feedback
        WHERE user_id = ${userId}
        ORDER BY submitted_at DESC
      `;

      // Convert to API format
      return result.map((row: any) => ({
        ...row,
        rating: scoreToRating(row.score),
        created_at: row.submitted_at,
      }));
    } catch (error) {
      console.error('Error fetching feedback by user:', error);
      throw error;
    }
  }

  /**
   * Get feedback by competency ID
   * Note: nps_feedback table doesn't have competency_id, returns empty array
   */
  async findByCompetencyId(competencyId: string): Promise<FeedbackData[]> {
    try {
      console.warn('[FEEDBACK REPOSITORY] findByCompetencyId called but nps_feedback table does not have competency_id column');
      return [];
    } catch (error) {
      console.error('Error fetching feedback by competency:', error);
      throw error;
    }
  }

  /**
   * Get feedback by type (NPS types: promoter, passive, detractor)
   */
  async findByType(type: 'ai_generated' | 'user_submitted' | 'peer_review' | 'promoter' | 'passive' | 'detractor'): Promise<FeedbackData[]> {
    try {
      const result = await sql`
        SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
        FROM nps_feedback
        WHERE feedback_type = ${type}
        ORDER BY submitted_at DESC
      `;

      // Convert to API format
      return result.map((row: any) => ({
        ...row,
        rating: scoreToRating(row.score),
        created_at: row.submitted_at,
      }));
    } catch (error) {
      console.error('Error fetching feedback by type:', error);
      throw error;
    }
  }

  /**
   * Get all feedback
   */
  async findAll(limit?: number): Promise<FeedbackData[]> {
    try {
      const query = limit
        ? sql`SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
             FROM nps_feedback
             ORDER BY submitted_at DESC
             LIMIT ${limit}`
        : sql`SELECT id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
             FROM nps_feedback
             ORDER BY submitted_at DESC`;

      const result = await query;

      // Convert to API format
      return result.map((row: any) => ({
        ...row,
        rating: scoreToRating(row.score),
        created_at: row.submitted_at,
      }));
    } catch (error) {
      console.error('Error fetching all feedback:', error);
      throw error;
    }
  }

  /**
   * Create feedback
   * Converts 0-100 rating to 0-10 NPS score and determines feedback type
   */
  async create(feedbackData: CreateFeedbackRequest): Promise<FeedbackData> {
    try {
      // Convert rating to score (0-100 -> 0-10)
      const score = feedbackData.rating ? ratingToScore(feedbackData.rating) : 5;

      // Determine NPS feedback type based on score
      const npsFeedbackType = scoreToFeedbackType(score);

      console.log(`[FEEDBACK REPOSITORY] Creating NPS feedback: rating=${feedbackData.rating}, score=${score}, type=${npsFeedbackType}`);

      const result = await sql`
        INSERT INTO nps_feedback (
          simulation_id, user_id, score, feedback_type, reasons, comments
        )
        VALUES (
          ${feedbackData.simulation_id},
          ${feedbackData.user_id},
          ${score},
          ${npsFeedbackType},
          ${feedbackData.reasons || null},
          ${feedbackData.comments || null}
        )
        RETURNING id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
      `;

      // Convert to API format
      return {
        ...result[0],
        rating: scoreToRating(result[0].score),
        created_at: result[0].submitted_at,
      };
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  /**
   * Update feedback
   * Converts rating to score and recalculates feedback type
   */
  async update(id: string, feedbackData: UpdateFeedbackRequest): Promise<FeedbackData> {
    try {
      const updates: string[] = [];

      if (feedbackData.rating !== undefined) {
        const score = ratingToScore(feedbackData.rating);
        const npsFeedbackType = scoreToFeedbackType(score);
        updates.push(`score = ${score}`);
        updates.push(`feedback_type = '${npsFeedbackType}'`);
      }
      if (feedbackData.comments !== undefined) {
        updates.push(`comments = '${feedbackData.comments.replace(/'/g, "''")}'`); // Escape single quotes
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      const result = await sql`
        UPDATE nps_feedback
        SET ${sql.raw(updates.join(', '))}
        WHERE id = ${id}
        RETURNING id, simulation_id, user_id, score, feedback_type, reasons, comments, submitted_at
      `;

      // Convert to API format
      return {
        ...result[0],
        rating: scoreToRating(result[0].score),
        created_at: result[0].submitted_at,
      };
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  /**
   * Delete feedback
   */
  async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM nps_feedback
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  /**
   * Delete feedback by simulation ID
   */
  async deleteBySimulationId(simulationId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM nps_feedback
        WHERE simulation_id = ${simulationId}
      `;
    } catch (error) {
      console.error('Error deleting feedback by simulation:', error);
      throw error;
    }
  }

  /**
   * Get average rating by competency
   * Note: nps_feedback table doesn't have competency_id, returns 0
   */
  async getAverageRatingByCompetency(competencyId: string): Promise<number> {
    try {
      console.warn('[FEEDBACK REPOSITORY] getAverageRatingByCompetency called but nps_feedback table does not have competency_id column');
      return 0;
    } catch (error) {
      console.error('Error calculating average rating:', error);
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
      const totalResult = await sql`
        SELECT COUNT(*) as total, AVG(score) as avg_score
        FROM nps_feedback
        WHERE user_id = ${userId}
      `;

      const byTypeResult = await sql`
        SELECT feedback_type, COUNT(*) as count
        FROM nps_feedback
        WHERE user_id = ${userId}
        GROUP BY feedback_type
      `;

      const byType: Record<string, number> = {};
      byTypeResult.forEach((row: any) => {
        byType[row.feedback_type] = parseInt(row.count);
      });

      // Convert average score to rating (0-10 -> 0-100)
      const avgScore = parseFloat(totalResult[0].avg_score) || 0;
      const avgRating = scoreToRating(avgScore);

      return {
        total: parseInt(totalResult[0].total),
        avgRating,
        byType,
      };
    } catch (error) {
      console.error('Error fetching user feedback stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const feedbackRepository = new FeedbackRepository();
