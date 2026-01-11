/**
 * Difficulty Levels Constants
 */

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

export const DIFFICULTY_LABELS = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Master',
} as const;

export const DIFFICULTY_DESCRIPTIONS = {
  1: 'Basic scenarios for new learners',
  2: 'Moderate complexity with some challenges',
  3: 'Complex scenarios requiring experience',
  4: 'Very challenging situations',
  5: 'Maximum difficulty for experts',
} as const;
