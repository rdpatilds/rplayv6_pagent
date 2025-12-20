/**
 * Simulation Repository
 * Data access layer for simulation session operations
 */

import { sql } from '../connection.ts';
import type { SimulationData } from '@/shared/types/api.types';

export interface SimulationSession extends SimulationData {
  client_profile?: any;
  conversation_history?: any;
  review?: any;
  objectives?: string[];
}

export class SimulationRepository {
  /**
   * Find simulation by UUID
   */
  async findById(id: string): Promise<SimulationSession | null> {
    try {
      const result = await sql`
        SELECT id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
               conversation_history, objectives_completed, started_at, completed_at,
               total_xp, performance_review, duration_seconds
        FROM simulations
        WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding simulation by UUID:', error);
      throw error;
    }
  }

  /**
   * Find simulation by simulation_id (text identifier like "SIM-12345")
   */
  async findBySimulationId(simulationId: string): Promise<SimulationSession | null> {
    try {
      const result = await sql`
        SELECT id, simulation_id, user_id, industry, subcategory, difficulty, client_profile,
               conversation_history, objectives_completed, started_at, completed_at,
               total_xp, performance_review, duration_seconds
        FROM simulations
        WHERE simulation_id = ${simulationId}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding simulation by simulation_id:', error);
      throw error;
    }
  }

  /**
   * Get simulations by user ID
   */
  async findByUserId(userId: string): Promise<SimulationSession[]> {
    try {
      const result = await sql`
        SELECT id, simulation_id, user_id, industry, subcategory, difficulty,
               started_at, completed_at, total_xp, performance_review
        FROM simulations
        WHERE user_id = ${userId}
        ORDER BY started_at DESC
      `;
      return result;
    } catch (error) {
      console.error('Error fetching simulations by user ID:', error);
      throw error;
    }
  }

  /**
   * Get all simulations
   */
  async findAll(limit?: number): Promise<SimulationSession[]> {
    try {
      const query = limit
        ? sql`SELECT id, simulation_id, user_id, industry, subcategory, difficulty,
               started_at, completed_at, total_xp, performance_review
             FROM simulations
             ORDER BY started_at DESC
             LIMIT ${limit}`
        : sql`SELECT id, simulation_id, user_id, industry, subcategory, difficulty,
               started_at, completed_at, total_xp, performance_review
             FROM simulations
             ORDER BY started_at DESC`;

      return await query;
    } catch (error) {
      console.error('Error fetching all simulations:', error);
      throw error;
    }
  }

  /**
   * Create simulation session
   */
  async create(sessionData: {
    user_id: string;
    industry: string;
    difficulty: string;
    subcategory?: string;
    simulation_id?: string;
    client_profile?: any;
    objectives_completed?: any[];
  }): Promise<SimulationSession> {
    try {
      const result = await sql`
        INSERT INTO simulations (
          simulation_id, user_id, industry, subcategory, difficulty,
          client_profile, objectives_completed, started_at
        )
        VALUES (
          ${sessionData.simulation_id || `SIM-${Date.now()}`},
          ${sessionData.user_id},
          ${sessionData.industry},
          ${sessionData.subcategory || null},
          ${sessionData.difficulty},
          ${sessionData.client_profile ? JSON.stringify(sessionData.client_profile) : '{}'},
          ${sessionData.objectives_completed ? JSON.stringify(sessionData.objectives_completed) : '[]'},
          NOW()
        )
        RETURNING id, simulation_id, user_id, industry, subcategory, difficulty,
                  client_profile, conversation_history, objectives_completed,
                  started_at, completed_at, total_xp, performance_review, duration_seconds
      `;
      return result[0];
    } catch (error) {
      console.error('Error creating simulation session:', error);
      throw error;
    }
  }

  /**
   * Update simulation session
   */
  async update(id: string, updates: {
    conversation_history?: any;
    completed_at?: Date;
    total_xp?: number;
    performance_review?: any;
    duration_seconds?: number;
  }): Promise<SimulationSession> {
    try {
      const updateFields: string[] = [];

      if (updates.conversation_history !== undefined) {
        updateFields.push(`conversation_history = '${JSON.stringify(updates.conversation_history)}'`);
      }
      if (updates.completed_at !== undefined) {
        updateFields.push(`completed_at = '${updates.completed_at.toISOString()}'`);
      }
      if (updates.total_xp !== undefined) {
        updateFields.push(`total_xp = ${updates.total_xp}`);
      }
      if (updates.performance_review !== undefined) {
        updateFields.push(`performance_review = '${JSON.stringify(updates.performance_review)}'`);
      }
      if (updates.duration_seconds !== undefined) {
        updateFields.push(`duration_seconds = ${updates.duration_seconds}`);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      const result = await sql`
        UPDATE simulations
        SET ${sql.raw(updateFields.join(', '))}
        WHERE id = ${id}
        RETURNING id, simulation_id, user_id, industry, subcategory, difficulty,
                  client_profile, conversation_history, objectives_completed,
                  started_at, completed_at, total_xp, performance_review, duration_seconds
      `;

      return result[0];
    } catch (error) {
      console.error('Error updating simulation session:', error);
      throw error;
    }
  }

  /**
   * Complete simulation
   */
  async complete(id: string, total_xp: number, performance_review: any): Promise<SimulationSession> {
    try {
      const result = await sql`
        UPDATE simulations
        SET completed_at = NOW(),
            total_xp = ${total_xp},
            performance_review = ${JSON.stringify(performance_review)}
        WHERE id = ${id}
        RETURNING id, simulation_id, user_id, industry, subcategory, difficulty,
                  started_at, completed_at, total_xp, performance_review
      `;
      return result[0];
    } catch (error) {
      console.error('Error completing simulation:', error);
      throw error;
    }
  }

  /**
   * Delete simulation
   */
  async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM simulations
        WHERE id = ${id}
      `;
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
      const result = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(completed_at) as completed,
          AVG(score) as avg_score
        FROM simulations
        WHERE user_id = ${userId}
      `;

      return {
        total: parseInt(result[0].total),
        completed: parseInt(result[0].completed),
        avgScore: parseFloat(result[0].avg_score) || 0,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const simulationRepository = new SimulationRepository();
