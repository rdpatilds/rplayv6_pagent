import express from 'express';
import { parameterService } from '../services/parameter-service.ts';
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

// Middleware to check admin role
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== 'super_admin' && user.role !== 'company_admin')) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

// GET /api/parameters - Get all parameters or filtered by category/type
router.get('/', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const categoryId = req.query.categoryId as string;
    const type = req.query.type as string;

    let parameters;

    // Filter by category or type
    if (categoryId) {
      parameters = await parameterService.getParametersByCategory(categoryId);
    } else if (type) {
      parameters = await parameterService.getParametersByType(type as any);
    } else {
      parameters = await parameterService.getAllParameters();
    }

    return res.json({ success: true, parameters });
  } catch (error) {
    console.error('Get parameters error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get parameters'
    });
  }
});

// POST /api/parameters - Create new parameter (admin only)
router.post('/', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { name, type, categoryId, value, description, metadata } = req.body;

    // Validate required fields
    if (!name || !type || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, categoryId'
      });
    }

    // Validate type
    const validTypes = ['structured', 'narrative', 'guardrails'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create parameter
    const parameter = await parameterService.createParameter({
      name,
      type,
      categoryId,
      value: value || null,
      description: description || null,
      metadata: metadata || null,
    });

    if (!parameter) {
      return res.status(400).json({ success: false, error: 'Failed to create parameter' });
    }

    return res.status(201).json({ success: true, parameter });
  } catch (error) {
    console.error('Create parameter error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create parameter'
    });
  }
});

// POST /api/parameters/reset - Reset parameters to defaults (admin only)
router.post('/reset', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    // Reset parameters to defaults
    await parameterService.resetToDefaults();

    return res.json({
      success: true,
      message: 'Parameters reset to defaults successfully'
    });
  } catch (error) {
    console.error('Reset parameters error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset parameters'
    });
  }
});

// GET /api/parameters/:id - Get parameter by ID
router.get('/:id', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const parameterId = req.params.id;

    // Validate UUID
    if (!validateUUID(parameterId)) {
      return res.status(400).json({ success: false, error: 'Invalid parameter ID format' });
    }

    // Get parameter
    const parameter = await parameterService.getParameterById(parameterId);

    if (!parameter) {
      return res.status(404).json({ success: false, error: 'Parameter not found' });
    }

    return res.json({ success: true, parameter });
  } catch (error) {
    console.error('Get parameter error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get parameter'
    });
  }
});

// PATCH /api/parameters/:id - Update parameter (admin only)
router.patch('/:id', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const parameterId = req.params.id;

    // Validate UUID
    if (!validateUUID(parameterId)) {
      return res.status(400).json({ success: false, error: 'Invalid parameter ID format' });
    }

    const { name, type, value, description, metadata } = req.body;

    // Validate type if provided
    if (type) {
      const validTypes = ['structured', 'narrative', 'guardrails'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Update parameter
    const updatedParameter = await parameterService.updateParameter(parameterId, {
      name,
      type,
      value,
      description,
      metadata,
    });

    if (!updatedParameter) {
      return res.status(404).json({ success: false, error: 'Parameter not found' });
    }

    return res.json({ success: true, parameter: updatedParameter });
  } catch (error) {
    console.error('Update parameter error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update parameter'
    });
  }
});

// DELETE /api/parameters/:id - Delete parameter (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const parameterId = req.params.id;

    // Validate UUID
    if (!validateUUID(parameterId)) {
      return res.status(400).json({ success: false, error: 'Invalid parameter ID format' });
    }

    // Delete parameter
    const success = await parameterService.deleteParameter(parameterId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Parameter not found' });
    }

    return res.json({ success: true, message: 'Parameter deleted successfully' });
  } catch (error) {
    console.error('Delete parameter error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete parameter'
    });
  }
});

export default router;
