import express from 'express';
import { sql } from '../db/connection.ts';

const router = express.Router();

export interface DifficultyLevel {
  id: string;
  key: string;
  label: string;
  description: string;
  display_order: number;
}

// GET /api/difficulty - Get all difficulty levels
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const levels = await sql`
      SELECT id, "key", label, description, display_order
      FROM difficulty_levels
      ORDER BY display_order;
    `;

    return res.status(200).json({
      success: true,
      data: { levels }
    });
  } catch (error) {
    console.error('Error fetching difficulty levels:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch difficulty levels'
    });
  }
});

// GET /api/difficulty/:key - Get difficulty level by key
router.get('/:key', async (req: express.Request, res: express.Response) => {
  try {
    const { key } = req.params;

    const [level] = await sql`
      SELECT id, "key", label, description, display_order
      FROM difficulty_levels
      WHERE "key" = ${key}
      LIMIT 1;
    `;

    if (!level) {
      return res.status(404).json({
        success: false,
        error: 'Difficulty level not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { level }
    });
  } catch (error) {
    console.error(`Error fetching difficulty level with key ${req.params.key}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch difficulty level'
    });
  }
});

export default router;
