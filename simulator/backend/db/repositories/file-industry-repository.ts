/**
 * File-Based Industry Repository
 * Reads/writes industry metadata and settings from JSON files
 */

import { readJSONFile, writeJSONFile } from '../../utils/file-storage.ts';

const INDUSTRY_COMPETENCIES_FILE = 'industry-competencies.json';
const INDUSTRY_METADATA_FILE = 'industry-metadata.json';
const DIFFICULTY_SETTINGS_FILE = 'difficulty-settings.json';

export class FileIndustryRepository {
  /**
   * Get all industry competencies mappings
   */
  async getIndustryCompetencies(): Promise<any> {
    try {
      return readJSONFile<any>(INDUSTRY_COMPETENCIES_FILE);
    } catch (error) {
      console.error('Error fetching industry competencies:', error);
      throw error;
    }
  }

  /**
   * Get industry metadata (display names, subcategories)
   */
  async getIndustryMetadata(): Promise<any> {
    try {
      return readJSONFile<any>(INDUSTRY_METADATA_FILE);
    } catch (error) {
      console.error('Error fetching industry metadata:', error);
      throw error;
    }
  }

  /**
   * Get difficulty settings
   */
  async getDifficultySettings(): Promise<any> {
    try {
      return readJSONFile<any>(DIFFICULTY_SETTINGS_FILE);
    } catch (error) {
      console.error('Error fetching difficulty settings:', error);
      throw error;
    }
  }

  /**
   * Save industry competencies mappings
   */
  async saveIndustryCompetencies(data: any): Promise<void> {
    try {
      writeJSONFile(INDUSTRY_COMPETENCIES_FILE, data);
    } catch (error) {
      console.error('Error saving industry competencies:', error);
      throw error;
    }
  }

  /**
   * Save industry metadata
   */
  async saveIndustryMetadata(data: any): Promise<void> {
    try {
      writeJSONFile(INDUSTRY_METADATA_FILE, data);
    } catch (error) {
      console.error('Error saving industry metadata:', error);
      throw error;
    }
  }

  /**
   * Save difficulty settings
   */
  async saveDifficultySettings(data: any): Promise<void> {
    try {
      writeJSONFile(DIFFICULTY_SETTINGS_FILE, data);
    } catch (error) {
      console.error('Error saving difficulty settings:', error);
      throw error;
    }
  }

  /**
   * Update competencies for specific industry/subcategory
   */
  async updateIndustrySubcategoryCompetencies(
    industry: string,
    subcategory: string,
    competencyIds: string[]
  ): Promise<void> {
    try {
      const data = await this.getIndustryCompetencies();

      if (!data[industry]) {
        data[industry] = {};
      }

      if (!data[industry][subcategory]) {
        data[industry][subcategory] = {};
      }

      // Update competencies
      data[industry][subcategory].competencies = competencyIds;

      await this.saveIndustryCompetencies(data);
    } catch (error) {
      console.error('Error updating industry subcategory competencies:', error);
      throw error;
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
  ): Promise<void> {
    try {
      const data = await this.getIndustryCompetencies();

      if (!data[industry]?.[subcategory]?.focusAreas) {
        throw new Error(`Focus areas not found for ${industry}/${subcategory}`);
      }

      if (!data[industry][subcategory].focusAreas[focusArea]) {
        data[industry][subcategory].focusAreas[focusArea] = {};
      }

      data[industry][subcategory].focusAreas[focusArea].competencies = competencyIds;
      data[industry][subcategory].focusAreas[focusArea].enabled = enabled;

      await this.saveIndustryCompetencies(data);
    } catch (error) {
      console.error('Error updating focus area competencies:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const industryRepository = new FileIndustryRepository();
