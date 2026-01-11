import { apiClient } from "../api-client";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthCheckResponse,
  ApiResponse,
} from "@shared/types/api.types";

/**
 * Authentication API wrapper
 * Handles login, registration, logout, and session management
 */

export const authApi = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/api/auth/login", {
      email,
      password,
    });

    // Store session token if login successful
    if (response.success && response.data?.token) {
      apiClient.setSessionToken(response.data.token);
    }

    // Return unwrapped data
    return response.data!;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>("/api/auth/register", data);

    // Store session token if registration successful
    if (response.success && response.data?.token) {
      apiClient.setSessionToken(response.data.token);
    }

    // Return unwrapped data
    return response.data!;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>("/api/auth/logout");

    // Clear session token
    apiClient.setSessionToken(null);

    return response;
  },

  /**
   * Check if current session is valid
   */
  async checkAuth(): Promise<AuthCheckResponse> {
    return apiClient.get<AuthCheckResponse>("/api/auth/check");
  },

  /**
   * Change password for authenticated user
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>("/api/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Get current session token
   */
  getSessionToken(): string | null {
    return apiClient.getSessionToken();
  },

  /**
   * Check if user is authenticated (has valid session token)
   */
  isAuthenticated(): boolean {
    return !!apiClient.getSessionToken();
  },
};

export default authApi;
