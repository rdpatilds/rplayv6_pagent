import express from 'express';
import { industryService } from '../services/industry-service.ts';

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

// GET /api/industry-settings - Get all industry settings
router.get('/', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const industryCompetencies = await industryService.getIndustryCompetencies();
    const industryMetadata = await industryService.getIndustryMetadata();
    const difficultySettings = await industryService.getDifficultySettings();

    return res.json({
      success: true,
      data: {
        industryCompetencies,
        industryMetadata,
        difficultySettings
      }
    });
  } catch (error) {
    console.error('Get industry settings error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get industry settings'
    });
  }
});

// GET /api/industry-settings/competencies - Get industry competencies mappings
router.get('/competencies', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const industryCompetencies = await industryService.getIndustryCompetencies();

    return res.json({
      success: true,
      data: industryCompetencies
    });
  } catch (error) {
    console.error('Get industry competencies error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get industry competencies'
    });
  }
});

// GET /api/industry-settings/metadata - Get industry metadata
router.get('/metadata', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const industryMetadata = await industryService.getIndustryMetadata();

    return res.json({
      success: true,
      data: industryMetadata
    });
  } catch (error) {
    console.error('Get industry metadata error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get industry metadata'
    });
  }
});

// GET /api/industry-settings/difficulty - Get difficulty settings
router.get('/difficulty', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const difficultySettings = await industryService.getDifficultySettings();

    return res.json({
      success: true,
      data: difficultySettings
    });
  } catch (error) {
    console.error('Get difficulty settings error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get difficulty settings'
    });
  }
});

// PUT /api/industry-settings/competencies/:industry/:subcategory - Update industry/subcategory competencies
router.put('/competencies/:industry/:subcategory', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { industry, subcategory } = req.params;
    const { competencyIds } = req.body;

    if (!Array.isArray(competencyIds)) {
      return res.status(400).json({
        success: false,
        error: 'competencyIds must be an array'
      });
    }

    const success = await industryService.updateIndustrySubcategoryCompetencies(
      industry,
      subcategory,
      competencyIds
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update industry subcategory competencies'
      });
    }

    return res.json({ success: true, message: 'Industry subcategory competencies updated successfully' });
  } catch (error) {
    console.error('Update industry subcategory competencies error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update industry subcategory competencies'
    });
  }
});

// PUT /api/industry-settings/focus-area/:industry/:subcategory/:focusArea - Update focus area competencies
router.put('/focus-area/:industry/:subcategory/:focusArea', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { industry, subcategory, focusArea } = req.params;
    const { competencyIds, enabled } = req.body;

    if (!Array.isArray(competencyIds)) {
      return res.status(400).json({
        success: false,
        error: 'competencyIds must be an array'
      });
    }

    const success = await industryService.updateFocusAreaCompetencies(
      industry,
      subcategory,
      focusArea,
      competencyIds,
      enabled !== undefined ? enabled : true
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update focus area competencies'
      });
    }

    return res.json({ success: true, message: 'Focus area competencies updated successfully' });
  } catch (error) {
    console.error('Update focus area competencies error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update focus area competencies'
    });
  }
});

// PUT /api/industry-settings/difficulty/:industry - Save difficulty settings for industry
router.put('/difficulty/:industry', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { industry } = req.params;
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty settings format'
      });
    }

    const success = await industryService.saveDifficultySettings(industry, settings);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save difficulty settings'
      });
    }

    return res.json({ success: true, message: 'Difficulty settings saved successfully' });
  } catch (error) {
    console.error('Save difficulty settings error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save difficulty settings'
    });
  }
});

// PUT /api/industry-settings/metadata - Save full industry metadata
router.put('/metadata', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const data = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid metadata format'
      });
    }

    const success = await industryService.saveIndustryMetadata(data);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save industry metadata'
      });
    }

    return res.json({ success: true, message: 'Industry metadata saved successfully' });
  } catch (error) {
    console.error('Save industry metadata error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save industry metadata'
    });
  }
});

// PUT /api/industry-settings/competencies - Save full industry competencies
router.put('/competencies', requireAuth, requireAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const data = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid competencies format'
      });
    }

    const success = await industryService.saveIndustryCompetencies(data);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save industry competencies'
      });
    }

    return res.json({ success: true, message: 'Industry competencies saved successfully' });
  } catch (error) {
    console.error('Save industry competencies error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save industry competencies'
    });
  }
});

export default router;
