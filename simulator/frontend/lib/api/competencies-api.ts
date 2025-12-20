import { apiClient } from "../api-client";
import type { ApiResponse } from "@/shared/types/api.types";

/**
 * Competencies API wrapper
 * Handles competency management operations
 */

export interface CompetencyData {
  id: string;
  name: string;
  description?: string;
  category: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompetencyRequest {
  name: string;
  description?: string;
  category: string;
  weight: number;
}

export interface UpdateCompetencyRequest {
  name?: string;
  description?: string;
  category?: string;
  weight?: number;
}

export interface CompetenciesResponse extends ApiResponse {
  competencies: CompetencyData[];
}

export interface CompetencyResponse extends ApiResponse {
  competency: CompetencyData;
}

export interface IndustryCompetenciesResponse extends ApiResponse {
  industryCompetencies: Record<string, CompetencyData[]>;
}

export const competenciesApi = {
  /**
   * Get all competencies
   */
  async getAll(industry?: string, category?: string): Promise<CompetenciesResponse> {
    const params: Record<string, any> = {};
    if (industry) params.industry = industry;
    if (category) params.category = category;

    return apiClient.get<CompetenciesResponse>("/competencies", { params });
  },

  /**
   * Get competencies grouped by industry
   */
  async getByIndustry(): Promise<IndustryCompetenciesResponse> {
    return apiClient.get<IndustryCompetenciesResponse>("/competencies/industry");
  },

  /**
   * Get competency by ID
   */
  async getById(competencyId: string): Promise<CompetencyResponse> {
    return apiClient.get<CompetencyResponse>(`/api/competencies/${competencyId}`);
  },

  /**
   * Create a new competency (admin only)
   */
  async create(data: CreateCompetencyRequest): Promise<CompetencyResponse> {
    return apiClient.post<CompetencyResponse>("/competencies", data);
  },

  /**
   * Update competency (admin only)
   */
  async update(
    competencyId: string,
    data: UpdateCompetencyRequest
  ): Promise<CompetencyResponse> {
    return apiClient.put<CompetencyResponse>(`/api/competencies/${competencyId}`, data);
  },

  /**
   * Delete competency (admin only)
   */
  async delete(competencyId: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/api/competencies/${competencyId}`);
  },
};

export default competenciesApi;
