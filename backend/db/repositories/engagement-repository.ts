/**
 * Engagement Repository
 * Data access layer for engagement metrics operations
 */

import { sql } from '../connection.ts';

export interface EngagementData {
  id: string;
  user_id: string;
  simulation_id?: string;
  event_type: 'login' | 'simulation_start' | 'simulation_complete' | 'page_view' | 'interaction';
  event_data?: any;
  timestamp: Date;
  session_id?: string;
}

export interface CreateEngagementRequest {
  user_id: string;
  simulation_id?: string;
  event_type: 'login' | 'simulation_start' | 'simulation_complete' | 'page_view' | 'interaction';
  event_data?: any;
  session_id?: string;
}

export interface EngagementStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueSessions: number;
  avgEventsPerSession: number;
}

export class EngagementRepository {
  /**
   * Find engagement by ID
   */
  async findById(id: string): Promise<EngagementData | null> {
    try {
      const result = await sql`
        SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
        FROM engagement_events
        WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding engagement by ID:', error);
      throw error;
    }
  }

  /**
   * Get engagement by user ID
   */
  async findByUserId(userId: string, limit?: number): Promise<EngagementData[]> {
    try {
      const query = limit
        ? sql`SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
             FROM engagement_events
             WHERE user_id = ${userId}
             ORDER BY timestamp DESC
             LIMIT ${limit}`
        : sql`SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
             FROM engagement_events
             WHERE user_id = ${userId}
             ORDER BY timestamp DESC`;

      return await query;
    } catch (error) {
      console.error('Error fetching engagement by user:', error);
      throw error;
    }
  }

  /**
   * Get engagement by simulation ID
   */
  async findBySimulationId(simulationId: string): Promise<EngagementData[]> {
    try {
      const result = await sql`
        SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
        FROM engagement_events
        WHERE simulation_id = ${simulationId}
        ORDER BY timestamp ASC
      `;
      return result;
    } catch (error) {
      console.error('Error fetching engagement by simulation:', error);
      throw error;
    }
  }

  /**
   * Get engagement by session ID
   */
  async findBySessionId(sessionId: string): Promise<EngagementData[]> {
    try {
      const result = await sql`
        SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
        FROM engagement_events
        WHERE session_id = ${sessionId}
        ORDER BY timestamp ASC
      `;
      return result;
    } catch (error) {
      console.error('Error fetching engagement by session:', error);
      throw error;
    }
  }

  /**
   * Get engagement by event type
   */
  async findByEventType(
    eventType: 'login' | 'simulation_start' | 'simulation_complete' | 'page_view' | 'interaction',
    limit?: number
  ): Promise<EngagementData[]> {
    try {
      const query = limit
        ? sql`SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
             FROM engagement_events
             WHERE event_type = ${eventType}
             ORDER BY timestamp DESC
             LIMIT ${limit}`
        : sql`SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
             FROM engagement_events
             WHERE event_type = ${eventType}
             ORDER BY timestamp DESC`;

      return await query;
    } catch (error) {
      console.error('Error fetching engagement by event type:', error);
      throw error;
    }
  }

  /**
   * Get engagement within date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<EngagementData[]> {
    try {
      const result = await sql`
        SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
        FROM engagement_events
        WHERE timestamp >= ${startDate.toISOString()} AND timestamp <= ${endDate.toISOString()}
        ORDER BY timestamp DESC
      `;
      return result;
    } catch (error) {
      console.error('Error fetching engagement by date range:', error);
      throw error;
    }
  }

  /**
   * Get all engagement events
   */
  async findAll(limit?: number): Promise<EngagementData[]> {
    try {
      const query = limit
        ? sql`SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
             FROM engagement_events
             ORDER BY timestamp DESC
             LIMIT ${limit}`
        : sql`SELECT id, user_id, simulation_id, event_type, event_data, timestamp, session_id
             FROM engagement_events
             ORDER BY timestamp DESC`;

      return await query;
    } catch (error) {
      console.error('Error fetching all engagement:', error);
      throw error;
    }
  }

  /**
   * Create engagement event
   */
  async create(engagementData: CreateEngagementRequest): Promise<EngagementData> {
    try {
      const result = await sql`
        INSERT INTO engagement_events (
          user_id, simulation_id, event_type, event_data, session_id, timestamp
        )
        VALUES (
          ${engagementData.user_id},
          ${engagementData.simulation_id || null},
          ${engagementData.event_type},
          ${engagementData.event_data ? JSON.stringify(engagementData.event_data) : null},
          ${engagementData.session_id || null},
          NOW()
        )
        RETURNING id, user_id, simulation_id, event_type, event_data, timestamp, session_id
      `;
      return result[0];
    } catch (error) {
      console.error('Error creating engagement event:', error);
      throw error;
    }
  }

  /**
   * Bulk create engagement events
   */
  async bulkCreate(events: CreateEngagementRequest[]): Promise<EngagementData[]> {
    try {
      const values = events.map(e =>
        `('${e.user_id}', ${e.simulation_id ? `'${e.simulation_id}'` : 'NULL'}, '${e.event_type}', ${e.event_data ? `'${JSON.stringify(e.event_data)}'` : 'NULL'}, ${e.session_id ? `'${e.session_id}'` : 'NULL'}, NOW())`
      ).join(', ');

      const result = await sql`
        INSERT INTO engagement_events (user_id, simulation_id, event_type, event_data, session_id, timestamp)
        VALUES ${sql.raw(values)}
        RETURNING id, user_id, simulation_id, event_type, event_data, timestamp, session_id
      `;

      return result;
    } catch (error) {
      console.error('Error bulk creating engagement events:', error);
      throw error;
    }
  }

  /**
   * Delete engagement event
   */
  async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM engagement_events
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting engagement event:', error);
      throw error;
    }
  }

  /**
   * Delete engagement events by user
   */
  async deleteByUserId(userId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM engagement_events
        WHERE user_id = ${userId}
      `;
    } catch (error) {
      console.error('Error deleting engagement events by user:', error);
      throw error;
    }
  }

