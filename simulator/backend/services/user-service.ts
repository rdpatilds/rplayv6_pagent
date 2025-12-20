/**
 * User Service
 * Business logic for user operations
 */

import { userRepository } from '../db/repositories/user-repository.ts';
import { simulationRepository } from '../db/repositories/simulation-repository.ts';
import type { UserData, CreateUserRequest, UpdateUserRequest } from '@/shared/types/api.types';
import { authService } from './auth-service.ts';

export interface UserWithStats extends UserData {
  stats?: {
    totalSimulations: number;
    completedSimulations: number;
    avgScore: number;
  };
}

export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserData | null> {
    try {
      return await userRepository.findById(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with statistics
   */
  async getUserWithStats(userId: string): Promise<UserWithStats | null> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return null;
      }

      const stats = await simulationRepository.getUserStats(userId);

      return {
        ...user,
        stats: {
          totalSimulations: stats.total,
          completedSimulations: stats.completed,
          avgScore: stats.avgScore,
        },
      };
    } catch (error) {
      console.error('Error getting user with stats:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<UserData[]> {
    try {
      return await userRepository.findAll();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<UserData> {
    try {
      // Validate email format
      if (!this.isValidEmail(userData.email)) {
        throw new Error('Invalid email format');
      }

      // Check if email already exists
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Validate password strength if provided
      if (userData.password) {
        const passwordValidation = authService.validatePasswordStrength(userData.password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.message);
        }

        // Hash password
        userData.password = await authService.hashPassword(userData.password);
      }

      // Create user
      return await userRepository.create(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<UserData> {
    try {
      // Validate email format if provided
      if (userData.email && !this.isValidEmail(userData.email)) {
        throw new Error('Invalid email format');
      }

      // Check if new email already exists
      if (userData.email) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Email already registered');
        }
      }

      return await userRepository.update(userId, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await userRepository.delete(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(users: CreateUserRequest[]): Promise<UserData[]> {
    try {
      // Validate all emails
      for (const user of users) {
        if (!this.isValidEmail(user.email)) {
          throw new Error(`Invalid email format: ${user.email}`);
        }

        // Hash passwords
        if (user.password) {
          user.password = await authService.hashPassword(user.password);
        }
      }

      return await userRepository.bulkCreate(users);
    } catch (error) {
      console.error('Error bulk creating users:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      return await userRepository.emailExists(email);
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: 'admin' | 'user' | 'advisor'): Promise<UserData[]> {
    try {
      const allUsers = await userRepository.findAll();
      return allUsers.filter(user => user.role === role);
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: {
    name?: string;
    job_role?: string;
  }): Promise<UserData> {
    try {
      return await userRepository.update(userId, profileData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<{
    user: UserData;
    simulations: {
      total: number;
      completed: number;
      inProgress: number;
      avgScore: number;
    };
    recentSimulations: any[];
  }> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const stats = await simulationRepository.getUserStats(userId);
      const recentSimulations = await simulationRepository.findByUserId(userId);

      return {
        user,
        simulations: {
          total: stats.total,
          completed: stats.completed,
          inProgress: stats.total - stats.completed,
          avgScore: stats.avgScore,
        },
        recentSimulations: recentSimulations.slice(0, 5),
      };
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get user count by role
   */
  async getUserCountByRole(): Promise<Record<string, number>> {
    try {
      const allUsers = await userRepository.findAll();
      const counts: Record<string, number> = {
        admin: 0,
        user: 0,
        advisor: 0,
      };

      allUsers.forEach(user => {
        if (counts[user.role] !== undefined) {
          counts[user.role]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting user count by role:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<UserData[]> {
    try {
      const allUsers = await userRepository.findAll();
      const lowerQuery = query.toLowerCase();

      return allUsers.filter(user =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
