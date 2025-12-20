import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, description, created_at, updated_at
      FROM fusion_model_configs
      ORDER BY created_at DESC
    `
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching configurations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const config = await request.json()
    
    // Insert the configuration
    const configResult = await sql`
      INSERT INTO fusion_model_configs (name, description)
      VALUES (${config.name}, ${config.description})
      RETURNING id
    `
    
    const configId = configResult[0].id

    // Insert traits
    for (const [trait, value] of Object.entries(config.traits)) {
      await sql`
        INSERT INTO fusion_model_components (config_id, component_type, component_key, component_value)
        VALUES (${configId}, 'trait', ${trait}, ${JSON.stringify(value)})
      `
    }

    // Insert other components
    const components = [
      { type: 'archetype', key: config.archetype, value: null },
      { type: 'mood', key: config.mood, value: null },
      { type: 'age_group', key: config.ageGroup, value: null },
      { type: 'communication_style', key: config.communicationStyle, value: null },
      { type: 'emotional_reactivity', key: null, value: config.emotionalReactivity },
      { type: 'life_stage', key: config.lifeStageContext, value: null },
      { type: 'quirk_intensity', key: null, value: config.quirkIntensity },
      { type: 'personality_influence', key: null, value: config.personalityInfluence }
    ]

    for (const component of components) {
      if (component.key || component.value !== null) {
        await sql`
          INSERT INTO fusion_model_components (config_id, component_type, component_key, component_value)
          VALUES (${configId}, ${component.type}, ${component.key}, ${JSON.stringify(component.value)})
        `
      }
    }

    // Insert quirks
    for (const quirk of config.quirks) {
      await sql`
        INSERT INTO fusion_model_components (config_id, component_type, component_key, component_value)
        VALUES (${configId}, 'quirk', ${quirk}, null)
      `
    }

    return NextResponse.json({ id: configId })
  } catch (error) {
    console.error('Error saving configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
} 