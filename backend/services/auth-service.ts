/**
 * Auth Service
 * Business logic for authentication operations
 */

import { userRepository } from '../db/repositories/user-repository.ts';
import { sessionRepository } from '../db/repositories/session-repository.ts';
import type { UserData, LoginRequest, SignupRequest } from "@shared/types/api.types";
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SESSION_EXPIRY_DAYS = 30;

export interface AuthResult {
  user: UserData;
  sessionToken: string;
  expiresAt: Date;
}

export class AuthService {
  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await userRepository.findByEmail(loginData.email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = this.calculateExpiryDate();

      // Create session
      await sessionRepository.create(user.id, sessionToken, expiresAt);

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        sessionToken,
        expiresAt,
      };
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Signup new user
   */
  async signup(signupData: SignupRequest): Promise<AuthResult> {
    try {
      // Check if email already exists
      const existingUser = await userRepository.findByEmail(signupData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(signupData.password, 10);

      // Create user
      const newUser = await userRepository.create({
        email: signupData.email,
        name: signupData.name,
        password: hashedPassword,
        role: signupData.role || 'learner', // Trying learner as default
        job_role: signupData.job_role,
      });

      // Generate session token
      const sessionToken = this.generateSessionToken();
      const expiresAt = this.calculateExpiryDate();

      // Create session
      await sessionRepository.create(newUser.id, sessionToken, expiresAt);

      return {
        user: newUser,
        sessionToken,
        expiresAt,
      };
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(sessionToken: string): Promise<void> {
    try {
      await sessionRepository.deleteByToken(sessionToken);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Verify session token
   */
  async verifySession(sessionToken: string): Promise<UserData | null> {
    try {
      const session = await sessionRepository.findByToken(sessionToken);
      if (!session) {
        return null;
      }

      const user = await userRepository.findById(session.user_id);
      return user;
    } catch (error) {
      console.error('Error verifying session:', error);
      throw error;
    }
  }

  /**
   * Refresh session (extend expiry)
   */
  async refreshSession(sessionToken: string): Promise<Date> {
    try {
      const session = await sessionRepository.findByToken(sessionToken);
      if (!session) {
        throw new Error('Invalid session');
      }

      const newExpiryDate = this.calculateExpiryDate();

      // Delete old session and create new one
      await sessionRepository.deleteByToken(sessionToken);
      await sessionRepository.create(session.user_id, sessionToken, newExpiryDate);

      return newExpiryDate;
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const user = await userRepository.findByEmail(
        (await userRepository.findById(userId))?.email || ''
      );
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await userRepository.updatePassword(userId, hashedPassword);

      // Optionally, invalidate all sessions for this user
      await sessionRepository.deleteAllForUser(userId);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        throw new Error('If the email exists, a reset link will be sent');
      }

      // Generate reset token
      const resetToken = this.generateResetToken();

      // In production, you would:
      // 1. Store reset token in database with expiry
      // 2. Send email with reset link
      // For now, just return the token

      return resetToken;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      // In production, you would:
      // 1. Verify reset token from database
      // 2. Check if token is expired
      // 3. Get user ID from token
      // For now, this is a placeholder

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      // await userRepository.updatePassword(userId, hashedPassword);

      console.log('Password reset functionality not fully implemented');
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await sessionRepository.deleteExpired();
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password reset token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate session expiry date
   */
  private calculateExpiryDate(): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS);
    return expiryDate;
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

// Export singleton instance
export const authService = new AuthService();
