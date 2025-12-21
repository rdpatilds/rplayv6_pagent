/**
 * File-Based Rubric Repository
 * Reads/writes rubrics from JSON files instead of database
 * Adapts file format to match database repository interface
 */

import { readJSONFile, writeJSONFile } from '../../utils/file-storage.ts';
import { v4 as uuidv4 } from 'uuid';

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

interface RubricEntry {
  range: string;
  description: string;
  criteria: string[];
}

interface FileRubric {
  id: string;
  name: string;
  description: string;
  rubric: {
    beginner: RubricEntry[];
    intermediate: RubricEntry[];
    advanced: RubricEntry[];
  };
}

const RUBRICS_FILE = 'rubrics.json';

export class FileRubricRepository {
  /**
   * Convert file format to database format
   */
  private fileToDbFormat(fileRubric: FileRubric): RubricData[] {
    const dbRubrics: RubricData[] = [];

    // Convert beginner rubrics (levels 1-2)
    fileRubric.rubric.beginner?.forEach((entry, index) => {
      dbRubrics.push({
        id: `${fileRubric.id}-beginner-${index}`,
        competency_id: fileRubric.id,
        difficulty_level: 1,
        criteria: entry.criteria.join('; '),
        weight: 10,
        description: entry.description,
      });
    });

    // Convert intermediate rubrics (levels 3-4)
    fileRubric.rubric.intermediate?.forEach((entry, index) => {
      dbRubrics.push({
        id: `${fileRubric.id}-intermediate-${index}`,
        competency_id: fileRubric.id,
        difficulty_level: 3,
        criteria: entry.criteria.join('; '),
        weight: 10,
        description: entry.description,
      });
    });

    // Convert advanced rubrics (level 5)
    fileRubric.rubric.advanced?.forEach((entry, index) => {
      dbRubrics.push({
        id: `${fileRubric.id}-advanced-${index}`,
        competency_id: fileRubric.id,
        difficulty_level: 5,
        criteria: entry.criteria.join('; '),
        weight: 10,
        description: entry.description,
      });
    });

    return dbRubrics;
  }

  /**
   * Find rubric by ID
   */
  async findById(id: string): Promise<RubricData | null> {
    try {
      const allRubrics = await this.findAll();
      return allRubrics.find(r => r.id === id) || null;
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
      const fileRubrics = readJSONFile<FileRubric[]>(RUBRICS_FILE);
      const allRubrics: RubricData[] = [];

      fileRubrics.forEach(fileRubric => {
        allRubrics.push(...this.fileToDbFormat(fileRubric));
      });

      return allRubrics;
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
      const fileRubrics = readJSONFile<FileRubric[]>(RUBRICS_FILE);
      const fileRubric = fileRubrics.find(r => r.id === competencyId);

      if (!fileRubric) {
        return [];
      }

      return this.fileToDbFormat(fileRubric);
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
      const allRubrics = await this.findAll();
      return allRubrics.filter(r => r.difficulty_level === difficultyLevel);
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
      const competencyRubrics = await this.findByCompetencyId(competencyId);
      return competencyRubrics.filter(r => r.difficulty_level === difficultyLevel);
    } catch (error) {
      console.error('Error fetching rubrics by competency and difficulty:', error);
      throw error;
    }
  }

  /**
   * Create rubric (simplified - just returns a stub)
   */
  async create(rubricData: CreateRubricRequest): Promise<RubricData> {
    try {
      // File-based system doesn't support individual rubric creation
      // Return a stub for compatibility
      return {
        id: uuidv4(),
        ...rubricData,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      console.error('Error creating rubric:', error);
      throw error;
    }
  }

  /**
   * Update rubric (simplified - just returns updated data)
   */
  async update(id: string, rubricData: UpdateRubricRequest): Promise<RubricData> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Rubric not found');
      }

      return {
        ...existing,
        ...rubricData,
        updated_at: new Date(),
      };
    } catch (error) {
      console.error('Error updating rubric:', error);
      throw error;
    }
  }

  /**
   * Delete rubric (simplified - no-op)
   */
  async delete(id: string): Promise<void> {
    try {
      // File-based system doesn't support individual rubric deletion
      console.log(`Delete rubric ${id} - no-op in file-based system`);
    } catch (error) {
      console.error('Error deleting rubric:', error);
      throw error;
    }
  }

  /**
   * Bulk create rubrics (simplified - just returns stubs)
   */
  async bulkCreate(rubrics: CreateRubricRequest[]): Promise<RubricData[]> {
    try {
      return rubrics.map(rubric => ({
        id: uuidv4(),
        ...rubric,
        created_at: new Date(),
        updated_at: new Date(),
      }));
    } catch (error) {
      console.error('Error bulk creating rubrics:', error);
      throw error;
    }
  }

  /**
   * Delete rubrics by competency (simplified - no-op)
   */
  async deleteByCompetencyId(competencyId: string): Promise<void> {
    try {
      console.log(`Delete rubrics for competency ${competencyId} - no-op in file-based system`);
    } catch (error) {
      console.error('Error deleting rubrics by competency:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rubricRepository = new FileRubricRepository();
