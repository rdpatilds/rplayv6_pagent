import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

interface Component {
  component_type: string
  component_key: string | null
  component_value: string | null
}

interface Config {
  id: string
  name: string
  description: string
  traits: Record<string, number>
  archetype: string
  mood: string
  ageGroup: string
  communicationStyle: string
  emotionalReactivity: number
  lifeStageContext: string
  quirks: string[]
  quirkIntensity: number
  personalityInfluence: number
}

interface ConfigRow {
  id: string
  name: string
  description: string
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get the configuration
    const configResult = await sql`
      SELECT id, name, description
      FROM fusion_model_configs
      WHERE id = ${id}
    `

    if (configResult.length === 0) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      )
    }

    // Get all components
    const componentsResult = await sql`
      SELECT component_type, component_key, component_value
      FROM fusion_model_components
      WHERE config_id = ${id}
    `

    // Build the configuration object
    const configRow = configResult[0] as ConfigRow
    const config: Config = {
      id: configRow.id,
      name: configRow.name,
      description: configRow.description,
      traits: {},
      archetype: "",
      mood: "",
      ageGroup: "",
      communicationStyle: "",
      emotionalReactivity: 50,
      lifeStageContext: "",
      quirks: [],
      quirkIntensity: 50,
      personalityInfluence: 70
    }

    // Process components
    componentsResult.forEach((component) => {
      const typedComponent = component as Component
      switch (typedComponent.component_type) {
        case 'trait':
          if (typedComponent.component_key) {
            config.traits[typedComponent.component_key] = JSON.parse(typedComponent.component_value || '0')
          }
          break
        case 'archetype':
          config.archetype = typedComponent.component_key || ""
          break
        case 'mood':
          config.mood = typedComponent.component_key || ""
          break
        case 'age_group':
          config.ageGroup = typedComponent.component_key || ""
          break
        case 'communication_style':
          config.communicationStyle = typedComponent.component_key || ""
          break
        case 'emotional_reactivity':
          config.emotionalReactivity = JSON.parse(typedComponent.component_value || '50')
          break
        case 'life_stage':
          config.lifeStageContext = typedComponent.component_key || ""
          break
        case 'quirk':
          if (typedComponent.component_key) {
            config.quirks.push(typedComponent.component_key)
          }
          break
        case 'quirk_intensity':
          config.quirkIntensity = JSON.parse(typedComponent.component_value || '50')
          break
        case 'personality_influence':
          config.personalityInfluence = JSON.parse(typedComponent.component_value || '70')
          break
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
} 