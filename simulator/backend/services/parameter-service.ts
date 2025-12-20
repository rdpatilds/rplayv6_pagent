/**
 * Parameter Service
 * Business logic for parameter operations
 */

import { parameterRepository } from '../db/repositories/parameter-repository.ts';
import type { ParameterData, CreateParameterRequest, UpdateParameterRequest } from '@/shared/types/api.types';

export class ParameterService {
  /**
   * Get parameter by ID
   */
  async getParameterById(id: string): Promise<ParameterData | null> {
    try {
      return await parameterRepository.findById(id);
    } catch (error) {
      console.error('Error getting parameter by ID:', error);
      throw error;
    }
  }

  /**
   * Get all parameters
   */
  async getAllParameters(): Promise<ParameterData[]> {
    try {
      return await parameterRepository.findAll();
    } catch (error) {
      console.error('Error getting all parameters:', error);
      throw error;
    }
  }

  /**
   * Get parameters by type
   */
  async getParametersByType(type: 'structured' | 'narrative' | 'guardrails'): Promise<ParameterData[]> {
    try {
      return await parameterRepository.findByType(type);
    } catch (error) {
      console.error('Error getting parameters by type:', error);
      throw error;
    }
  }

  /**
   * Get parameters by category
   */
  async getParametersByCategory(categoryId: string): Promise<ParameterData[]> {
    try {
      return await parameterRepository.findByCategoryId(categoryId);
    } catch (error) {
      console.error('Error getting parameters by category:', error);
      throw error;
    }
  }

  /**
   * Create parameter
   */
  async createParameter(parameterData: CreateParameterRequest): Promise<ParameterData> {
    try {
      // Validate parameter data
      this.validateParameter(parameterData);

      return await parameterRepository.create(parameterData);
    } catch (error) {
      console.error('Error creating parameter:', error);
      throw error;
    }
  }

  /**
   * Update parameter
   */
  async updateParameter(id: string, parameterData: UpdateParameterRequest): Promise<ParameterData> {
    try {
      // Check if parameter exists
      const existing = await parameterRepository.findById(id);
      if (!existing) {
        throw new Error('Parameter not found');
      }

      return await parameterRepository.update(id, parameterData);
    } catch (error) {
      console.error('Error updating parameter:', error);
      throw error;
    }
  }

  /**
   * Delete parameter
   */
  async deleteParameter(id: string): Promise<void> {
    try {
      const existing = await parameterRepository.findById(id);
      if (!existing) {
        throw new Error('Parameter not found');
      }

      await parameterRepository.delete(id);
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
      return await parameterRepository.getAllCategories();
    } catch (error) {
      console.error('Error getting parameter categories:', error);
      throw error;
    }
  }

  /**
   * Reset parameters to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      await parameterRepository.resetToDefaults();
    } catch (error) {
      console.error('Error resetting parameters:', error);
      throw error;
    }
  }

  /**
   * Get parameters as key-value object
   */
  async getParametersAsObject(type?: 'structured' | 'narrative' | 'guardrails'): Promise<Record<string, any>> {
    try {
      const params = type
        ? await parameterRepository.findByType(type)
        : await parameterRepository.findAll();

      const paramObj: Record<string, any> = {};
      params.forEach(p => {
        try {
          paramObj[p.name] = typeof p.value === 'string' ? JSON.parse(p.value) : p.value;
        } catch {
          paramObj[p.name] = p.value;
        }
      });

      return paramObj;
    } catch (error) {
      console.error('Error getting parameters as object:', error);
      throw error;
    }
  }

  /**
   * Validate parameter data
   */
  private validateParameter(parameterData: CreateParameterRequest): void {
    if (!parameterData.name) {
      throw new Error('Parameter name is required');
    }

    if (!parameterData.type) {
      throw new Error('Parameter type is required');
    }

    if (!['structured', 'narrative', 'guardrails'].includes(parameterData.type)) {
      throw new Error('Invalid parameter type');
    }

    if (parameterData.value === undefined || parameterData.value === null) {
      throw new Error('Parameter value is required');
    }
  }

  /**
   * Export parameters to JSON
   */
  async exportParameters(): Promise<string> {
    try {
      const parameters = await parameterRepository.findAll();
      return JSON.stringify(parameters, null, 2);
    } catch (error) {
      console.error('Error exporting parameters:', error);
      throw error;
    }
  }

  /**
   * Import parameters from JSON
   */
  async importParameters(jsonData: string): Promise<void> {
    try {
      const parameters = JSON.parse(jsonData);

      if (!Array.isArray(parameters)) {
        throw new Error('Invalid parameter data format');
      }

      // Reset existing parameters
      await parameterRepository.resetToDefaults();

      // Import new parameters
      for (const param of parameters) {
        await parameterRepository.create(param);
      }
    } catch (error) {
      console.error('Error importing parameters:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const parameterService = new ParameterService();
