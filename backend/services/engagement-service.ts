/**
 * Engagement Service
 * Business logic for engagement tracking and analytics
 */

import { engagementRepository } from '../db/repositories/engagement-repository.ts';
import type { EngagementData, CreateEngagementRequest, EngagementStats } from '../db/repositories/engagement-repository.ts';

export class EngagementService {
  /**
   * Track engagement event
   */
  async trackEvent(eventData: CreateEngagementRequest): Promise<EngagementData> {
    try {
      return await engagementRepository.create(eventData);
    } catch (error) {
      console.error('Error tracking engagement event:', error);
      throw error;
    }
  }

  /**
   * Track multiple events
   */
  async trackEvents(events: CreateEngagementRequest[]): Promise<EngagementData[]> {
    try {
      return await engagementRepository.bulkCreate(events);
    } catch (error) {
      console.error('Error tracking multiple events:', error);
      throw error;
    }
  }

  /**
   * Get user engagement statistics
   */
  async getUserEngagementStats(userId: string): Promise<EngagementStats> {
    try {
      return await engagementRepository.getUserEngagementStats(userId);
    } catch (error) {
      console.error('Error getting user engagement stats:', error);
      throw error;
    }
  }

  /**
   * Get global engagement statistics
   */
  async getGlobalEngagementStats(startDate?: Date, endDate?: Date): Promise<EngagementStats> {
    try {
      return await engagementRepository.getGlobalEngagementStats(startDate, endDate);
    } catch (error) {
      console.error('Error getting global engagement stats:', error);
      throw error;
    }
  }

  /**
   * Get user engagement history
   */
  async getUserEngagementHistory(userId: string, limit?: number): Promise<EngagementData[]> {
    try {
      return await engagementRepository.findByUserId(userId, limit);
    } catch (error) {
      console.error('Error getting user engagement history:', error);
      throw error;
    }
  }

  /**
   * Get simulation engagement
   */
  async getSimulationEngagement(simulationId: string): Promise<EngagementData[]> {
    try {
      return await engagementRepository.findBySimulationId(simulationId);
    } catch (error) {
      console.error('Error getting simulation engagement:', error);
      throw error;
    }
  }

  /**
   * Get engagement by date range
   */
  async getEngagementByDateRange(startDate: Date, endDate: Date): Promise<EngagementData[]> {
    try {
      return await engagementRepository.findByDateRange(startDate, endDate);
    } catch (error) {
      console.error('Error getting engagement by date range:', error);
      throw error;
    }
  }

  /**
   * Get daily engagement counts
   */
  async getDailyEngagementCounts(days: number = 30): Promise<Array<{date: string; count: number}>> {
    try {
      return await engagementRepository.getDailyEngagementCounts(days);
    } catch (error) {
      console.error('Error getting daily engagement counts:', error);
      throw error;
    }
  }

  /**
   * Get engagement trends
   */
  async getEngagementTrends(days: number = 30): Promise<{
    daily: Array<{date: string; count: number}>;
    byType: Record<string, number>;
    growth: number;
  }> {
    try {
      const daily = await engagementRepository.getDailyEngagementCounts(days);
      const stats = await engagementRepository.getGlobalEngagementStats();

      // Calculate growth (simple implementation)
      const recentCount = daily.slice(0, Math.floor(days / 2)).reduce((sum, d) => sum + d.count, 0);
      const previousCount = daily.slice(Math.floor(days / 2)).reduce((sum, d) => sum + d.count, 0);
      const growth = previousCount > 0 ? ((recentCount - previousCount) / previousCount) * 100 : 0;

      return {
        daily,
        byType: stats.eventsByType,
        growth,
      };
    } catch (error) {
      console.error('Error getting engagement trends:', error);
      throw error;
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(userId: string, days: number = 30): Promise<{
    events: EngagementData[];
    summary: {
      totalEvents: number;
      eventsPerDay: number;
      mostActiveDay: string;
    };
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await engagementRepository.findByUserId(userId);
      const recentEvents = events.filter(e => new Date(e.timestamp) >= startDate);

      // Calculate summary
      const eventsByDay: Record<string, number> = {};
      recentEvents.forEach(e => {
        const date = new Date(e.timestamp).toISOString().split('T')[0];
        eventsByDay[date] = (eventsByDay[date] || 0) + 1;
      });

      const mostActiveDay = Object.entries(eventsByDay)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      return {
        events: recentEvents,
        summary: {
          totalEvents: recentEvents.length,
          eventsPerDay: recentEvents.length / days,
          mostActiveDay,
        },
      };
    } catch (error) {
      console.error('Error getting user activity timeline:', error);
      throw error;
    }
  }

  /**
   * Delete user engagement data
   */
  async deleteUserEngagement(userId: string): Promise<void> {
    try {
      await engagementRepository.deleteByUserId(userId);
    } catch (error) {
      console.error('Error deleting user engagement:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const engagementService = new EngagementService();
