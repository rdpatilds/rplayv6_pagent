/**
 * Profile Generation Agent
 * Generates diverse and realistic client profiles for simulations
 */

import { BaseAgent, ChatMessage, AgentResponse } from './base-agent.js';
import { AGENT_NAMES } from './agent-config.js';

export interface GeneratedProfile {
  name: string;
  age: number;
  occupation: string;
  income: string;
  family: string;
  assets: string[];
  debts: string[];
  goals: string[];
  personality: {
    traits: Record<string, number>;
    archetype: string;
    mood: string;
    communicationStyle: string;
  };
  background: string;
  concerns: string[];
  hiddenObjections?: string[];
}

export interface ProfileGenerationRequest {
  industry: string;
  subcategory?: string;
  difficulty: string;
  focusAreas?: Array<{ id: string; name: string }>;
  existingProfiles?: string[];
}

// Industry settings cache
const industrySettingsCache = new Map<string, any>();

// Difficulty settings cache
const difficultySettingsCache = new Map<string, any>();

/**
 * Profile Generation Agent Implementation
 */
export class ProfileGenerationAgent extends BaseAgent {
  constructor() {
    super(AGENT_NAMES.PROFILE_GENERATION);
  }

  /**
   * Register tool handlers
   */
  protected registerToolHandlers(): void {
    this.toolHandlers.set('get_industry_settings', this.handleGetIndustrySettings.bind(this));
    this.toolHandlers.set('get_difficulty_settings', this.handleGetDifficultySettings.bind(this));
    this.toolHandlers.set('generate_diversity_params', this.handleGenerateDiversityParams.bind(this));
    this.toolHandlers.set('validate_profile', this.handleValidateProfile.bind(this));
  }

  /**
   * Tool: Get industry settings
   */
  private async handleGetIndustrySettings(args: {
    industry: string;
    subcategory?: string;
  }): Promise<any> {
    const key = `${args.industry}-${args.subcategory || 'default'}`;

    // Check cache
    if (industrySettingsCache.has(key)) {
      return industrySettingsCache.get(key);
    }

    // Return industry-specific settings
    const settings = this.getIndustrySettings(args.industry, args.subcategory);
    industrySettingsCache.set(key, settings);
    return settings;
  }

  /**
   * Tool: Get difficulty settings
   */
  private async handleGetDifficultySettings(args: {
    difficulty: string;
    industry?: string;
  }): Promise<any> {
    const key = `${args.difficulty}-${args.industry || 'default'}`;

    // Check cache
    if (difficultySettingsCache.has(key)) {
      return difficultySettingsCache.get(key);
    }

    const settings = this.getDifficultySettings(args.difficulty, args.industry);
    difficultySettingsCache.set(key, settings);
    return settings;
  }

  /**
   * Tool: Generate diversity parameters
   */
  private async handleGenerateDiversityParams(args: {
    recent_profiles?: string[];
  }): Promise<any> {
    return this.generateDiversityParams(args.recent_profiles || []);
  }

