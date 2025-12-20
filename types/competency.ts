import type { RubricEntry } from "./rubric"

export interface Competency {
    id: string
    name: string
    description?: string
  }
  
  export interface CompetencyWithRubrics extends Competency {
    rubrics: RubricEntry[] // import this
  }
  