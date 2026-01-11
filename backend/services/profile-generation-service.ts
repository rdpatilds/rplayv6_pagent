/**
 * Profile Generation Service
 * Business logic for generating client profiles
 */

import { aiService } from './ai-service.ts';
import { parameterRepository } from '../db/repositories/parameter-repository.ts';

export interface ProfileGenerationOptions {
  industry: string;
  difficulty_level: number;
  personality_traits?: string[];
  age_range?: [number, number];
  financial_situation?: string;
}

export interface GeneratedProfile {
  name: string;
  age: number;
  occupation: string;
  financial_situation: string;
  goals: string[];
  personality_traits: string[];
  communication_style: string;
  concerns: string[];
  background: string;
  metadata?: any;
}

export class ProfileGenerationService {
  /**
   * Generate a client profile
   */
  async generateProfile(options: ProfileGenerationOptions): Promise<GeneratedProfile> {
    try {
      // Get profile generation parameters
      const parameters = await this.getProfileParameters();

      // Use AI service to generate profile
      const aiProfile = await aiService.generateClientProfile(
        options.industry,
        options.difficulty_level,
        parameters
      );

      // Validate and structure the profile
      const profile = this.structureProfile(aiProfile, options);

      return profile;
    } catch (error) {
      console.error('Error generating profile:', error);
      throw error;
    }
  }

  /**
   * Generate multiple profiles
   */
  async generateMultipleProfiles(
    count: number,
    options: ProfileGenerationOptions
  ): Promise<GeneratedProfile[]> {
    try {
      const profiles: GeneratedProfile[] = [];

      for (let i = 0; i < count; i++) {
        const profile = await this.generateProfile(options);
        profiles.push(profile);
      }

      return profiles;
    } catch (error) {
      console.error('Error generating multiple profiles:', error);
      throw error;
    }
  }

  /**
   * Regenerate specific aspects of a profile
   */
  async regenerateProfileAspect(
    profile: GeneratedProfile,
    aspect: 'personality' | 'goals' | 'background' | 'concerns'
  ): Promise<GeneratedProfile> {
    try {
      // This would use AI to regenerate specific aspects
      // For now, return the original profile
      return profile;
    } catch (error) {
      console.error('Error regenerating profile aspect:', error);
      throw error;
    }
  }

  /**
   * Validate profile completeness
   */
  validateProfile(profile: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.name) errors.push('Name is required');
    if (!profile.age) errors.push('Age is required');
    if (!profile.occupation) errors.push('Occupation is required');
    if (!profile.financial_situation) errors.push('Financial situation is required');
    if (!profile.goals || profile.goals.length === 0) errors.push('At least one goal is required');
    if (!profile.personality_traits || profile.personality_traits.length === 0) {
      errors.push('At least one personality trait is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get profile templates by industry
   */
  async getProfileTemplates(industry: string): Promise<any[]> {
    try {
      // This would return pre-defined templates
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting profile templates:', error);
      throw error;
    }
  }

  /**
   * Customize profile with user inputs
   */
  customizeProfile(
    baseProfile: GeneratedProfile,
    customizations: Partial<GeneratedProfile>
  ): GeneratedProfile {
    return {
      ...baseProfile,
      ...customizations,
    };
  }

  /**
   * Structure AI-generated profile into standard format
   */
  private structureProfile(
    aiProfile: any,
    options: ProfileGenerationOptions
  ): GeneratedProfile {
    return {
      name: aiProfile.name || this.generateRandomName(),
      age: aiProfile.age || this.generateRandomAge(options.age_range),
      occupation: aiProfile.occupation || 'Professional',
      financial_situation: aiProfile.financial_situation || options.financial_situation || 'Moderate income',
      goals: Array.isArray(aiProfile.goals) ? aiProfile.goals : ['Financial planning'],
      personality_traits: Array.isArray(aiProfile.personality_traits)
        ? aiProfile.personality_traits
        : options.personality_traits || ['Friendly'],
      communication_style: aiProfile.communication_style || 'Direct',
      concerns: Array.isArray(aiProfile.concerns) ? aiProfile.concerns : ['Retirement planning'],
      background: aiProfile.background || 'General background',
      metadata: {
        industry: options.industry,
        difficulty_level: options.difficulty_level,
        generated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Get profile generation parameters
   */
  private async getProfileParameters(): Promise<any> {
    try {
      const params = await parameterRepository.findByType('narrative');

      const paramObj: any = {};
      params.forEach(p => {
        try {
          paramObj[p.name] = typeof p.value === 'string' ? JSON.parse(p.value) : p.value;
        } catch {
          paramObj[p.name] = p.value;
        }
      });

      return paramObj;
    } catch (error) {
      console.error('Error getting profile parameters:', error);
      return {};
    }
  }

  /**
   * Generate random name
   */
  private generateRandomName(): string {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
  }

  /**
   * Generate random age
   */
  private generateRandomAge(range?: [number, number]): number {
    const [min, max] = range || [30, 65];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Export singleton instance
export const profileGenerationService = new ProfileGenerationService();
