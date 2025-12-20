import express from 'express';
import { engagementService } from '../services/engagement-service.ts';

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

// POST /api/engagement - Track engagement event
router.post('/', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { eventType, simulationId, eventData, sessionId } = req.body;

    // Validate required fields
    if (!eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: eventType'
      });
    }

    // Validate event type
    const validEventTypes = ['login', 'simulation_start', 'simulation_complete', 'page_view', 'interaction'];
    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`
      });
    }

    // Track engagement
    const engagement = await engagementService.trackEngagement({
      userId: user.id,
      eventType,
      simulationId: simulationId || null,
      eventData: eventData || null,
      sessionId: sessionId || null,
    });

    if (!engagement) {
      return res.status(400).json({ success: false, error: 'Failed to track engagement' });
    }

    return res.status(201).json({ success: true, engagement });
  } catch (error) {
    console.error('Track engagement error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track engagement'
    });
  }
});

// GET /api/engagement/stats - Get engagement statistics
router.get('/stats', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const userId = req.query.userId as string;

    // Non-admins can only view their own stats
    const targetUserId = (user.role === 'super_admin' || user.role === 'company_admin') && userId
      ? userId
      : user.id;

    const stats = await engagementService.getEngagementStats(targetUserId);

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Get engagement stats error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get engagement stats'
    });
  }
});

// GET /api/engagement/history - Get engagement history
router.get('/history', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    // Non-admins can only view their own history
    const targetUserId = (user.role === 'super_admin' || user.role === 'company_admin') && userId
      ? userId
      : user.id;

    const history = await engagementService.getEngagementHistory(
      targetUserId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit
    );

    return res.json({ success: true, history });
  } catch (error) {
    console.error('Get engagement history error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get engagement history'
    });
  }
});

export default router;
