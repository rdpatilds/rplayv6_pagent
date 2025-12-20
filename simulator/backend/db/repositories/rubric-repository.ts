/**
 * Rubric Repository
 * Data access layer for rubric operations
 */

import { sql } from '../connection.ts';

export interface RubricData {
  id: string;
  competency_id: string;
  difficulty_level: number;
  criteria: string;
  weight: number;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateRubricRequest {
  competency_id: string;
  difficulty_level: number;
  criteria: string;
  weight: number;
  description?: string;
}

export interface UpdateRubricRequest {
  criteria?: string;
  weight?: number;
  description?: string;
}

export class RubricRepository {
  /**
   * Find rubric by ID
   */
  async findById(id: string): Promise<RubricData | null> {
    try {
      const result = await sql`
        SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
        FROM rubrics
        WHERE id = ${id}
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error finding rubric by ID:', error);
      throw error;
    }
  }

  /**
   * Get all rubrics
   */
  async findAll(): Promise<RubricData[]> {
    try {
      const result = await sql`
        SELECT r.*, c.name as competency_name
        FROM rubrics r
        LEFT JOIN competencies c ON r.competency_id = c.id
        ORDER BY r.difficulty_level, c.name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching all rubrics:', error);
      throw error;
    }
  }

  /**
   * Get rubrics by competency ID
   */
  async findByCompetencyId(competencyId: string): Promise<RubricData[]> {
    try {
      const result = await sql`
        SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
        FROM rubrics
        WHERE competency_id = ${competencyId}
        ORDER BY difficulty_level
      `;
      return result;
    } catch (error) {
      console.error('Error fetching rubrics by competency:', error);
      throw error;
    }
  }

  /**
   * Get rubrics by difficulty level
   */
  async findByDifficultyLevel(difficultyLevel: number): Promise<RubricData[]> {
    try {
      const result = await sql`
        SELECT r.*, c.name as competency_name
        FROM rubrics r
        LEFT JOIN competencies c ON r.competency_id = c.id
        WHERE r.difficulty_level = ${difficultyLevel}
        ORDER BY c.name
      `;
      return result;
    } catch (error) {
      console.error('Error fetching rubrics by difficulty level:', error);
      throw error;
    }
  }

  /**
   * Get rubrics by competency and difficulty
   */
  async findByCompetencyAndDifficulty(
    competencyId: string,
    difficultyLevel: number
  ): Promise<RubricData[]> {
    try {
      const result = await sql`
        SELECT id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
        FROM rubrics
        WHERE competency_id = ${competencyId} AND difficulty_level = ${difficultyLevel}
        ORDER BY weight DESC
      `;
      return result;
    } catch (error) {
      console.error('Error fetching rubrics by competency and difficulty:', error);
      throw error;
    }
  }

  /**
   * Create rubric
   */
  async create(rubricData: CreateRubricRequest): Promise<RubricData> {
    try {
      const result = await sql`
        INSERT INTO rubrics (competency_id, difficulty_level, criteria, weight, description)
        VALUES (
          ${rubricData.competency_id},
          ${rubricData.difficulty_level},
          ${rubricData.criteria},
          ${rubricData.weight},
          ${rubricData.description || null}
        )
        RETURNING id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
      `;
      return result[0];
    } catch (error) {
      console.error('Error creating rubric:', error);
      throw error;
    }
  }

  /**
   * Update rubric
   */
  async update(id: string, rubricData: UpdateRubricRequest): Promise<RubricData> {
    try {
      const updates: string[] = [];

      if (rubricData.criteria !== undefined) {
        updates.push(`criteria = '${rubricData.criteria}'`);
      }
      if (rubricData.weight !== undefined) {
        updates.push(`weight = ${rubricData.weight}`);
      }
      if (rubricData.description !== undefined) {
        updates.push(`description = '${rubricData.description}'`);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push(`updated_at = NOW()`);

      const result = await sql`
        UPDATE rubrics
        SET ${sql.raw(updates.join(', '))}
        WHERE id = ${id}
        RETURNING id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
      `;

      return result[0];
    } catch (error) {
      console.error('Error updating rubric:', error);
      throw error;
    }
  }

  /**
   * Delete rubric
   */
  async delete(id: string): Promise<void> {
    try {
      await sql`
        DELETE FROM rubrics
        WHERE id = ${id}
      `;
    } catch (error) {
      console.error('Error deleting rubric:', error);
      throw error;
    }
  }

  /**
   * Bulk create rubrics
   */
  async bulkCreate(rubrics: CreateRubricRequest[]): Promise<RubricData[]> {
    try {
      const values = rubrics.map(r =>
        `('${r.competency_id}', ${r.difficulty_level}, '${r.criteria}', ${r.weight}, ${r.description ? `'${r.description}'` : 'NULL'})`
      ).join(', ');

      const result = await sql`
        INSERT INTO rubrics (competency_id, difficulty_level, criteria, weight, description)
        VALUES ${sql.raw(values)}
        RETURNING id, competency_id, difficulty_level, criteria, weight, description, created_at, updated_at
      `;

      return result;
    } catch (error) {
      console.error('Error bulk creating rubrics:', error);
      throw error;
    }
  }

  /**
   * Delete rubrics by competency
   */
  async deleteByCompetencyId(competencyId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM rubrics
        WHERE competency_id = ${competencyId}
      `;
    } catch (error) {
      console.error('Error deleting rubrics by competency:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rubricRepository = new RubricRepository();
