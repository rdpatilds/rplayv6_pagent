/**
 * Validation Middleware
 * Request validation utilities
 */

import { NextRequest } from 'next/server';
import { errors } from './error-handler';

/**
 * Validate request body
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  validator: (data: any) => T
): Promise<T> {
  try {
    const body = await request.json();
    return validator(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw errors.badRequest('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  request: NextRequest,
  params: Record<string, 'string' | 'number' | 'boolean' | 'array'>
): Record<string, any> {
  const searchParams = request.nextUrl.searchParams;
  const validated: Record<string, any> = {};

  for (const [key, type] of Object.entries(params)) {
    const value = searchParams.get(key);

    if (value === null) {
      continue;
    }

    switch (type) {
      case 'string':
        validated[key] = value;
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw errors.badRequest(`Invalid number for parameter: ${key}`);
        }
        validated[key] = num;
        break;

      case 'boolean':
        validated[key] = value === 'true';
        break;

      case 'array':
        validated[key] = value.split(',');
        break;

      default:
        throw errors.badRequest(`Unknown parameter type: ${type}`);
    }
  }

  return validated;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(request: NextRequest): {
  page: number;
  limit: number;
  offset: number;
} {
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (page < 1) {
    throw errors.badRequest('Page must be greater than 0');
  }

  if (limit < 1 || limit > 100) {
    throw errors.badRequest('Limit must be between 1 and 100');
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validate array length
 */
export function validateArrayLength(
  array: any[],
  min?: number,
  max?: number
): void {
  if (min !== undefined && array.length < min) {
    throw errors.badRequest(`Array must have at least ${min} items`);
  }

  if (max !== undefined && array.length > max) {
    throw errors.badRequest(`Array must have at most ${max} items`);
  }
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value < min) {
    throw errors.badRequest(`Value must be at least ${min}`);
  }

  if (max !== undefined && value > max) {
    throw errors.badRequest(`Value must be at most ${max}`);
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: T[]
): T {
  if (!allowedValues.includes(value as T)) {
    throw errors.badRequest(
      `Invalid value. Must be one of: ${allowedValues.join(', ')}`
    );
  }
  return value as T;
}

/**
 * Validate date format
 */
export function validateDate(dateString: string): Date {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw errors.badRequest('Invalid date format');
  }

  return date;
}

/**
 * Validate date range
 */
export function validateDateRange(start: Date, end: Date): void {
  if (start > end) {
    throw errors.badRequest('Start date must be before end date');
  }
}

/**
 * Create validator from schema
 */
export function createValidator<T>(
  schema: Record<string, (value: any) => any>
): (data: any) => T {
  return (data: any): T => {
    const validated: any = {};

    for (const [key, validator] of Object.entries(schema)) {
      if (data[key] !== undefined) {
        validated[key] = validator(data[key]);
      }
    }

    return validated as T;
  };
}

/**
 * Common validators
 */
export const validators = {
  string: (value: any): string => {
    if (typeof value !== 'string') {
      throw errors.badRequest('Expected string');
    }
    return sanitizeString(value);
  },

  number: (value: any): number => {
    const num = Number(value);
    if (isNaN(num)) {
      throw errors.badRequest('Expected number');
    }
    return num;
  },

  boolean: (value: any): boolean => {
    if (typeof value !== 'boolean') {
      throw errors.badRequest('Expected boolean');
    }
    return value;
  },

  email: (value: any): string => {
    if (typeof value !== 'string' || !validateEmail(value)) {
      throw errors.badRequest('Invalid email format');
    }
    return value;
  },

  uuid: (value: any): string => {
    if (typeof value !== 'string' || !validateUUID(value)) {
      throw errors.badRequest('Invalid UUID format');
    }
    return value;
  },

  array: (value: any): any[] => {
    if (!Array.isArray(value)) {
      throw errors.badRequest('Expected array');
    }
    return value;
  },

  object: (value: any): Record<string, any> => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw errors.badRequest('Expected object');
    }
    return value;
  },

  date: (value: any): Date => {
    if (typeof value === 'string') {
      return validateDate(value);
    }
    if (value instanceof Date) {
      return value;
    }
    throw errors.badRequest('Expected date');
  },
};
