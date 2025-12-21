/**
 * Error Handler Middleware
 * Centralized error handling for API routes
 */

import { NextResponse } from 'next/server';
import type { ApiError } from "@shared/types/api.types";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Handle errors and return formatted response
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle AppError instances
  if (error instanceof AppError) {
    const apiError: ApiError = {
      code: error.code,
      message: error.message,
      details: error.details,
    };

    return NextResponse.json(
      {
        success: false,
        error: apiError,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    const apiError: ApiError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
    };

    return NextResponse.json(
      {
        success: false,
        error: apiError,
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  const apiError: ApiError = {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  };

  return NextResponse.json(
    {
      success: false,
      error: apiError,
    },
    { status: 500 }
  );
}

/**
 * Wrap async route handler with error handling
 */
export function withErrorHandler<T>(
  handler: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T | NextResponse> {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Common error creators
 */
export const errors = {
  badRequest: (message: string, details?: any) =>
    new AppError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN'),

  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  unprocessableEntity: (message: string, details?: any) =>
    new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details),

  tooManyRequests: (message: string = 'Too many requests') =>
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),

  internal: (message: string = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_SERVER_ERROR'),

  serviceUnavailable: (message: string = 'Service unavailable') =>
    new AppError(message, 503, 'SERVICE_UNAVAILABLE'),
};

/**
 * Validate required fields
 */
export function validateRequired(data: any, fields: string[]): void {
  const missing: string[] = [];

  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw errors.badRequest('Missing required fields', { missing });
  }
}

/**
 * Log error for monitoring
 */
export function logError(error: unknown, context?: any): void {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
  };

  // In production, you would send this to a monitoring service
  console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
}
