"use server"

import {
  getCompetenciesWithRubrics,
  addCompetencyWithRubrics,
  updateCompetencyWithRubrics,
  deleteCompetencyAndRubrics,
  type Competency,
  type RubricEntry,
} from "@/lib/competency-db"

export async function fetchCompetencies() {
  return getCompetenciesWithRubrics()
}

export async function addCompetency(competency: Competency & { rubric: RubricEntry[] }) {
  const success = await addCompetencyWithRubrics(competency, competency.rubric || [])
  return { success }
}

export async function updateCompetency(id: string, competency: Competency & { rubric: RubricEntry[] }) {
  const success = await updateCompetencyWithRubrics(id, competency, competency.rubric || [])
  return { success }
}

export async function deleteCompetency(id: string) {
  const success = await deleteCompetencyAndRubrics(id)
  return { success }
}

// You can remove this if you're not bulk-saving anymore
export async function saveAllCompetencies(competencies: (Competency & { rubric: RubricEntry[] })[]) {
  const results = await Promise.all(
    competencies.map((c) =>
      updateCompetencyWithRubrics(c.id, c, c.rubric || [])
    )
  )
  return { success: results.every(Boolean) }
}
