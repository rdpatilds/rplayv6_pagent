import { apiClient } from "../api-client";
import type { ApiResponse } from "@shared/types/api.types";

/**
 * Parameters API wrapper
 * Handles parameter management operations
 */

export interface ParameterData {
  id: string;
  name: string;
  type: "structured" | "narrative" | "guardrails";
  categoryId: string;
  value: any;
  description?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParameterRequest {
  name: string;
  type: "structured" | "narrative" | "guardrails";
  categoryId: string;
  value?: any;
  description?: string;
  metadata?: any;
}

export interface UpdateParameterRequest {
  name?: string;
  type?: "structured" | "narrative" | "guardrails";
  value?: any;
  description?: string;
  metadata?: any;
}

export interface ParametersResponse extends ApiResponse {
  parameters: ParameterData[];
}

export interface ParameterResponse extends ApiResponse {
  parameter: ParameterData;
}

export const parametersApi = {
  /**
   * Get all parameters
   */
  async getAll(categoryId?: string, type?: string): Promise<ParametersResponse> {
    const params: Record<string, any> = {};
    if (categoryId) params.categoryId = categoryId;
    if (type) params.type = type;

    return apiClient.get<ParametersResponse>("/parameters", { params });
  },

  /**
   * Get parameter by ID
   */
  async getById(parameterId: string): Promise<ParameterResponse> {
    return apiClient.get<ParameterResponse>(`/api/parameters/${parameterId}`);
  },

  /**
   * Create a new parameter (admin only)
   */
  async create(data: CreateParameterRequest): Promise<ParameterResponse> {
    return apiClient.post<ParameterResponse>("/parameters", data);
  },

  /**
   * Update parameter (admin only)
   */
  async update(
    parameterId: string,
    data: UpdateParameterRequest
  ): Promise<ParameterResponse> {
    return apiClient.patch<ParameterResponse>(`/api/parameters/${parameterId}`, data);
  },

  /**
   * Delete parameter (admin only)
   */
  async delete(parameterId: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/api/parameters/${parameterId}`);
  },

  /**
   * Reset parameters to defaults (admin only)
   */
  async resetToDefaults(): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>("/parameters/reset");
  },
};

export default parametersApi;
