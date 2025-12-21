/**
 * Session Repository
 * Data access layer for session operations
 */

import { sql } from '../connection.ts';

export interface Session {
  id: string;
  user_id: string;
  token: string; // Changed from session_token
  expires_at: Date;
  created_at: Date;
}

export class SessionRepository {
  /**
   * Find session by token
   */
  async findByToken(token: string): Promise<Session | null> {
    try {
      const result = await sql`
        SELECT id, user_id, token, expires_at, created_at
        FROM sessions
        WHERE token = ${token} AND expires_at > NOW()
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding session by token:', error);
      throw error;
    }
  }

  /**
   * Create new session
   */
  async create(userId: string, token: string, expiresAt: Date, userEmail?: string): Promise<Session> {
    try {
      // Get user details if not provided
      let userName: string | undefined;
      let userRole: string | undefined;
      if (!userEmail) {
        const userResult = await sql`SELECT email, name, role FROM users WHERE id = ${userId}`;
        userEmail = userResult[0]?.email;
        userName = userResult[0]?.name;
        userRole = userResult[0]?.role;
      }

      const result = await sql`
        INSERT INTO sessions (user_id, user_email, user_name, user_role, token, expires_at)
        VALUES (${userId}, ${userEmail}, ${userName}, ${userRole}, ${token}, ${expiresAt})
        RETURNING id, user_id, token, expires_at, created_at
      `;
      return result[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Delete session by token
   */
  async deleteByToken(token: string): Promise<void> {
    try {
      await sql`
        DELETE FROM sessions
        WHERE session_token = ${token}
      `;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Delete all sessions for user
   */
  async deleteAllForUser(userId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM sessions
        WHERE user_id = ${userId}
      `;
    } catch (error) {
      console.error('Error deleting user sessions:', error);
      throw error;
    }
  }

  /**
   * Delete expired sessions
   */
  async deleteExpired(): Promise<void> {
    try {
      await sql`
        DELETE FROM sessions
        WHERE expires_at < NOW()
      `;
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const sessionRepository = new SessionRepository();
