/**
 * File Storage Utility
 * Handles reading and writing JSON files safely
 */

import fs from 'fs';
import path from 'path';

// Shared data directory path (relative to backend root)
const SHARED_DATA_DIR = path.join(process.cwd(), '..', '..', 'shared', 'data');

console.log('[FILE STORAGE] Data directory:', SHARED_DATA_DIR);

/**
 * Read JSON file
 */
export function readJSONFile<T>(filename: string): T {
  try {
    const filePath = path.join(SHARED_DATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`[FILE STORAGE] File not found: ${filePath}, returning empty object/array`);
      // Return empty array or object based on filename convention
      return (filename.includes('competencies') || filename.includes('rubrics') ? [] : {}) as T;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`[FILE STORAGE] Error reading ${filename}:`, error);
    throw error;
  }
}

/**
 * Write JSON file atomically (write to temp file, then rename)
 */
export function writeJSONFile<T>(filename: string, data: T): void {
  try {
    const filePath = path.join(SHARED_DATA_DIR, filename);
    const tempPath = `${filePath}.tmp`;

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to temp file
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');

    // Atomic rename
    fs.renameSync(tempPath, filePath);

    console.log(`[FILE STORAGE] Successfully wrote ${filename}`);
  } catch (error) {
    console.error(`[FILE STORAGE] Error writing ${filename}:`, error);
    throw error;
  }
}

/**
 * Check if file exists
 */
export function fileExists(filename: string): boolean {
  const filePath = path.join(SHARED_DATA_DIR, filename);
  return fs.existsSync(filePath);
}

/**
 * Get data directory path
 */
export function getDataDir(): string {
  return SHARED_DATA_DIR;
}
