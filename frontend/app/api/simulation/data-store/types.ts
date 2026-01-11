export interface Rubric {
  levels: {
    [key: string]: {
      description: string;
      criteria: string[];
      examples: string[];
    };
  };
  version: number;
}

export interface NarrativeParameter {
  key: string;
  description: string;
  examples: string[];
  version: number;
}

export interface Guardrail {
  key: string;
  description: string;
  rules: string[];
  examples: string[];
  version: number;
}

export interface IndustryConfig {
  id: string;
  name: string;
  baseConfig: {
    competencies: {
      [competencyId: string]: {
        defaultRubric: Rubric;
        industryRubric?: Rubric;
      };
    };
    narrativeParameters: {
      [paramKey: string]: {
        defaultValue: NarrativeParameter;
        industryOverride?: NarrativeParameter;
      };
    };
    guardrails: {
      [guardrailKey: string]: {
        defaultRules: Guardrail;
        industryRules?: Guardrail;
      };
    };
  };
}

// Database types
export interface CompetencyRubricRecord {
  id: string;
  competency_id: string;
  industry_id: string | null;
  rubric_json: Rubric;
  version: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NarrativeParameterRecord {
  id: string;
  parameter_key: string;
  industry_id: string | null;
  example_json: NarrativeParameter;
  version: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GuardrailRecord {
  id: string;
  guardrail_key: string;
  industry_id: string | null;
  examples_json: Guardrail;
  version: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
} 