// lib/difficulty-db.ts
import { sql } from "@/lib/db";

export interface DifficultyLevel {
  id: string;
  key: string;
  label: string;
  description: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export async function getDifficultyLevels(): Promise<DifficultyLevel[]> {
  try {
    const levels = await sql`
      SELECT id, "key", label, description, display_order
      FROM difficulty_levels
      ORDER BY display_order;
    `;
    return levels as DifficultyLevel[];
  } catch (error) {
    console.error("Error fetching difficulty levels:", error);
    return [];
  }
}

export async function getDifficultyLevelByKey(key: string): Promise<DifficultyLevel | null> {
  try {
    const [level] = await sql`
      SELECT id, "key", label, description, display_order
      FROM difficulty_levels
      WHERE "key" = ${key}
      LIMIT 1;
    `;
    return level as DifficultyLevel || null;
  } catch (error) {
    console.error(`Error fetching difficulty level with key ${key}:`, error);
    return null;
  }
}
