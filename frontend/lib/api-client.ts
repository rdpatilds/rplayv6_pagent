import type { ApiResponse } from "@shared/types/api.types";

/**
 * Base API client for making HTTP requests to the backend
 * Handles authentication, headers, and error responses
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;
  private sessionToken: string | null = null;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
    // Try to load session token from localStorage
    // NOTE: Using 'auth_token' to match auth-provider.tsx
    if (typeof window !== "undefined") {
      this.sessionToken = localStorage.getItem("auth_token");
    }
  }

  /**
   * Set the session token for authenticated requests
   */
  setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    }
  }

  /**
   * Get the current session token
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);

    // Add content type if not set
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Add authorization header if session token exists
    if (this.sessionToken) {
      headers.set("Authorization", `Bearer ${this.sessionToken}`);
    }

    return headers;
  }

  /**
   * Make an HTTP request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers, ...fetchOptions } = options;

    const url = this.buildUrl(endpoint, params);
    const requestHeaders = this.buildHeaders(headers);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
      });

      // Parse response body
      const data = await response.json().catch(() => ({}));

      // Handle error responses
      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.message || `HTTP ${response.status}: ${response.statusText}`,
          data
        );
      }

      return data as T;
    } catch (error) {
      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Wrap other errors
      if (error instanceof Error) {
        throw new ApiError(0, error.message);
      }

      // Unknown error
      throw new ApiError(0, "An unknown error occurred");
    }
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Upload a file using FormData
   */
  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    options: Omit<RequestOptions, "method" | "body" | "headers"> = {}
  ): Promise<T> {
    // Don't set Content-Type header for FormData - browser will set it with boundary
    const headers = new Headers();
    if (this.sessionToken) {
      headers.set("Authorization", `Bearer ${this.sessionToken}`);
    }

    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      headers,
      body: formData,
    });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
);

// Export the class for custom instances if needed
export default ApiClient;
