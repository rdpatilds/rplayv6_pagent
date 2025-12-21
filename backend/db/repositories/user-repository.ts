/**
 * User Repository
 * Data access layer for user operations
 */

import { sql } from '../connection.ts';
import type { UserData, CreateUserRequest, UpdateUserRequest } from "@shared/types/api.types";

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserData | null> {
    try {
      const result = await sql`
        SELECT id, email, name, role, job_role, created_at
        FROM users
        WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<(UserData & { password: string }) | null> {
    try {
      const result = await sql`
        SELECT id, email, name, role, job_role, password, created_at
        FROM users
        WHERE email = ${email}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async findAll(): Promise<UserData[]> {
    try {
      const result = await sql`
        SELECT id, email, name, role, job_role, created_at
        FROM users
        ORDER BY role, name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async create(userData: CreateUserRequest): Promise<UserData> {
    try {
      const result = await sql`
        INSERT INTO users (email, name, password, role, job_role)
        VALUES (${userData.email}, ${userData.name}, ${userData.password}, ${userData.role}, ${userData.job_role || null})
        RETURNING id, email, name, role, job_role, created_at
      `;
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id: string, userData: UpdateUserRequest): Promise<UserData> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (userData.name !== undefined) {
        updates.push(`name = $${values.length + 1}`);
        values.push(userData.name);
      }
      if (userData.email !== undefined) {
        updates.push(`email = $${values.length + 1}`);
        values.push(userData.email);
      }
      if (userData.role !== undefined) {
        updates.push(`role = $${values.length + 1}`);
        values.push(userData.role);
      }
      if (userData.job_role !== undefined) {
        updates.push(`job_role = $${values.length + 1}`);
        values.push(userData.job_role);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      const result = await sql`
        UPDATE users
        SET ${sql(updates.join(', '))}
        WHERE id = ${id}
        RETURNING id, email, name, role, job_role, created_at, updated_at
      `;

      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    try {
      await sql`
        UPDATE users
        SET password = ${hashedPassword}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM users
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Bulk create users
   */
  async bulkCreate(users: CreateUserRequest[]): Promise<UserData[]> {
    try {
      const values = users.map(u =>
        `('${u.email}', '${u.name}', '${u.password}', '${u.role}', ${u.job_role ? `'${u.job_role}'` : 'NULL'})`
      ).join(', ');

      const result = await sql`
        INSERT INTO users (email, name, password, role, job_role)
        VALUES ${sql.raw(values)}
        RETURNING id, email, name, role, job_role, created_at, updated_at
      `;

      return result;
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
      const result = await sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE email = ${email}
      `;
      return result[0].count > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
