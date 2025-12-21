/**
 * Parameter Repository
 * Data access layer for parameter operations
 */

import { sql } from '../connection.ts';
import type { ParameterData, CreateParameterRequest, UpdateParameterRequest } from "@shared/types/api.types";

export class ParameterRepository {
  /**
   * Find parameter by ID
   */
  async findById(id: string): Promise<ParameterData | null> {
    try {
      const result = await sql`
        SELECT id, name, type, category_id, value, description, metadata
        FROM parameters
        WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding parameter by ID:', error);
      throw error;
    }
  }

  /**
   * Get all parameters
   */
  async findAll(): Promise<ParameterData[]> {
    try {
      const result = await sql`
        SELECT p.*, pc.name as category_name
        FROM parameters p
        LEFT JOIN parameter_categories pc ON p.category_id = pc.id
        ORDER BY pc.name, p.name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching all parameters:', error);
      throw error;
    }
  }

  /**
   * Get parameters by type
   */
  async findByType(type: 'structured' | 'narrative' | 'guardrails'): Promise<ParameterData[]> {
    try {
      const result = await sql`
        SELECT p.*, pc.name as category_name
        FROM parameters p
        LEFT JOIN parameter_categories pc ON p.category_id = pc.id
        WHERE p.type = ${type}
        ORDER BY pc.name, p.name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching parameters by type:', error);
      throw error;
    }
  }

  /**
   * Get parameters by category
   */
  async findByCategoryId(categoryId: string): Promise<ParameterData[]> {
    try {
      const result = await sql`
        SELECT id, name, type, category_id, value, description, metadata
        FROM parameters
        WHERE category_id = ${categoryId}
        ORDER BY name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching parameters by category:', error);
      throw error;
    }
  }

  /**
   * Create parameter
   */
  async create(parameterData: CreateParameterRequest): Promise<ParameterData> {
    try {
      const result = await sql`
        INSERT INTO parameters (name, type, category_id, value, description, metadata)
        VALUES (
          ${parameterData.name},
          ${parameterData.type},
          ${parameterData.category_id},
          ${JSON.stringify(parameterData.value)},
          ${parameterData.description || null},
          ${parameterData.metadata ? JSON.stringify(parameterData.metadata) : null}
        )
        RETURNING id, name, type, category_id, value, description, metadata
      `;
      return result[0];
    } catch (error) {
      console.error('Error creating parameter:', error);
      throw error;
    }
  }

  /**
   * Update parameter
   */
  async update(id: string, parameterData: UpdateParameterRequest): Promise<ParameterData> {
    try {
      const updates: string[] = [];

      if (parameterData.name !== undefined) {
        updates.push(`name = '${parameterData.name}'`);
      }
      if (parameterData.value !== undefined) {
        updates.push(`value = '${JSON.stringify(parameterData.value)}'`);
      }
      if (parameterData.description !== undefined) {
        updates.push(`description = '${parameterData.description}'`);
      }
      if (parameterData.metadata !== undefined) {
        updates.push(`metadata = '${JSON.stringify(parameterData.metadata)}'`);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      const result = await sql`
        UPDATE parameters
        SET ${sql.raw(updates.join(', '))}
        WHERE id = ${id}
        RETURNING id, name, type, category_id, value, description, metadata
      `;

      return result[0];
    } catch (error) {
      console.error('Error updating parameter:', error);
      throw error;
    }
  }

  /**
   * Delete parameter
   */
  async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM parameters
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting parameter:', error);
      throw error;
    }
  }

  /**
   * Get all parameter categories
   */
  async getAllCategories(): Promise<any[]> {
    try {
      const result = await sql`
        SELECT * FROM parameter_categories
        ORDER BY name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching parameter categories:', error);
      throw error;
    }
  }

  /**
   * Reset parameters to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      await sql`DELETE FROM parameters`;
      // Default parameters would be re-seeded from seed data
    } catch (error) {
      console.error('Error resetting parameters:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const parameterRepository = new ParameterRepository();
