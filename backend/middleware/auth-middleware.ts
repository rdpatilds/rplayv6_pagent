/**
 * Auth Middleware
 * Middleware for authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../services/auth-service';
import type { UserData } from "@shared/types/api.types";

export interface AuthenticatedRequest extends NextRequest {
  user?: UserData;
}

/**
 * Authenticate request
 */
export async function authenticate(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: UserData;
  error?: string;
}> {
  try {
    // Get session token from cookie or header
    const token = getSessionToken(request);

    if (!token) {
      return {
        authenticated: false,
        error: 'No session token provided',
      };
    }

    // Verify session
    const user = await authService.verifySession(token);

    if (!user) {
      return {
        authenticated: false,
        error: 'Invalid or expired session',
      };
    }

    return {
      authenticated: true,
      user,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, user: UserData) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await authenticate(request);

  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: authResult.error || 'Authentication required',
        },
      },
      { status: 401 }
    );
  }

  // Attach user to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = authResult.user;

  return handler(authenticatedRequest, authResult.user);
}

/**
 * Require specific role middleware
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: ('admin' | 'user' | 'advisor')[],
  handler: (request: AuthenticatedRequest, user: UserData) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await authenticate(request);

  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    );
  }

  // Check if user has required role
  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      },
      { status: 403 }
    );
  }

  // Attach user to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = authResult.user;

  return handler(authenticatedRequest, authResult.user);
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, user: UserData) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireRole(request, ['admin'], handler);
}

/**
 * Optional authentication middleware
 */
export async function optionalAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest, user?: UserData) => Promise<NextResponse>
): Promise<NextResponse> {
  const authResult = await authenticate(request);

  // Attach user to request if authenticated
  const authenticatedRequest = request as AuthenticatedRequest;
  if (authResult.authenticated && authResult.user) {
    authenticatedRequest.user = authResult.user;
  }

  return handler(authenticatedRequest, authResult.user);
}

/**
 * Get session token from request
 */
function getSessionToken(request: NextRequest): string | null {
  // Try to get from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get from cookie
  const cookie = request.cookies.get('session_token');
  if (cookie) {
    return cookie.value;
  }

  return null;
}

/**
 * Set session cookie
 */
export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
): NextResponse {
  response.cookies.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return response;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete('session_token');
  return response;
}

/**
 * Verify resource ownership
 */
export function verifyResourceOwnership(
  user: UserData,
  resourceUserId: string
): boolean {
  // Admins can access all resources
  if (user.role === 'admin') {
    return true;
  }

  // Users can only access their own resources
  return user.id === resourceUserId;
}
