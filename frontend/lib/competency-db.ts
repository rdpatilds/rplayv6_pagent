import { sql } from "./db"
 // assuming you're using the shared sql/query helper
import type { RubricEntry } from "@/types/rubric"
import type { Competency } from "@/types/competency"

// 1. Get all competencies with their rubric entries
export async function getCompetenciesWithRubrics(): Promise<(Competency & { rubrics: RubricEntry[] })[]> {
  const competencies = await sql`SELECT * FROM competencies
  `

  const rubrics = await sql`SELECT * FROM rubric_entries
  `

  const rubricMap = rubrics.reduce<Record<string, RubricEntry[]>>((acc, entry) => {
    if (!acc[entry.competency_id]) acc[entry.competency_id] = []
    acc[entry.competency_id].push(entry)
    return acc
  }, {})

  return competencies.map((competency) => ({
    ...competency,
    rubrics: rubricMap[competency.id] || [],
  }))
}


// 2. Add a competency and rubric entries
export async function addCompetencyWithRubrics(
  competency: Competency,
  rubric: RubricEntry[],
): Promise<boolean> {
  await sql`
    INSERT INTO competencies (id, name, description)
    VALUES (${competency.id}, ${competency.name}, ${competency.description})
  `

  for (const entry of rubric) {
    await sql`
      INSERT INTO rubric_entries (id, competency_id, score_range, criteria)
      VALUES (${entry.id}, ${competency.id}, ${entry.score_range}, ${entry.criteria})
    `
  }

  return true
}

// 3. Update competency and replace rubric entries
export async function updateCompetencyWithRubrics(
  id: string,
  updated: Competency,
  rubric: RubricEntry[],
): Promise<boolean> {
  await sql`
    UPDATE competencies SET name = ${updated.name}, description = ${updated.description}
    WHERE id = ${id}
  `

  await sql`DELETE FROM rubric_entries WHERE competency_id = ${id}`

  for (const entry of rubric) {
    await sql`
      INSERT INTO rubric_entries (id, competency_id, score_range, criteria)
      VALUES (${entry.id}, ${id}, ${entry.score_range}, ${entry.criteria})
    `
  }

  return true
}

// 4. Delete competency and cascade rubric entries
export async function deleteCompetencyAndRubrics(id: string): Promise<boolean> {
  await sql`DELETE FROM competencies WHERE id = ${id}`
  return true
}

