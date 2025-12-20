/**
 * Shared API Types for Frontend and Backend
 * This file contains common API request/response types
 */

// Common API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserData;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  jobRole?: string;
  company?: string;
}

export interface RegisterResponse {
  token: string;
  user: UserData;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User API Types
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'advisor';
  job_role?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user' | 'advisor';
  job_role?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | 'advisor';
  job_role?: string;
}

export interface BulkCreateUsersRequest {
  users: CreateUserRequest[];
}

// Simulation API Types
export interface SimulationData {
  id: string;
  simulation_id: string;
  user_id: string;
  industry: string;
  subcategory?: string;
  difficulty: string;
  client_profile?: any;
  conversation_history?: any;
  objectives_completed?: any;
  started_at: Date;
  completed_at?: Date;
  total_xp?: number;
  performance_review?: any;
  duration_seconds?: number;
}

export interface StartSimulationRequest {
  userId: string;
  industry: string;
  subcategory?: string;
  difficulty_level: string | number;
  clientProfile?: any;
  objectives?: any[];
}

export interface UpdateSimulationRequest {
  conversation_history?: any[];
  objectives_completed?: any[];
  total_xp?: number;
}

export interface CompleteSimulationRequest {
  total_xp: number;
  performance_review: any;
  duration_seconds?: number;
}

export interface GenerateReviewRequest {
  conversation: ConversationMessage[];
  objectives: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Parameter API Types
export interface ParameterData {
  id: string;
  name: string;
  type: 'structured' | 'narrative' | 'guardrails';
  category_id: string;
  value: any;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateParameterRequest {
  name: string;
  type: 'structured' | 'narrative' | 'guardrails';
  category_id: string;
  value: any;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateParameterRequest {
  name?: string;
  value?: any;
  description?: string;
  metadata?: Record<string, any>;
}

// Competency API Types
export interface CompetencyData {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
}

// Feedback API Types
export interface NPSFeedbackRequest {
  score: number;
  reason?: string;
  comment?: string;
  user_id?: string;
  session_id?: string;
}

// Engagement API Types
export interface EngagementEvent {
  event_type: string;
  user_id: string;
  session_id?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface EngagementScoreRequest {
  user_id: string;
  session_id: string;
  interaction_count: number;
  time_spent: number;
}
