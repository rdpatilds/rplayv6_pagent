import { neon, NeonQueryFunction } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const industryId = url.searchParams.get("industry")
    const subcategoryId = url.searchParams.get("subcategory")

    console.log("Industry settings API called with:", { industryId, subcategoryId })

    // 1. Load industry + subcategory metadata
    const result = await sql`
      SELECT i.id AS industry_id, i.name AS industry_name, 
             i.ai_role_label, i.ai_role_description,
             s.id AS subcategory_id, s.name AS subcategory_name
      FROM industries i
      LEFT JOIN subcategories s ON s.industry_id = i.id;
    `
    const industryMetadataRaw = result as {
      industry_id: string
      industry_name: string
      ai_role_label: string | null
      ai_role_description: string | null
      subcategory_id: string | null
      subcategory_name: string | null
    }[]

    const industryMetadata: Record<string, {
      displayName: string
      aiRoleLabel?: string | null
      aiRoleDescription?: string | null
      subcategories: Record<string, { displayName: string }>
    }> = {}

    for (const row of industryMetadataRaw) {
      const { industry_id, industry_name, ai_role_label, ai_role_description, subcategory_id, subcategory_name } = row
      if (!industryMetadata[industry_id]) {
        industryMetadata[industry_id] = {
          displayName: industry_name,
          aiRoleLabel: ai_role_label,
          aiRoleDescription: ai_role_description,
          subcategories: {},
        }
      }
      if (subcategory_id) {
        industryMetadata[industry_id].subcategories[subcategory_id] = {
          displayName: subcategory_name ?? "",
        }
      }
    }

    if (!industryId) {
      return NextResponse.json({ metadata: { industry: industryMetadata } })
    }

    // 2. Load competencies and mappings
    const [competencyMappingsResult, allCompetenciesResult] = await Promise.all([
      sql`SELECT industry_id, subcategory_id, competency_id FROM industry_competency_mappings;`,
      sql`SELECT id, name, description FROM competencies;`,
    ])

    const competencyMappings = competencyMappingsResult as {
      industry_id: string
      subcategory_id: string | null
      competency_id: string
    }[]

    const allCompetencies = allCompetenciesResult as {
      id: string
      name: string
      description: string
    }[]

    const relevantCompetencyIds = competencyMappings
      .filter((row) =>
        row.industry_id === industryId &&
        (!row.subcategory_id || row.subcategory_id === (subcategoryId ?? "default"))
      )
      .map((row) => row.competency_id)

    const selectedCompetencies = allCompetencies.filter((c) =>
      relevantCompetencyIds.includes(c.id)
    )

    // 3. Load focus areas (if subcategory is provided)
    const focusAreas = subcategoryId
      ? (await sql`
          SELECT id, name, enabled
          FROM focus_areas
          WHERE subcategory_id = ${subcategoryId};
        `) as {
          id: string
          name: string
          enabled: boolean
        }[]
      : []

    // 4. Static fallback traits
    const effectiveSubcategory = subcategoryId ?? "default"
    const traits = getIndustryTraits(industryId, effectiveSubcategory)

    // 5. Display names
    const industryDisplayName = industryMetadata[industryId]?.displayName || industryId
    const aiRoleLabel = industryMetadata[industryId]?.aiRoleLabel || null
    const aiRoleDescription = industryMetadata[industryId]?.aiRoleDescription || null
    const subcategoryKey = subcategoryId ?? "default"
    const subcategoryDisplayName =
      industryMetadata[industryId]?.subcategories?.[subcategoryKey]?.displayName || subcategoryKey

    return NextResponse.json({
      industry: industryId,
      industryDisplayName,
      aiRoleLabel,
      aiRoleDescription,
      subcategory: subcategoryId,
      subcategoryDisplayName,
      competencies: selectedCompetencies,
      focusAreas,
      traits,
      metadata: {
        industry: industryMetadata[industryId] || null,
      },
    })
  } catch (error) {
    console.error("Error fetching industry settings:", error)
    return NextResponse.json({ error: "Failed to fetch industry settings" }, { status: 500 })
  }
}

