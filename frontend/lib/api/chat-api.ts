import { apiClient } from "../api-client";

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ClientProfile {
  name: string;
  age: number;
  occupation: string;
  income: string;
  family: string;
  assets?: string[];
  debts?: string[];
  goals?: string[];
  fusionModelTraits?: any;
}

export interface PersonalitySettings {
  traits: any;
  archetype: string;
  mood: string;
  influence: number;
  communicationStyle?: string;
}

export interface SimulationSettings {
  industry: string;
  subcategory: string;
  difficulty: string;
  competencies: string[];
  simulationId: string;
  focusAreas?: Array<{ id: string; name: string }>;
}

export interface ClientResponseResult {
  success: boolean;
  message: string;
  objectiveProgress?: any;
}

export interface ExpertResponseResult {
  success: boolean;
  message: string;
  tier?: number;
}

/**
 * Chat API wrapper
 * Handles AI-powered chat interactions for simulations
 */
export const chatApi = {
  /**
   * Generate AI client response
   */
  async generateClientResponse(
    messages: ChatMessage[],
    clientProfile: ClientProfile,
    personalitySettings: PersonalitySettings,
    simulationSettings: SimulationSettings,
    apiKey?: string
  ): Promise<ClientResponseResult> {
    try {
      console.log("[CHAT-API] Calling client-response endpoint...");
      const response = await apiClient.post("/api/chat/client-response", {
        messages,
        clientProfile,
        personalitySettings,
        simulationSettings,
        apiKey,
      });

      console.log("[CHAT-API] Response received:", response);
      return response;
    } catch (error: any) {
      console.error("[CHAT-API] Error generating client response:", error);
      console.error("[CHAT-API] Error details:", {
        status: error.status,
        message: error.message,
        data: error.data
      });
      return {
        success: false,
        message: "I'm sorry, I'm having trouble with that. Let's continue our conversation.",
        objectiveProgress: null,
      };
    }
  },

  /**
   * Generate expert guidance response
   */
  async generateExpertResponse(
    messages: ChatMessage[],
    clientProfile: ClientProfile,
    personalitySettings: PersonalitySettings,
    simulationSettings: SimulationSettings,
    objectives: any[],
    apiKey?: string
  ): Promise<ExpertResponseResult> {
    try {
      const response = await apiClient.post("/api/chat/expert-response", {
        messages,
        clientProfile,
        personalitySettings,
        simulationSettings,
        objectives,
        apiKey,
      });

      return response;
    } catch (error: any) {
      console.error("Error generating expert response:", error);
      return {
        success: false,
        message: "I'm sorry, I'm having trouble providing guidance right now. Please try asking a more specific question.",
        tier: 3,
      };
    }
  },

  /**
   * Set OpenAI API key
   */
  async setApiKey(apiKey: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post("/api/chat/set-api-key", { apiKey });
      return response;
    } catch (error: any) {
      console.error("Error setting API key:", error);
      return { success: false };
    }
  },

  /**
   * Test OpenAI API key
   */
  async testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post("/api/chat/test-api-key", { apiKey });
      return response;
    } catch (error: any) {
      console.error("Error testing API key:", error);
      return {
        success: false,
        message: "Failed to validate API key. Please check and try again.",
      };
    }
  },
};

export default chatApi;
