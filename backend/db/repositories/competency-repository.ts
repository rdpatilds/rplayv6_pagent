/**
 * Competency Repository
 * Data access layer for competency operations
 */

import { sql } from '../connection.ts';
import type { CompetencyData } from "@shared/types/api.types";

export class CompetencyRepository {
  /**
   * Find competency by ID
   */
  async findById(id: string): Promise<CompetencyData | null> {
    try {
      const result = await sql`
        SELECT id, name, description, category, weight
        FROM competencies
        WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding competency by ID:', error);
      throw error;
    }
  }

  /**
   * Get all competencies
   */
  async findAll(): Promise<CompetencyData[]> {
    try {
      const result = await sql`
        SELECT id, name, description, category, weight
        FROM competencies
        ORDER BY category, name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching all competencies:', error);
      throw error;
    }
  }

  /**
   * Get competencies by industry
   */
  async findByIndustry(industry: string): Promise<CompetencyData[]> {
    try {
      const result = await sql`
        SELECT c.id, c.name, c.description, c.category, c.weight
        FROM competencies c
        INNER JOIN industry_competencies ic ON c.id = ic.competency_id
        WHERE ic.industry = ${industry}
        ORDER BY c.category, c.name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching competencies by industry:', error);
      throw error;
    }
  }

  /**
   * Get competencies by category
   */
  async findByCategory(category: string): Promise<CompetencyData[]> {
    try {
      const result = await sql`
        SELECT id, name, description, category, weight
        FROM competencies
        WHERE category = ${category}
        ORDER BY name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching competencies by category:', error);
      throw error;
    }
  }

  /**
   * Create competency
   */
  async create(competencyData: Omit<CompetencyData, 'id'>): Promise<CompetencyData> {
    try {
      const result = await sql`
        INSERT INTO competencies (name, description, category, weight)
        VALUES (${competencyData.name}, ${competencyData.description}, ${competencyData.category}, ${competencyData.weight})
        RETURNING id, name, description, category, weight
      `;
      return result[0];
    } catch (error) {
      console.error('Error creating competency:', error);
      throw error;
    }
  }

  /**
   * Update competency
   */
  async update(id: string, competencyData: Partial<CompetencyData>): Promise<CompetencyData> {
    try {
      const updates: string[] = [];

      if (competencyData.name !== undefined) {
        updates.push(`name = '${competencyData.name}'`);
      }
      if (competencyData.description !== undefined) {
        updates.push(`description = '${competencyData.description}'`);
      }
      if (competencyData.category !== undefined) {
        updates.push(`category = '${competencyData.category}'`);
      }
      if (competencyData.weight !== undefined) {
        updates.push(`weight = ${competencyData.weight}`);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      const result = await sql`
        UPDATE competencies
        SET ${sql.raw(updates.join(', '))}
        WHERE id = ${id}
        RETURNING id, name, description, category, weight
      `;

      return result[0];
    } catch (error) {
      console.error('Error updating competency:', error);
      throw error;
    }
  }

  /**
   * Delete competency
   */
  async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM competencies
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting competency:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const result = await sql`
        SELECT DISTINCT category
        FROM competencies
        ORDER BY category
      `;
      return result.map((row: any) => row.category);
    } catch (error) {
      console.error('Error fetching competency categories:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const competencyRepository = new CompetencyRepository();