// --- Static fallback traits ---
function getIndustryTraits(industry: string, subcategory: string | null) {
  const baseTraits: {
    knowledgeAreas: string[]
    commonConcerns: string[]
    typicalGoals: string[]
    industryTerminology: string[]
    regulatoryConsiderations: string[]
  } = {
    knowledgeAreas: [],
    commonConcerns: [],
    typicalGoals: [],
    industryTerminology: [],
    regulatoryConsiderations: [],
  }

  if (industry === "insurance") {
    baseTraits.knowledgeAreas = [
      "Risk assessment", "Coverage options", "Policy terms", "Claims process", "Premium calculations"
    ]
    baseTraits.regulatoryConsiderations = [
      "State insurance regulations", "Policy disclosure requirements", "Licensing requirements"
    ]
    if (subcategory === "life-health") {
      baseTraits.commonConcerns = [
        "Family protection", "Healthcare costs", "Long-term care", "Income replacement", "Estate planning"
      ]
      baseTraits.typicalGoals = [
        "Protect family financially", "Cover medical expenses", "Plan for retirement", "Ensure children's education"
      ]
      baseTraits.industryTerminology = [
        "Premium", "Beneficiary", "Death benefit", "Cash value", "Term life", "Whole life", "Universal life",
        "Deductible", "Co-pay", "Out-of-pocket maximum", "Network provider"
      ]
    } else if (subcategory === "property-casualty") {
      baseTraits.commonConcerns = [
        "Property damage", "Liability risks", "Natural disasters", "Auto accidents", "Business interruption"
      ]
      baseTraits.typicalGoals = [
        "Protect home and assets", "Cover liability risks", "Ensure business continuity", "Manage auto risks"
      ]
      baseTraits.industryTerminology = [
        "Premium", "Deductible", "Liability coverage", "Comprehensive coverage", "Replacement cost",
        "Actual cash value", "Rider", "Endorsement", "Peril", "Exclusion", "Claim"
      ]
    } else {
      // Default insurance traits when no specific subcategory is selected
      baseTraits.commonConcerns = [
        "Risk management", "Coverage adequacy", "Policy terms", "Claims handling", "Cost management"
      ]
      baseTraits.typicalGoals = [
        "Protect assets", "Manage risks", "Ensure coverage", "Optimize costs", "Comply with regulations"
      ]
      baseTraits.industryTerminology = [
        "Premium", "Policy", "Coverage", "Claim", "Deductible", "Exclusion", "Endorsement", "Rider"
      ]
    }
  } else if (industry === "wealth-management") {
    baseTraits.knowledgeAreas = [
      "Investment strategies", "Asset allocation", "Retirement planning", "Tax optimization", "Estate planning"
    ]
    baseTraits.commonConcerns = [
      "Market volatility", "Retirement readiness", "Tax efficiency", "Wealth transfer", "Income generation"
    ]
    baseTraits.typicalGoals = [
      "Build retirement savings", "Generate passive income", "Minimize tax burden", "Leave legacy for heirs", "Fund education expenses"
    ]
    baseTraits.industryTerminology = [
      "Portfolio", "Asset allocation", "Diversification", "Risk tolerance", "Time horizon", "Fiduciary",
      "Fee structure", "Mutual fund", "ETF", "Bond", "Equity", "Yield", "Capital gain"
    ]
    baseTraits.regulatoryConsiderations = [
      "Fiduciary responsibility", "Investment advisor regulations", "Disclosure requirements"
    ]
  } else if (industry === "securities") {
    baseTraits.knowledgeAreas = [
      "Securities markets", "Trading strategies", "Technical analysis", "Fundamental analysis", "Risk management"
    ]
    baseTraits.commonConcerns = [
      "Market timing", "Trading costs", "Portfolio performance", "Risk exposure", "Market volatility"
    ]
    baseTraits.typicalGoals = [
      "Capital appreciation", "Active trading success", "Beat market benchmarks", "Sector-specific investments", "Alternative investment access"
    ]
    baseTraits.industryTerminology = [
      "Stock", "Bond", "Option", "Future", "Margin", "Short selling", "Limit order", "Market order",
      "Stop loss", "Dividend", "Earnings per share", "P/E ratio", "Market cap"
    ]
    baseTraits.regulatoryConsiderations = [
      "SEC regulations", "FINRA requirements", "Trading restrictions", "Insider trading rules"
    ]
  }

  return baseTraits
}
