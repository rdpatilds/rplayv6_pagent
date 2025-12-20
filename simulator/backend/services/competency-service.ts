/**
 * Competency Service
 * Business logic for competency operations
 */

import { competencyRepository } from '../db/repositories/file-competency-repository.ts';
import type { CompetencyData } from '@/shared/types/api.types';

export class CompetencyService {
  /**
   * Get competency by ID
   */
  async getCompetencyById(id: string): Promise<CompetencyData | null> {
    try {
      return await competencyRepository.findById(id);
    } catch (error) {
      console.error('Error getting competency by ID:', error);
      throw error;
    }
  }

  /**
   * Get all competencies
   */
  async getAllCompetencies(): Promise<CompetencyData[]> {
    try {
      return await competencyRepository.findAll();
    } catch (error) {
      console.error('Error getting all competencies:', error);
      throw error;
    }
  }

  /**
   * Get competencies by industry
   */
  async getCompetenciesByIndustry(industry: string): Promise<CompetencyData[]> {
    try {
      return await competencyRepository.findByIndustry(industry);
    } catch (error) {
      console.error('Error getting competencies by industry:', error);
      throw error;
    }
  }

  /**
   * Get competencies by category
   */
  async getCompetenciesByCategory(category: string): Promise<CompetencyData[]> {
    try {
      return await competencyRepository.findByCategory(category);
    } catch (error) {
      console.error('Error getting competencies by category:', error);
      throw error;
    }
  }

  /**
   * Create competency
   */
  async createCompetency(competencyData: Omit<CompetencyData, 'id'>): Promise<CompetencyData> {
    try {
      // Validate competency data
      this.validateCompetency(competencyData);

      return await competencyRepository.create(competencyData);
    } catch (error) {
      console.error('Error creating competency:', error);
      throw error;
    }
  }

  /**
   * Update competency
   */
  async updateCompetency(id: string, competencyData: Partial<CompetencyData>): Promise<CompetencyData> {
    try {
      const existing = await competencyRepository.findById(id);
      if (!existing) {
        throw new Error('Competency not found');
      }

      return await competencyRepository.update(id, competencyData);
    } catch (error) {
      console.error('Error updating competency:', error);
      throw error;
    }
  }

  /**
   * Delete competency
   */
  async deleteCompetency(id: string): Promise<void> {
    try {
      const existing = await competencyRepository.findById(id);
      if (!existing) {
        throw new Error('Competency not found');
      }

      await competencyRepository.delete(id);
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
      return await competencyRepository.getAllCategories();
    } catch (error) {
      console.error('Error getting competency categories:', error);
      throw error;
    }
  }

  /**
   * Get competencies grouped by category
   */
  async getCompetenciesGroupedByCategory(): Promise<Record<string, CompetencyData[]>> {
    try {
      const competencies = await competencyRepository.findAll();
      const grouped: Record<string, CompetencyData[]> = {};

      competencies.forEach(competency => {
        if (!grouped[competency.category]) {
          grouped[competency.category] = [];
        }
        grouped[competency.category].push(competency);
      });

      return grouped;
    } catch (error) {
      console.error('Error getting competencies grouped by category:', error);
      throw error;
    }
  }

  /**
   * Validate competency data
   */
  private validateCompetency(competencyData: Partial<CompetencyData>): void {
    if (!competencyData.name) {
      throw new Error('Competency name is required');
    }

    if (!competencyData.category) {
      throw new Error('Competency category is required');
    }

    if (competencyData.weight !== undefined) {
      if (competencyData.weight < 0 || competencyData.weight > 100) {
        throw new Error('Competency weight must be between 0 and 100');
      }
    }
  }

  /**
   * Calculate weighted score
   */
  calculateWeightedScore(scores: Record<string, number>, competencies: CompetencyData[]): number {
    try {
      let totalWeight = 0;
      let weightedSum = 0;

      competencies.forEach(competency => {
        const score = scores[competency.id] || 0;
        const weight = competency.weight || 1;

        weightedSum += score * weight;
        totalWeight += weight;
      });

      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    } catch (error) {
      console.error('Error calculating weighted score:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const competencyService = new CompetencyService();
