import express from 'express';
import { competencyService } from '../services/competency-service.ts';
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

// GET /api/competencies/industry - Get industry metadata and competencies (no auth required)
router.get('/industry', async (req: express.Request, res: express.Response) => {
  try {
    const { readJSONFile } = await import('../utils/file-storage.ts');

    // Load industry competencies and metadata from shared/data
    const industryCompetencies = readJSONFile('industry-competencies.json');
    const industryMetadata = readJSONFile('industry-metadata.json');

    return res.json({ success: true, data: { industryCompetencies, industryMetadata } });
  } catch (error) {
    console.error('Get industry metadata error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get industry metadata'
    });
  }
});

// GET /api/competencies - Get all competencies or filtered (no auth required for basic access)
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const industry = req.query.industry as string;
    const category = req.query.category as string;

    let competencies;

    if (industry) {
      competencies = await competencyService.getCompetenciesByIndustry(industry);
    } else if (category) {
      competencies = await competencyService.getCompetenciesByCategory(category);
    } else {
      competencies = await competencyService.getAllCompetencies();
    }

    return res.json({ success: true, competencies });
  } catch (error) {
    console.error('Get competencies error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get competencies'
    });
  }
});

// POST /api/competencies - Create new competency (admin only)
router.post('/', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { name, description, category, weight, industry } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category'
      });
    }

    // Validate weight if provided
    if (weight !== undefined && (weight < 0 || weight > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Weight must be between 0 and 100'
      });
    }

    // Create competency
    const competency = await competencyService.createCompetency({
      name,
      description: description || null,
      category,
      weight: weight || 10,
      industry: industry || null,
    });

    if (!competency) {
      return res.status(400).json({ success: false, error: 'Failed to create competency' });
    }

    return res.status(201).json({ success: true, competency });
  } catch (error) {
    console.error('Create competency error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create competency'
    });
  }
});

// GET /api/competencies/:id - Get competency by ID
router.get('/:id', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const competencyId = req.params.id;

    // Validate UUID
    if (!validateUUID(competencyId)) {
      return res.status(400).json({ success: false, error: 'Invalid competency ID format' });
    }

    // Get competency
    const competency = await competencyService.getCompetencyById(competencyId);

    if (!competency) {
      return res.status(404).json({ success: false, error: 'Competency not found' });
    }

    return res.json({ success: true, competency });
  } catch (error) {
    console.error('Get competency error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get competency'
    });
  }
});

// PUT /api/competencies/:id - Update competency (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const competencyId = req.params.id;

    // Validate UUID
    if (!validateUUID(competencyId)) {
      return res.status(400).json({ success: false, error: 'Invalid competency ID format' });
    }

    const { name, description, category, weight, industry } = req.body;

    // Validate weight if provided
    if (weight !== undefined && (weight < 0 || weight > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Weight must be between 0 and 100'
      });
    }

    // Update competency
    const updatedCompetency = await competencyService.updateCompetency(competencyId, {
      name,
      description,
      category,
      weight,
      industry,
    });

    if (!updatedCompetency) {
      return res.status(404).json({ success: false, error: 'Competency not found' });
    }

    return res.json({ success: true, competency: updatedCompetency });
  } catch (error) {
    console.error('Update competency error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update competency'
    });
  }
});

// DELETE /api/competencies/:id - Delete competency (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const competencyId = req.params.id;

    // Validate UUID
    if (!validateUUID(competencyId)) {
      return res.status(400).json({ success: false, error: 'Invalid competency ID format' });
    }

    // Delete competency
    const success = await competencyService.deleteCompetency(competencyId);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Competency not found' });
    }

    return res.json({ success: true, message: 'Competency deleted successfully' });
  } catch (error) {
    console.error('Delete competency error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete competency'
    });
  }
});

export default router;
