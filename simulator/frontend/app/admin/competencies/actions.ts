"use server"

import { competenciesApi } from "@/lib/api/competencies-api";

export interface RubricEntry {
  id: string;
  competency_id: string;
  score_range: string;
  criteria: string;
}

export interface Competency {
  id: string;
  name: string;
  description?: string;
  category?: string;
  weight?: number;
}

export async function fetchCompetencies() {
  try {
    const response = await competenciesApi.getAll();
    if (!response.success) {
      throw new Error('Failed to fetch competencies');
    }

    // Map API response to include empty rubrics array for compatibility
    return response.competencies.map(comp => ({
      ...comp,
      rubrics: [] as RubricEntry[],
    }));
  } catch (error) {
    console.error('Error fetching competencies:', error);
    return [];
  }
}

export async function addCompetency(competency: Competency & { rubric?: RubricEntry[] }) {
  try {
    const response = await competenciesApi.create({
      name: competency.name,
      description: competency.description,
      category: competency.category || 'General',
      weight: competency.weight || 10,
    });
    return { success: response.success };
  } catch (error) {
    console.error('Error adding competency:', error);
    return { success: false };
  }
}

export async function updateCompetency(id: string, competency: Competency & { rubric?: RubricEntry[] }) {
  try {
    const response = await competenciesApi.update(id, {
      name: competency.name,
      description: competency.description,
      category: competency.category,
      weight: competency.weight,
    });
    return { success: response.success };
  } catch (error) {
    console.error('Error updating competency:', error);
    return { success: false };
  }
}

export async function deleteCompetency(id: string) {
  try {
    const response = await competenciesApi.delete(id);
    return { success: response.success };
  } catch (error) {
    console.error('Error deleting competency:', error);
    return { success: false };
  }
}

export async function saveAllCompetencies(competencies: (Competency & { rubric?: RubricEntry[] })[]) {
  try {
    const results = await Promise.all(
      competencies.map((c) =>
        competenciesApi.update(c.id, {
          name: c.name,
          description: c.description,
          category: c.category,
          weight: c.weight,
        })
      )
    );
    return { success: results.every(r => r.success) };
  } catch (error) {
    console.error('Error saving competencies:', error);
    return { success: false };
  }
}
