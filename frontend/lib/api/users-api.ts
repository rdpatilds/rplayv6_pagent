import { apiClient } from "../api-client";
import type { ApiResponse, UserData } from "@shared/types/api.types";

/**
 * Users API wrapper
 * Handles user management operations
 */

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  jobRole?: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
  jobRole?: string;
}

export interface BulkImportRequest {
  importMethod: "csv" | "json";
  file?: File;
  jsonData?: string;
}

export interface BulkImportResponse extends ApiResponse {
  results: {
    success: number;
    failed: number;
    errors: string[];
  };
}

export interface UsersResponse extends ApiResponse {
  users: UserData[];
}

export interface UserResponse extends ApiResponse {
  user: UserData;
}

export const usersApi = {
  /**
   * Get all users (admin only)
   */
  async getAll(): Promise<UsersResponse> {
    return apiClient.get<UsersResponse>("/api/users");
  },

  /**
   * Get user by ID
   */
  async getById(userId: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/api/users/${userId}`);
  },

  /**
   * Create a new user (admin only)
   */
  async create(data: CreateUserRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>("/api/users", data);
  },

  /**
   * Update user (admin only)
   */
  async update(userId: string, data: UpdateUserRequest): Promise<UserResponse> {
    return apiClient.put<UserResponse>(`/api/users/${userId}`, data);
  },

  /**
   * Delete user (admin only)
   */
  async delete(userId: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/api/users/${userId}`);
  },

  /**
   * Bulk import users from CSV or JSON (admin only)
   */
  async bulkImport(data: BulkImportRequest): Promise<BulkImportResponse> {
    const formData = new FormData();
    formData.append("importMethod", data.importMethod);

    if (data.importMethod === "csv" && data.file) {
      formData.append("file", data.file);
    } else if (data.importMethod === "json" && data.jsonData) {
      formData.append("jsonData", data.jsonData);
    }

    return apiClient.upload<BulkImportResponse>("/api/users/bulk-import", formData);
  },
};

export default usersApi;
