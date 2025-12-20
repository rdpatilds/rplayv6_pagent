export interface RubricEntry {
    id: string               // UUID (primary key)
    competency_id: string    // Foreign key to competencies (text)
    score_range: string      // e.g., "0–4", "8–9"
    criteria: string         // One combined criteria block (stored as text)
  }
  