import { sql } from '@vercel/postgres';
import {
  IndustryConfig,
  Rubric,
  NarrativeParameter,
  Guardrail
} from './types';

export async function loadIndustryConfig(industryId: string): Promise<IndustryConfig> {
  // Get industry info
  const industry = await sql`
    SELECT id, name, slug, ai_role_description 
    FROM industries 
    WHERE id = ${industryId}
  `;

  // Load competencies for this industry
  const competencyMappings = await sql`
    SELECT icm.competency_id, c.name, c.description
    FROM industry_competency_mappings icm
    JOIN competencies c ON c.id = icm.competency_id
    WHERE icm.industry_id = ${industryId}
  `;

  // Load rubrics for these competencies
  const competencyIds = competencyMappings.rows.map(m => m.competency_id);
  const rubricEntries = await sql`
    SELECT re.*, c.name as competency_name
    FROM rubric_entries re
    JOIN competencies c ON c.id = re.competency_id
    WHERE re.competency_id IN (${competencyIds.join(',')})
    ORDER BY re.competency_id, re.score_range
  `;

  // Load parameters (both narrative and guardrails)
  const parameters = await sql`
    SELECT p.*, pc.name as category_name, pc.parameter_type
    FROM parameters p
    JOIN parameter_categories pc ON pc.id = p.category_id
    WHERE p.global = true 
    OR p.applicable_industries ? ${industryId}
    ORDER BY pc.sort_order, p.sort_order
  `;

  // Process competencies and their rubrics
  const competencies: { [key: string]: { defaultRubric: Rubric; industryRubric?: Rubric } } = {};
  competencyMappings.rows.forEach(mapping => {
    const rubric: Rubric = {
      levels: {},
      version: 1
    };

    rubricEntries.rows
      .filter(re => re.competency_id === mapping.competency_id)
      .forEach(re => {
        rubric.levels[re.score_range] = {
          description: re.criteria,
          criteria: re.criteria.split('\n'),
          examples: []
        };
      });

    competencies[mapping.competency_id] = {
      defaultRubric: rubric
    };
  });

  // Process parameters
  const params: { [key: string]: { defaultValue: NarrativeParameter; industryOverride?: NarrativeParameter } } = {};
  const guardrails: { [key: string]: { defaultRules: Guardrail; industryRules?: Guardrail } } = {};

  parameters.rows.forEach(param => {
    const paramConfig: NarrativeParameter = {
      key: param.name,
      description: param.description,
      examples: param.examples ? param.examples.split('\n') : [],
      version: 1
    };

    const guardrailConfig: Guardrail = {
      key: param.name,
      description: param.description,
      rules: param.examples ? param.examples.split('\n') : [],
      examples: [],
      version: 1
    };

    if (param.parameter_type === 'guardrail') {
      if (!guardrails[param.name]) {
        guardrails[param.name] = { defaultRules: guardrailConfig };
      } else if (param.applicable_industries?.[industryId]) {
        guardrails[param.name].industryRules = guardrailConfig;
      }
    } else {
      if (!params[param.name]) {
        params[param.name] = { defaultValue: paramConfig };
      } else if (param.applicable_industries?.[industryId]) {
        params[param.name].industryOverride = paramConfig;
      }
    }
  });

  return {
    id: industry.rows[0].id,
    name: industry.rows[0].name,
    baseConfig: {
      competencies,
      narrativeParameters: params,
      guardrails
    }
  };
}

// Helper function to get the effective configuration for a specific item
export function getEffectiveConfig<T extends { version: number }>(
  defaultConfig: T,
  industryOverride?: T
): T {
  if (!industryOverride) return defaultConfig;
  return industryOverride.version > defaultConfig.version ? industryOverride : defaultConfig;
}

// Example usage:
// const config = await loadIndustryConfig('insurance-id');
// const effectiveRubric = getEffectiveConfig(
//   config.baseConfig.competencies['some-competency'].defaultRubric,
//   config.baseConfig.competencies['some-competency'].industryRubric
// ); 