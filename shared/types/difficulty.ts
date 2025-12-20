export interface DifficultyLevel {
    id: string                   // UUID
    key: string                  // Unique key, e.g., "beginner", "intermediate"
    label: string                // Display label
    description?: string         // Optional long-form description
    display_order: number        // Used for sorting (1, 2, 3)
    created_at?: string          // Optional (timestamp)
    updated_at?: string          // Optional (timestamp)
  }
  