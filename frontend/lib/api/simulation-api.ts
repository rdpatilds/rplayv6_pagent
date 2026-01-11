import { apiClient } from "../api-client";
import type { ApiResponse, SimulationData, StartSimulationRequest, UpdateSimulationRequest, CompleteSimulationRequest } from "@shared/types/api.types";

/**
 * Simulation API wrapper
 * Handles simulation operations
 */

export interface SimulationsResponse extends ApiResponse {
  simulations: SimulationData[];
}

export interface SimulationResponse extends ApiResponse {
  data?: SimulationData;
  simulation?: SimulationData;  // For backwards compatibility
}

export const simulationApi = {
  /**
   * Get all simulations for current user
   */
  async getAll(): Promise<SimulationsResponse> {
    return apiClient.get<SimulationsResponse>("/api/simulation");
  },

  /**
   * Get simulation by ID
   */
  async getById(simulationId: string): Promise<SimulationResponse> {
    return apiClient.get<SimulationResponse>(`/api/simulation/${simulationId}`);
  },

  /**
   * Get simulation by text simulation_id (e.g., "SIM-12345")
   */
  async getBySimulationId(simulationId: string): Promise<SimulationResponse> {
    return apiClient.get<SimulationResponse>(`/api/simulation/by-sim-id/${simulationId}`);
  },

  /**
   * Start a new simulation
   * @param industry - The industry type (e.g., "insurance")
   * @param subcategory - The subcategory (e.g., "life-health")
   * @param difficulty - The difficulty level (e.g., "beginner", "intermediate", "advanced")
   * @param clientProfile - The generated client profile
   * @param objectives - Initial objectives (optional)
   */
  async start(params: {
    industry: string;
    subcategory?: string;
    difficulty: string;
    clientProfile?: any;
    objectives?: any[];
  }): Promise<SimulationResponse> {
    console.log('[SIMULATION API] Creating simulation:', params);
    const response = await apiClient.post<SimulationResponse>("/api/simulation", params);
    console.log('[SIMULATION API] Created:', response);
    return response;
  },

  /**
   * Update simulation (conversation history, objectives, XP)
   */
  async update(
    simulationId: string,
    data: UpdateSimulationRequest
  ): Promise<SimulationResponse> {
    console.log('[SIMULATION API] Updating simulation:', simulationId, Object.keys(data));
    return apiClient.patch<SimulationResponse>(`/api/simulation/${simulationId}`, data);
  },

  /**
   * Complete simulation
   */
  async complete(
    simulationId: string,
    data: CompleteSimulationRequest
  ): Promise<SimulationResponse> {
    console.log('[SIMULATION API] Completing simulation:', simulationId, data);
    return apiClient.post<SimulationResponse>(
      `/api/simulation/${simulationId}/complete`,
      data
    );
  },

  /**
   * Delete simulation
   */
  async delete(simulationId: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/api/simulation/${simulationId}`);
  },
};

export default simulationApi;
