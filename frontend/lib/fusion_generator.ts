import { sql } from "@/lib/db"
import { randomInt } from "@/lib/utils"

interface FusionTrait {
  trait_key: string
  value: number
}

interface FusionProfile {
  traits: FusionTrait[]
  personalityInfluence: number
  inferredArchetype?: string
}

interface FusionModelConfig {
  traits: Record<string, any>
  archetypes: Record<string, any>
  communicationStyles: Record<string, any>
  moods: Record<string, any>
  quirks: Record<string, any>
}

function inferArchetype(traits: Record<string, number>, archetypes: Record<string, any>): string {
  let bestMatch = 'analyst' // Default archetype
  let bestScore = -Infinity

  for (const [key, arch] of Object.entries(archetypes)) {
    const weights = arch.trait_weights
    let score = 0

    for (const trait in weights) {
      score += (traits[trait] || 0) * weights[trait]
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = key
    }
  }

  return bestMatch
}

export async function generateFusionTraitsForSession(industryId: string, difficultyKey: string): Promise<FusionProfile> {
  // Get the active fusion model configuration
  const activeConfig = await sql`
    SELECT id FROM fusion_model_configs 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 1
  `
  
  if (!activeConfig.length) {
    throw new Error('No active fusion model configuration found')
  }

  const configId = activeConfig[0].id
  const fusionConfig = await loadFusionModelConfig(configId)

  // Get difficulty-specific settings
  const difficultyProfiles = await sql`
    SELECT * FROM difficulty_personality_profiles
    WHERE industry_id = ${industryId} AND difficulty_level_key = ${difficultyKey}
  `

  const influenceRows = await sql`
    SELECT personality_influence
    FROM difficulty_influence_settings
    WHERE industry_id = ${industryId} AND difficulty_level_key = ${difficultyKey}
  `

  const personalityInfluence = influenceRows?.[0]?.personality_influence ?? 50

  // Generate traits based on the fusion model configuration
  const traits = Object.entries(fusionConfig.traits).map(([trait_key, trait_config]) => {
    const constraint = difficultyProfiles.find((p: any) => p.trait_key === trait_key)
    const min = constraint?.min_value ?? trait_config.min_value ?? 0
    const max = constraint?.max_value ?? trait_config.max_value ?? 100
    const value = randomInt(min, max)
    return { trait_key, value }
  })

  // Convert traits array to record for archetype inference
  const traitsRecord = traits.reduce((acc, { trait_key, value }) => {
    acc[trait_key] = value
    return acc
  }, {} as Record<string, number>)

  // Infer archetype based on generated traits
  const inferredArchetype = inferArchetype(traitsRecord, fusionConfig.archetypes)

  return {
    traits: traits.sort((a, b) => Object.keys(fusionConfig.traits).indexOf(a.trait_key) - Object.keys(fusionConfig.traits).indexOf(b.trait_key)),
    personalityInfluence,
    inferredArchetype
  }
}

export async function loadFusionModelConfig(configId: string): Promise<FusionModelConfig> {
  const components = await sql`
    SELECT 
      component_type,
      component_key,
      component_value
    FROM fusion_model_components
    WHERE config_id = ${configId}
  `

  const config: FusionModelConfig = {
    traits: {},
    archetypes: {},
    communicationStyles: {},
    moods: {},
    quirks: {}
  }

  for (const component of components) {
    switch (component.component_type) {
      case 'trait':
        config.traits[component.component_key] = component.component_value
        break
      case 'archetype':
        config.archetypes[component.component_key] = component.component_value
        break
      case 'communication_style':
        config.communicationStyles[component.component_key] = component.component_value
        break
      case 'mood':
        config.moods[component.component_key] = component.component_value
        break
      case 'quirk':
        config.quirks[component.component_key] = component.component_value
        break
    }
  }

  return config
}

export async function saveFusionModelConfig(
  name: string,
  description: string,
  components: {
    traits: Record<string, any>
    archetypes: Record<string, any>
    communicationStyles: Record<string, any>
    moods: Record<string, any>
    quirks: Record<string, any>
  }
): Promise<string> {
  // Start a transaction
  const result = await sql`
    WITH config_insert AS (
      INSERT INTO fusion_model_configs (name, description, version, is_active)
      VALUES (${name}, ${description}, 1, true)
      RETURNING id
    )
    INSERT INTO fusion_model_components (config_id, component_type, component_key, component_value)
    SELECT 
      config_insert.id,
      unnest(ARRAY['trait', 'archetype', 'communication_style', 'mood', 'quirk']) as component_type,
      unnest(ARRAY[${Object.keys(components.traits)}, ${Object.keys(components.archetypes)}, ${Object.keys(components.communicationStyles)}, ${Object.keys(components.moods)}, ${Object.keys(components.quirks)}]) as component_key,
      unnest(ARRAY[${Object.values(components.traits)}, ${Object.values(components.archetypes)}, ${Object.values(components.communicationStyles)}, ${Object.values(components.moods)}, ${Object.values(components.quirks)}]) as component_value
    FROM config_insert
    RETURNING config_id
  `

  return result[0].config_id
}

export async function listFusionModelConfigs() {
  const configs = await sql`
    SELECT 
      id,
      name,
      description,
      version,
      is_active,
      created_at,
      updated_at
    FROM fusion_model_configs
    ORDER BY created_at DESC
  `

  return configs
}

export async function activateFusionModelConfig(configId: string) {
  await sql`
    UPDATE fusion_model_configs
    SET is_active = false
    WHERE is_active = true
  `

  await sql`
    UPDATE fusion_model_configs
    SET is_active = true
    WHERE id = ${configId}
  `
}