  /**
   * Delete engagement events by simulation
   */
  async deleteBySimulationId(simulationId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM engagement_events
        WHERE simulation_id = ${simulationId}
      `;
    } catch (error) {
      console.error('Error deleting engagement events by simulation:', error);
      throw error;
    }
  }

  /**
   * Get user engagement statistics
   */
  async getUserEngagementStats(userId: string): Promise<EngagementStats> {
    try {
      const totalResult = await sql`
        SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as unique_sessions
        FROM engagement_events
        WHERE user_id = ${userId}
      `;

      const byTypeResult = await sql`
        SELECT event_type, COUNT(*) as count
        FROM engagement_events
        WHERE user_id = ${userId}
        GROUP BY event_type
      `;

      const eventsByType: Record<string, number> = {};
      byTypeResult.forEach((row: any) => {
        eventsByType[row.event_type] = parseInt(row.count);
      });

      const totalEvents = parseInt(totalResult[0].total);
      const uniqueSessions = parseInt(totalResult[0].unique_sessions) || 1;

      return {
        totalEvents,
        eventsByType,
        uniqueSessions,
        avgEventsPerSession: totalEvents / uniqueSessions,
      };
    } catch (error) {
      console.error('Error fetching user engagement stats:', error);
      throw error;
    }
  }

  /**
   * Get global engagement statistics
   */
  async getGlobalEngagementStats(startDate?: Date, endDate?: Date): Promise<EngagementStats> {
    try {
      let totalQuery, byTypeQuery;

      if (startDate && endDate) {
        totalQuery = sql`
          SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as unique_sessions
          FROM engagement_events
          WHERE timestamp >= ${startDate.toISOString()} AND timestamp <= ${endDate.toISOString()}
        `;
        byTypeQuery = sql`
          SELECT event_type, COUNT(*) as count
          FROM engagement_events
          WHERE timestamp >= ${startDate.toISOString()} AND timestamp <= ${endDate.toISOString()}
          GROUP BY event_type
        `;
      } else {
        totalQuery = sql`
          SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as unique_sessions
          FROM engagement_events
        `;
        byTypeQuery = sql`
          SELECT event_type, COUNT(*) as count
          FROM engagement_events
          GROUP BY event_type
        `;
      }

      const totalResult = await totalQuery;
      const byTypeResult = await byTypeQuery;

      const eventsByType: Record<string, number> = {};
      byTypeResult.forEach((row: any) => {
        eventsByType[row.event_type] = parseInt(row.count);
      });

      const totalEvents = parseInt(totalResult[0].total);
      const uniqueSessions = parseInt(totalResult[0].unique_sessions) || 1;

      return {
        totalEvents,
        eventsByType,
        uniqueSessions,
        avgEventsPerSession: totalEvents / uniqueSessions,
      };
    } catch (error) {
      console.error('Error fetching global engagement stats:', error);
      throw error;
    }
  }

  /**
   * Get daily engagement counts
   */
  async getDailyEngagementCounts(days: number = 30): Promise<Array<{date: string; count: number}>> {
    try {
      const result = await sql`
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM engagement_events
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `;

      return result.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count),
      }));
    } catch (error) {
      console.error('Error fetching daily engagement counts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const engagementRepository = new EngagementRepository();
