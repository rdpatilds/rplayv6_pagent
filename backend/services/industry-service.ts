/**
 * Industry Service
 * Business logic for industry settings and metadata
 */

import { industryRepository } from '../db/repositories/file-industry-repository.ts';

export class IndustryService {
  /**
   * Get all industry competencies mappings
   */
  async getIndustryCompetencies(): Promise<any> {
    try {
      return await industryRepository.getIndustryCompetencies();
    } catch (error) {
      console.error('Error getting industry competencies:', error);
      throw error;
    }
  }

  /**
   * Get industry metadata
   */
  async getIndustryMetadata(): Promise<any> {
    try {
      return await industryRepository.getIndustryMetadata();
    } catch (error) {
      console.error('Error getting industry metadata:', error);
      throw error;
    }
  }

  /**
   * Get difficulty settings
   */
  async getDifficultySettings(): Promise<any> {
    try {
      return await industryRepository.getDifficultySettings();
    } catch (error) {
      console.error('Error getting difficulty settings:', error);
      throw error;
    }
  }

  /**
   * Update competencies for industry/subcategory
   */
  async updateIndustrySubcategoryCompetencies(
    industry: string,
    subcategory: string,
    competencyIds: string[]
  ): Promise<boolean> {
    try {
      await industryRepository.updateIndustrySubcategoryCompetencies(
        industry,
        subcategory,
        competencyIds
      );
      return true;
    } catch (error) {
      console.error('Error updating industry subcategory competencies:', error);
      return false;
    }
  }

  /**
   * Update focus area competencies
   */
  async updateFocusAreaCompetencies(
    industry: string,
    subcategory: string,
    focusArea: string,
    competencyIds: string[],
    enabled: boolean = true
  ): Promise<boolean> {
    try {
      await industryRepository.updateFocusAreaCompetencies(
        industry,
        subcategory,
        focusArea,
        competencyIds,
        enabled
      );
      return true;
    } catch (error) {
      console.error('Error updating focus area competencies:', error);
      return false;
    }
  }

  /**
   * Save difficulty settings for industry
   */
  async saveDifficultySettings(industry: string, settings: any): Promise<boolean> {
    try {
      const allSettings = await industryRepository.getDifficultySettings();
      allSettings[industry] = settings;
      await industryRepository.saveDifficultySettings(allSettings);
      return true;
    } catch (error) {
      console.error('Error saving difficulty settings:', error);
      return false;
    }
  }

  /**
   * Save full industry metadata
   */
  async saveIndustryMetadata(data: any): Promise<boolean> {
    try {
      await industryRepository.saveIndustryMetadata(data);
      return true;
    } catch (error) {
      console.error('Error saving industry metadata:', error);
      return false;
    }
  }

  /**
   * Save full industry competencies
   */
  async saveIndustryCompetencies(data: any): Promise<boolean> {
    try {
      await industryRepository.saveIndustryCompetencies(data);
      return true;
    } catch (error) {
      console.error('Error saving industry competencies:', error);
      return false;
    }
  }
}

// Export singleton instance
export const industryService = new IndustryService();
