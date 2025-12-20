/**
 * Database exports
 * Re-export database connection and utilities
 */

import { sql as neonSql } from './connection.ts';

// Export sql client
export const sql = neonSql;
export const db = neonSql; // Alias for convenience
export * from './repositories/user-repository.ts';
export * from './repositories/competency-repository.ts';
export * from './repositories/parameter-repository.ts';
export * from './repositories/session-repository.ts';
export * from './repositories/feedback-repository.ts';
export * from './repositories/engagement-repository.ts';
export * from './repositories/simulation-repository.ts';
export * from './repositories/rubric-repository.ts';