  /**
   * Tool: Validate profile
   */
  private async handleValidateProfile(args: {
    profile: any;
  }): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    return this.validateProfile(args.profile);
  }

  /**
   * Generate a client profile
   */
  async generateProfile(request: ProfileGenerationRequest): Promise<AgentResponse & { profile?: GeneratedProfile }> {
    const context = {
      industry: request.industry,
      subcategory: request.subcategory,
      difficulty: request.difficulty,
      focusAreas: request.focusAreas,
      existingProfiles: request.existingProfiles,
    };

    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: `Generate a realistic client profile for a ${request.industry}${request.subcategory ? ` (${request.subcategory})` : ''} simulation at ${request.difficulty} difficulty.

${request.focusAreas?.length ? `Focus areas: ${request.focusAreas.map(f => f.name).join(', ')}` : ''}

Use the tools to get industry settings, difficulty settings, and diversity parameters, then generate a complete profile.

Return the profile as a JSON object with the following structure:
{
  "name": "string",
  "age": number,
  "occupation": "string",
  "income": "string",
  "family": "string",
  "assets": ["string"],
  "debts": ["string"],
  "goals": ["string"],
  "personality": {
    "traits": { "openness": number, "agreeableness": number, "conscientiousness": number, "neuroticism": number, "extraversion": number },
    "archetype": "string",
    "mood": "string",
    "communicationStyle": "string"
  },
  "background": "string",
  "concerns": ["string"],
  "hiddenObjections": ["string"]
}`,
      },
    ];

    const response = await this.chat(messages, context);

    // Parse the profile from the response
    let profile: GeneratedProfile | undefined;
    try {
      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[ProfileGenerationAgent] Failed to parse profile:', error);
    }

    return {
      ...response,
      profile,
    };
  }

  /**
   * Get industry-specific settings
   */
  private getIndustrySettings(industry: string, subcategory?: string): any {
    const baseSettings: Record<string, any> = {
      'insurance': {
        'life-health': {
          typicalClients: ['individuals planning for retirement', 'families with young children', 'business owners'],
          commonGoals: ['protect family income', 'estate planning', 'healthcare coverage', 'disability protection'],
          financialRange: { min: 50000, max: 500000 },
          typicalAges: [25, 65],
        },
        'property-casualty': {
          typicalClients: ['homeowners', 'auto owners', 'small business owners'],
          commonGoals: ['protect property', 'liability coverage', 'risk management'],
          financialRange: { min: 40000, max: 300000 },
          typicalAges: [25, 70],
        },
        default: {
          typicalClients: ['individuals', 'families', 'business owners'],
          commonGoals: ['protection', 'peace of mind', 'financial security'],
          financialRange: { min: 40000, max: 400000 },
          typicalAges: [25, 70],
        },
      },
      'wealth-management': {
        default: {
          typicalClients: ['high-net-worth individuals', 'executives', 'business owners', 'retirees'],
          commonGoals: ['wealth preservation', 'retirement planning', 'tax optimization', 'legacy planning'],
          financialRange: { min: 250000, max: 5000000 },
          typicalAges: [35, 75],
        },
      },
      'securities': {
        default: {
          typicalClients: ['investors', 'retirement savers', 'active traders'],
          commonGoals: ['portfolio growth', 'diversification', 'income generation', 'retirement funding'],
          financialRange: { min: 50000, max: 2000000 },
          typicalAges: [25, 70],
        },
      },
    };

    const industrySettings = baseSettings[industry] || baseSettings['insurance'];
    return subcategory && industrySettings[subcategory]
      ? industrySettings[subcategory]
      : industrySettings.default || industrySettings;
  }

  /**
   * Get difficulty-specific settings
   */
  private getDifficultySettings(difficulty: string, industry?: string): any {
    const settings: Record<string, any> = {
      'beginner': {
        clientBehavior: 'Cooperative and open',
        informationSharing: 'Shares freely when asked',
        objectionLevel: 'Few or no objections',
        trustLevel: 'Quick to trust',
        knowledgeLevel: 'Basic financial knowledge',
        personalityTraitRange: { min: 40, max: 70 },
        archetypes: ['Trusting Client', 'Information Seeker', 'Eager Learner'],
        moods: ['Optimistic', 'Curious', 'Cooperative'],
      },
      'intermediate': {
        clientBehavior: 'Somewhat reserved initially',
        informationSharing: 'Requires some trust-building',
        objectionLevel: 'Moderate objections',
        trustLevel: 'Cautious but fair',
        knowledgeLevel: 'Moderate financial knowledge',
        personalityTraitRange: { min: 30, max: 80 },
        archetypes: ['Cautious Investor', 'Skeptical Consumer', 'Busy Professional'],
        moods: ['Neutral', 'Slightly Skeptical', 'Busy'],
      },
      'advanced': {
        clientBehavior: 'Skeptical and challenging',
        informationSharing: 'Guarded, requires expertise demonstration',
        objectionLevel: 'Many objections and pushback',
        trustLevel: 'Difficult to earn',
        knowledgeLevel: 'Substantial but may have misconceptions',
        personalityTraitRange: { min: 20, max: 90 },
        archetypes: ['Difficult Client', 'Know-It-All', 'Hostile Skeptic', 'Past Bad Experience'],
        moods: ['Skeptical', 'Frustrated', 'Dismissive', 'Impatient'],
      },
    };

    return settings[difficulty.toLowerCase()] || settings['beginner'];
  }

  /**
   * Generate diversity parameters
   */
  private generateDiversityParams(recentProfiles: string[]): any {
    // Generate parameters to ensure diversity
    const allAges = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
    const allGenders = ['male', 'female'];
    const allFamilyStatuses = ['single', 'married', 'married with children', 'divorced', 'widowed'];
    const allOccupations = [
      'teacher', 'engineer', 'doctor', 'lawyer', 'small business owner',
      'nurse', 'accountant', 'sales manager', 'retired', 'entrepreneur',
      'consultant', 'government employee', 'executive', 'artist', 'technician',
    ];

    // Filter out recently used
    const unusedAges = allAges.filter(a => !recentProfiles.includes(`age:${a}`));
    const unusedOccupations = allOccupations.filter(o => !recentProfiles.includes(`occupation:${o}`));

    return {
      suggestedAge: unusedAges[Math.floor(Math.random() * unusedAges.length)] || allAges[Math.floor(Math.random() * allAges.length)],
      suggestedGender: allGenders[Math.floor(Math.random() * allGenders.length)],
      suggestedFamilyStatus: allFamilyStatuses[Math.floor(Math.random() * allFamilyStatuses.length)],
      suggestedOccupation: unusedOccupations[Math.floor(Math.random() * unusedOccupations.length)] || allOccupations[Math.floor(Math.random() * allOccupations.length)],
      avoidRepeating: recentProfiles.slice(0, 5),
    };
  }

  /**
   * Validate generated profile
   */
  private validateProfile(profile: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!profile.name) errors.push('Missing name');
    if (!profile.age || typeof profile.age !== 'number') errors.push('Invalid or missing age');
    if (!profile.occupation) errors.push('Missing occupation');
    if (!profile.income) errors.push('Missing income');
    if (!profile.family) errors.push('Missing family status');

    // Arrays
    if (!Array.isArray(profile.goals) || profile.goals.length === 0) {
      warnings.push('No goals specified');
    }
    if (!Array.isArray(profile.concerns) || profile.concerns.length === 0) {
      warnings.push('No concerns specified');
    }

    // Personality
    if (!profile.personality) {
      errors.push('Missing personality');
    } else {
      if (!profile.personality.traits) warnings.push('Missing personality traits');
      if (!profile.personality.archetype) warnings.push('Missing archetype');
    }

    // Age validation
    if (profile.age && (profile.age < 18 || profile.age > 100)) {
      errors.push('Age must be between 18 and 100');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const profileGenerationAgent = new ProfileGenerationAgent();

export default profileGenerationAgent;
