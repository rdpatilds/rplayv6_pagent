import { sql } from "@/lib/db"
import type { RubricEntry } from "@/types/rubric"

export async function getRubricEntries() {
  return await sql<RubricEntry[]>`
    SELECT * FROM rubric_entries
  `
}

export async function getRubricEntriesByCompetency(competencyId: string) {
  return await sql<RubricEntry[]>`
    SELECT * FROM rubric_entries
    WHERE competency_id = ${competencyId}
    ORDER BY score_range ASC
  `
}

export async function saveRubricEntry(entry: RubricEntry) {
  const result = await sql`
    INSERT INTO rubric_entries (id, competency_id, score_range, criteria)
    VALUES (${entry.id}, ${entry.competency_id}, ${entry.score_range}, ${entry.criteria})
    ON CONFLICT (id) DO UPDATE
    SET score_range = ${entry.score_range}, criteria = ${entry.criteria}
  `
  return { success: result.count > 0 }
}

export async function deleteRubricEntry(id: string) {
  const result = await sql`
    DELETE FROM rubric_entries WHERE id = ${id}
  `
  return { success: result.count > 0 }
}

