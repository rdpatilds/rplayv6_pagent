import { apiClient } from "../api-client";
import type { ApiResponse } from "@shared/types/api.types";

/**
 * Feedback API wrapper
 * Handles feedback and engagement operations
 */

export interface FeedbackData {
  id: string;
  simulationId: string;
  userId: string;
  competencyId: string;
  rating: number;
  comments?: string;
  feedbackType: "ai_generated" | "user_submitted" | "peer_review";
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackRequest {
  simulationId: string;
  userId?: string;
  competencyId?: string;
  rating: number;
  comments?: string;
  feedbackType: "ai_generated" | "user_submitted" | "peer_review";
}

export interface FeedbackResponse extends ApiResponse {
  feedback: FeedbackData | FeedbackData[];
}

export interface FeedbackStatsResponse extends ApiResponse {
  stats: {
    averageRating: number;
    totalFeedback: number;
    feedbackByType: Record<string, number>;
  };
}

export interface EngagementData {
  id: string;
  userId: string;
  eventType: "login" | "simulation_start" | "simulation_complete" | "page_view" | "interaction";
  simulationId?: string;
  eventData?: any;
  sessionId?: string;
  timestamp: string;
}

export interface TrackEngagementRequest {
  eventType: "login" | "simulation_start" | "simulation_complete" | "page_view" | "interaction";
  simulationId?: string;
  eventData?: any;
  sessionId?: string;
}

export interface EngagementStatsResponse extends ApiResponse {
  stats: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentActivity: EngagementData[];
  };
}

export interface EngagementHistoryResponse extends ApiResponse {
  history: EngagementData[];
}

export const feedbackApi = {
  /**
   * Get feedback by simulation, user, or competency
   */
  async getAll(filters?: {
    simulationId?: string;
    userId?: string;
    competencyId?: string;
  }): Promise<FeedbackResponse> {
    const params: Record<string, any> = {};
    if (filters?.simulationId) params.simulationId = filters.simulationId;
    if (filters?.userId) params.userId = filters.userId;
    if (filters?.competencyId) params.competencyId = filters.competencyId;

    return apiClient.get<FeedbackResponse>("/api/feedback", { params });
  },

  /**
   * Get NPS (Net Promoter Score) feedback stats
   */
  async getNpsStats(): Promise<FeedbackStatsResponse> {
    return apiClient.get<FeedbackStatsResponse>("/api/feedback/nps");
  },

  /**
   * Create feedback
   */
  async create(data: CreateFeedbackRequest): Promise<FeedbackResponse> {
    return apiClient.post<FeedbackResponse>("/api/feedback", data);
  },

  /**
   * Get engagement stats
   */
  async getEngagementStats(userId?: string): Promise<EngagementStatsResponse> {
    const params: Record<string, any> = {};
    if (userId) params.userId = userId;

    return apiClient.get<EngagementStatsResponse>("/api/engagement", { params });
  },

  /**
   * Get engagement history log
   */
  async getEngagementHistory(): Promise<EngagementHistoryResponse> {
    return apiClient.get<EngagementHistoryResponse>("/api/engagement/log");
  },

  /**
   * Track engagement event
   */
  async trackEngagement(data: TrackEngagementRequest): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>("/api/engagement", data);
  },
};

export default feedbackApi;
