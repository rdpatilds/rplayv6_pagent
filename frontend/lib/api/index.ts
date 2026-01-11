/**
 * Centralized API exports
 * Import all API wrappers from this single file
 */

export { apiClient, ApiError } from "../api-client";
export { authApi } from "./auth-api";
export { usersApi } from "./users-api";
export { simulationApi } from "./simulation-api";
export { parametersApi } from "./parameters-api";
export { competenciesApi } from "./competencies-api";
export { feedbackApi } from "./feedback-api";

// Re-export types
export type * from "./auth-api";
export type * from "./users-api";
export type * from "./simulation-api";
export type * from "./parameters-api";
export type * from "./competencies-api";
export type * from "./feedback-api";
