/**
 * Rubric Service
 * Business logic for rubric operations
 */

import { rubricRepository } from '../db/repositories/file-rubric-repository.ts';
import type { RubricData, CreateRubricRequest, UpdateRubricRequest } from '../db/repositories/file-rubric-repository.ts';

export class RubricService {
  /**
   * Get rubric by ID
   */
  async getRubricById(id: string): Promise<RubricData | null> {
    try {
      return await rubricRepository.findById(id);
    } catch (error) {
      console.error('Error getting rubric by ID:', error);
      throw error;
    }
  }

  /**
   * Get all rubrics
   */
  async getAllRubrics(): Promise<RubricData[]> {
    try {
      return await rubricRepository.findAll();
    } catch (error) {
      console.error('Error getting all rubrics:', error);
      throw error;
    }
  }

  /**
   * Get rubrics by competency
   */
  async getRubricsByCompetency(competencyId: string): Promise<RubricData[]> {
    try {
      return await rubricRepository.findByCompetencyId(competencyId);
    } catch (error) {
      console.error('Error getting rubrics by competency:', error);
      throw error;
    }
  }

  /**
   * Get rubrics by difficulty level
   */
  async getRubricsByDifficultyLevel(difficultyLevel: number): Promise<RubricData[]> {
    try {
      return await rubricRepository.findByDifficultyLevel(difficultyLevel);
    } catch (error) {
      console.error('Error getting rubrics by difficulty level:', error);
      throw error;
    }
  }

  /**
   * Get rubrics by competency and difficulty
   */
  async getRubricsByCompetencyAndDifficulty(
    competencyId: string,
    difficultyLevel: number
  ): Promise<RubricData[]> {
    try {
      return await rubricRepository.findByCompetencyAndDifficulty(competencyId, difficultyLevel);
    } catch (error) {
      console.error('Error getting rubrics by competency and difficulty:', error);
      throw error;
    }
  }

  /**
   * Create rubric
   */
  async createRubric(rubricData: CreateRubricRequest): Promise<RubricData> {
    try {
      // Validate rubric data
      this.validateRubric(rubricData);

      return await rubricRepository.create(rubricData);
    } catch (error) {
      console.error('Error creating rubric:', error);
      throw error;
    }
  }

  /**
   * Update rubric
   */
  async updateRubric(id: string, rubricData: UpdateRubricRequest): Promise<RubricData> {
    try {
      const existing = await rubricRepository.findById(id);
      if (!existing) {
        throw new Error('Rubric not found');
      }

      return await rubricRepository.update(id, rubricData);
    } catch (error) {
      console.error('Error updating rubric:', error);
      throw error;
    }
  }

  /**
   * Delete rubric
   */
  async deleteRubric(id: string): Promise<void> {
    try {
      const existing = await rubricRepository.findById(id);
      if (!existing) {
        throw new Error('Rubric not found');
      }

      await rubricRepository.delete(id);
    } catch (error) {
      console.error('Error deleting rubric:', error);
      throw error;
    }
  }

  /**
   * Bulk create rubrics
   */
  async bulkCreateRubrics(rubrics: CreateRubricRequest[]): Promise<RubricData[]> {
    try {
      // Validate all rubrics
      rubrics.forEach(rubric => this.validateRubric(rubric));

      return await rubricRepository.bulkCreate(rubrics);
    } catch (error) {
      console.error('Error bulk creating rubrics:', error);
      throw error;
    }
  }

  /**
   * Delete rubrics by competency
   */
  async deleteRubricsByCompetency(competencyId: string): Promise<void> {
    try {
      await rubricRepository.deleteByCompetencyId(competencyId);
    } catch (error) {
      console.error('Error deleting rubrics by competency:', error);
      throw error;
    }
  }

  /**
   * Validate rubric data
   */
  private validateRubric(rubricData: CreateRubricRequest): void {
    if (!rubricData.competency_id) {
      throw new Error('Competency ID is required');
    }

    if (!rubricData.criteria) {
      throw new Error('Criteria is required');
    }

    if (rubricData.difficulty_level < 1 || rubricData.difficulty_level > 5) {
      throw new Error('Difficulty level must be between 1 and 5');
    }

    if (rubricData.weight < 0 || rubricData.weight > 100) {
      throw new Error('Weight must be between 0 and 100');
    }
  }

  /**
   * Get rubric matrix (competencies x difficulty levels)
   */
  async getRubricMatrix(): Promise<Record<string, Record<number, RubricData[]>>> {
    try {
      const allRubrics = await rubricRepository.findAll();
      const matrix: Record<string, Record<number, RubricData[]>> = {};

      allRubrics.forEach(rubric => {
        if (!matrix[rubric.competency_id]) {
          matrix[rubric.competency_id] = {};
        }
        if (!matrix[rubric.competency_id][rubric.difficulty_level]) {
          matrix[rubric.competency_id][rubric.difficulty_level] = [];
        }
        matrix[rubric.competency_id][rubric.difficulty_level].push(rubric);
      });

      return matrix;
    } catch (error) {
      console.error('Error getting rubric matrix:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rubricService = new RubricService();
