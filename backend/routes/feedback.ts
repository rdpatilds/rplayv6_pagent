import express from 'express';
import { feedbackService } from '../services/feedback-service.ts';
import { validateUUID } from '../utils/validation.ts';

const router = express.Router();

// Middleware to check authentication from Bearer token
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { sessionRepository } = await import('../db/repositories/session-repository.ts');
    const session = await sessionRepository.findByToken(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }

    const { userService } = await import('../services/user-service.ts');
    const user = await userService.getUserById(session.user_id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// GET /api/feedback - Get feedback with optional filters
router.get('/', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const simulationId = req.query.simulationId as string;
    const userId = req.query.userId as string;
    const competencyId = req.query.competencyId as string;
    const feedbackType = req.query.feedbackType as string;

    // Build filter object
    const filters: any = {};
    if (simulationId) filters.simulationId = simulationId;
    if (userId) filters.userId = userId;
    else if (user.role !== 'super_admin' && user.role !== 'company_admin') {
      filters.userId = user.id; // Non-admins can only see their own feedback
    }
    if (competencyId) filters.competencyId = competencyId;
    if (feedbackType) filters.feedbackType = feedbackType;

    const feedback = await feedbackService.getFeedback(filters);

    return res.json({ success: true, feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feedback'
    });
  }
});

// POST /api/feedback - Create feedback
router.post('/', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { simulationId, competencyId, rating, comments, feedbackType } = req.body;

    // Validate required fields
    if (!simulationId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: simulationId, rating'
      });
    }

    // Validate rating range
    if (typeof rating !== 'number' || rating < 0 || rating > 100) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be a number between 0 and 100'
      });
    }

    // Validate feedback type if provided
    if (feedbackType) {
      const validTypes = ['ai_generated', 'user_submitted', 'peer_review'];
      if (!validTypes.includes(feedbackType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid feedback type. Must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Create feedback
    const feedback = await feedbackService.createFeedback({
      simulation_id: simulationId,
      user_id: user.id,
      competency_id: competencyId || null,
      rating,
      comments: comments || null,
      feedback_type: feedbackType || 'user_submitted',
    });

    if (!feedback) {
      return res.status(400).json({ success: false, error: 'Failed to create feedback' });
    }

    return res.status(201).json({ success: true, feedback });
  } catch (error) {
    console.error('Create feedback error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create feedback'
    });
  }
});

// GET /api/feedback/nps-stats - Get NPS statistics
router.get('/nps-stats', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const stats = await feedbackService.getNPSStats();

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Get NPS stats error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get NPS stats'
    });
  }
});

export default router;
