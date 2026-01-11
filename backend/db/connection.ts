/**
 * Database Connection
 * Centralized database connection using Neon serverless driver
 */

import { neon } from '@neondatabase/serverless';

// Validate that DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create SQL client using Neon serverless driver
export const sql = neon(process.env.DATABASE_URL);

// Export type for SQL client
export type SQL = typeof sql;
