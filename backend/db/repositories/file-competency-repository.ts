/**
 * File-Based Competency Repository
 * Reads/writes competencies from JSON files instead of database
 */

import { readJSONFile, writeJSONFile } from '../../utils/file-storage.ts';
import type { CompetencyData } from "@shared/types/api.types";

interface FileCompetency {
  id: string;
  name: string;
  description: string;
  category?: string;
  weight?: number;
}

const COMPETENCIES_FILE = 'competencies.json';
const INDUSTRY_COMPETENCIES_FILE = 'industry-competencies.json';

export class FileCompetencyRepository {
  /**
   * Find competency by ID
   */
  async findById(id: string): Promise<CompetencyData | null> {
    try {
      const competencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);
      const competency = competencies.find(c => c.id === id);

      if (!competency) {
        return null;
      }

      return this.mapToCompetencyData(competency);
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
      const competencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);
      return competencies.map(c => this.mapToCompetencyData(c));
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
      const industryCompetencies = readJSONFile<any>(INDUSTRY_COMPETENCIES_FILE);
      const allCompetencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);

      // Get competency IDs for this industry
      let competencyIds: string[] = [];

      if (industryCompetencies[industry]) {
        // Handle different structures (could be direct array or nested object)
        const industryData = industryCompetencies[industry];

        // Try to find competencies in various structures
        if (industryData.default && Array.isArray(industryData.default.competencies)) {
          competencyIds = industryData.default.competencies;
        } else if (industryData.default && Array.isArray(industryData.default)) {
          competencyIds = industryData.default;
        } else {
          // Get from first subcategory
          const firstSubcat = Object.keys(industryData)[0];
          if (firstSubcat && industryData[firstSubcat]) {
            if (Array.isArray(industryData[firstSubcat].competencies)) {
              competencyIds = industryData[firstSubcat].competencies;
            } else if (Array.isArray(industryData[firstSubcat])) {
              competencyIds = industryData[firstSubcat];
            }
          }
        }
      }

      // Map IDs to full competency objects
      const competencies = competencyIds
        .map(id => allCompetencies.find(c => c.id === id))
        .filter((c): c is FileCompetency => c !== undefined);

      return competencies.map(c => this.mapToCompetencyData(c));
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
      const competencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);
      const filtered = competencies.filter(c => c.category === category);
      return filtered.map(c => this.mapToCompetencyData(c));
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
      const competencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);

      // Generate ID from name
      const id = competencyData.name.toLowerCase().replace(/\s+/g, '-');

      const newCompetency: FileCompetency = {
        id,
        name: competencyData.name,
        description: competencyData.description,
        category: competencyData.category,
        weight: competencyData.weight,
      };

      competencies.push(newCompetency);
      writeJSONFile(COMPETENCIES_FILE, competencies);

      return this.mapToCompetencyData(newCompetency);
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
      const competencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);
      const index = competencies.findIndex(c => c.id === id);

      if (index === -1) {
        throw new Error('Competency not found');
      }

      // Update fields
      if (competencyData.name !== undefined) {
        competencies[index].name = competencyData.name;
      }
      if (competencyData.description !== undefined) {
        competencies[index].description = competencyData.description;
      }
      if (competencyData.category !== undefined) {
        competencies[index].category = competencyData.category;
      }
      if (competencyData.weight !== undefined) {
        competencies[index].weight = competencyData.weight;
      }

      writeJSONFile(COMPETENCIES_FILE, competencies);

      return this.mapToCompetencyData(competencies[index]);
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
      const competencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);
      const filtered = competencies.filter(c => c.id !== id);

      if (filtered.length === competencies.length) {
        throw new Error('Competency not found');
      }

      writeJSONFile(COMPETENCIES_FILE, filtered);
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
      const competencies = readJSONFile<FileCompetency[]>(COMPETENCIES_FILE);
      const categories = [...new Set(competencies.map(c => c.category).filter(Boolean))] as string[];
      return categories.sort();
    } catch (error) {
      console.error('Error fetching competency categories:', error);
      throw error;
    }
  }

  /**
   * Map file competency to API format
   */
  private mapToCompetencyData(competency: FileCompetency): CompetencyData {
    return {
      id: competency.id,
      name: competency.name,
      description: competency.description,
      category: competency.category || 'General',
      weight: competency.weight || 10,
    };
  }
}

// Export singleton instance
export const competencyRepository = new FileCompetencyRepository();
