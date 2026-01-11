import express from 'express';
import { simulationService } from '../services/simulation-service.ts';
import { simulationRepository } from '../db/repositories/simulation-repository.ts';
import { validateUUID } from '../utils/validation.ts';

const router = express.Router();

// Middleware to check authentication from Bearer token
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Get user from session token
    const { sessionRepository } = await import('../db/repositories/session-repository.ts');
    const session = await sessionRepository.findByToken(token);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }

    // Get user details
    const { userService } = await import('../services/user-service.ts');
    const user = await userService.getUserById(session.user_id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
}

// GET /api/simulation - Get user's simulations
router.get('/', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;

    // Get user's simulations
    const simulations = await simulationService.getUserStats(user.id);

    return res.json({ success: true, simulations });
  } catch (error) {
    console.error('Get simulations error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get simulations'
    });
  }
});

// POST /api/simulation - Start new simulation
router.post('/', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { industry, subcategory, difficulty, clientProfile, objectives } = req.body;

    console.log('[CREATE SIMULATION] Request body:', { industry, subcategory, difficulty, hasClientProfile: !!clientProfile });

    // Validate required fields
    if (!industry || !difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: industry, difficulty'
      });
    }

    // Start simulation
    const simulation = await simulationService.startSimulation({
      userId: user.id,
      industry,
      subcategory,
      difficulty_level: difficulty, // Can be text like "beginner" or number
      clientProfile: clientProfile || null,
      objectives: objectives || [],
    });

    if (!simulation) {
      return res.status(400).json({ success: false, error: 'Failed to start simulation' });
    }

    console.log('[CREATE SIMULATION] Created:', { id: simulation.id, simulation_id: (simulation as any).simulation_id });

    return res.status(201).json({ success: true, data: simulation });
  } catch (error) {
    console.error('Start simulation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start simulation'
    });
  }
});

// GET /api/simulation/:id - Get simulation by ID
router.get('/:id', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const simulationId = req.params.id;

    // Validate UUID
    if (!validateUUID(simulationId)) {
      return res.status(400).json({ success: false, error: 'Invalid simulation ID format' });
    }

    // Get simulation with details
    const simulation = await simulationService.getSimulationWithDetails(simulationId);

    if (!simulation) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    // Check if user owns this simulation (unless admin)
    if (simulation.user_id !== user.id && user.role !== 'super_admin' && user.role !== 'company_admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view this simulation' });
    }

    return res.json({ success: true, simulation });
  } catch (error) {
    console.error('Get simulation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get simulation'
    });
  }
});

// PUT /api/simulation/:id - Update simulation (add conversation message)
router.put('/:id', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const simulationId = req.params.id;

    // Validate UUID
    if (!validateUUID(simulationId)) {
      return res.status(400).json({ success: false, error: 'Invalid simulation ID format' });
    }

    // Get simulation to verify ownership
    const simulation = await simulationService.getSimulationById(simulationId);

    if (!simulation) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    // Check if user owns this simulation
    if (simulation.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this simulation' });
    }

    const { conversationHistory, objectives } = req.body;

    // Validate required fields
    if (!conversationHistory) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: conversationHistory'
      });
    }

    // Update conversation
    const updatedSimulation = await simulationService.updateConversation(
      simulationId,
      conversationHistory,
      objectives
    );

    if (!updatedSimulation) {
      return res.status(400).json({ success: false, error: 'Failed to update simulation' });
    }

    return res.json({ success: true, simulation: updatedSimulation });
  } catch (error) {
    console.error('Update simulation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update simulation'
    });
  }
});

// DELETE /api/simulation/:id - Delete simulation
router.delete('/:id', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const simulationId = req.params.id;

    // Validate UUID
    if (!validateUUID(simulationId)) {
      return res.status(400).json({ success: false, error: 'Invalid simulation ID format' });
    }

    // Get simulation to verify ownership
    const simulation = await simulationService.getSimulationById(simulationId);

    if (!simulation) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    // Check if user owns this simulation (or is admin)
    if (simulation.userId !== user.id && user.role !== 'super_admin' && user.role !== 'company_admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this simulation' });
    }

    // Delete simulation
    const success = await simulationService.deleteSimulation(simulationId);

    if (!success) {
      return res.status(400).json({ success: false, error: 'Failed to delete simulation' });
    }

    return res.json({ success: true, message: 'Simulation deleted successfully' });
  } catch (error) {
    console.error('Delete simulation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete simulation'
    });
  }
});

// PATCH /api/simulation/:id - Update simulation (conversation, objectives, XP)
router.patch('/:id', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const simulationId = req.params.id;

    console.log('[UPDATE SIMULATION] ID:', simulationId, 'Body keys:', Object.keys(req.body));

    // Validate UUID
    if (!validateUUID(simulationId)) {
      return res.status(400).json({ success: false, error: 'Invalid simulation ID format' });
    }

    // Get simulation to verify ownership
    const simulation = await simulationService.getSimulationById(simulationId);

    if (!simulation) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    // Check if user owns this simulation
    if (simulation.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this simulation' });
    }

    const { conversation_history, objectives_completed, total_xp } = req.body;

    // Update simulation
    const updatedSimulation = await simulationService.updateConversation(
      simulationId,
      conversation_history || simulation.conversation_history
    );

    // If objectives or XP provided, update those too
    if (objectives_completed !== undefined || total_xp !== undefined) {
      await simulationRepository.update(simulationId, {
        objectives_completed: objectives_completed !== undefined ? objectives_completed : simulation.objectives_completed,
        total_xp: total_xp !== undefined ? total_xp : (simulation as any).total_xp,
      });
    }

    console.log('[UPDATE SIMULATION] Updated successfully');

    return res.json({ success: true, data: updatedSimulation });
  } catch (error) {
    console.error('Update simulation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update simulation'
    });
  }
});

// POST /api/simulation/:id/complete - Complete simulation
router.post('/:id/complete', requireAuth, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const simulationId = req.params.id;

    // Validate UUID
    if (!validateUUID(simulationId)) {
      return res.status(400).json({ success: false, error: 'Invalid simulation ID format' });
    }

    // Get simulation to verify ownership
    const simulation = await simulationService.getSimulationById(simulationId);

    if (!simulation) {
      return res.status(404).json({ success: false, error: 'Simulation not found' });
    }

    // Check if user owns this simulation
    if (simulation.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to complete this simulation' });
    }

    const { total_xp, performance_review, duration_seconds } = req.body;

    console.log('[COMPLETE SIMULATION] Data:', { total_xp, hasPerfReview: !!performance_review, duration_seconds });

    // Complete simulation
    const completedSimulation = await simulationRepository.complete(
      simulationId,
      total_xp || 0,
      performance_review || {}
    );

    // Update duration if provided
    if (duration_seconds) {
      await simulationRepository.update(simulationId, { duration_seconds });
    }

    if (!completedSimulation) {
      return res.status(400).json({ success: false, error: 'Failed to complete simulation' });
    }

    return res.json({ success: true, simulation: completedSimulation });
  } catch (error) {
    console.error('Complete simulation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete simulation'
    });
  }
});

// POST /api/simulation/generate-review - Generate performance review
router.post('/generate-review', async (req: express.Request, res: express.Response) => {
  try {
    const { messages, competencies, difficultyLevel } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: messages (must be an array)'
      });
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    // Create a prompt for generating the review
    const systemPrompt = `You are an expert evaluator for financial advisor training simulations.
Analyze the conversation between the advisor (user) and the client (assistant) to generate a detailed performance review.

Difficulty Level: ${difficultyLevel || 'Not specified'}
Competencies Being Evaluated: ${Array.isArray(competencies) ? competencies.map((c: any) => c.name).join(', ') : 'General performance'}

Provide a comprehensive assessment of the advisor's performance with:
1. An overall score (1-10)
2. Scores for each competency (1-10)
3. Specific strengths demonstrated
4. Areas for improvement
5. A summary of the performance

Be specific, constructive, and reference actual moments from the conversation.`;

    const userPrompt = `Review this conversation and provide a detailed performance assessment.

Conversation:
${messages.map((m: any) => `${m.role === 'user' ? 'Advisor' : 'Client'}: ${m.content}`).join('\n\n')}

Generate a performance review with the following structure:
{
  "overallScore": <number 1-10>,
  "competencyScores": [${Array.isArray(competencies) ? competencies.map((c: any) => `{
    "name": "${c.name}",
    "score": <number 1-10>,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "expectation": "description of what was expected"
  }`).join(',') : ''}],
  "generalStrengths": ["overall strength 1", "overall strength 2", "overall strength 3"],
  "generalImprovements": ["overall improvement 1", "overall improvement 2", "overall improvement 3"],
  "summary": "overall performance summary"
}

IMPORTANT: Respond with ONLY the raw JSON object. Do NOT wrap it in markdown code blocks or backticks. Do NOT include any explanatory text before or after the JSON.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate review from AI'
      });
    }

    const data = await response.json();
    const reviewText = data.choices?.[0]?.message?.content;

    if (!reviewText) {
      return res.status(500).json({
        success: false,
        error: 'No review generated'
      });
    }

    // Parse the JSON response
    let reviewData;
    try {
      // Strip markdown code fences if present
      let cleanedText = reviewText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      reviewData = JSON.parse(cleanedText);

      // Ensure competencyScores is properly formatted
      if (reviewData.competencyScores) {
        if (!Array.isArray(reviewData.competencyScores)) {
          // Convert object format to array format
          const scoresArray = Object.entries(reviewData.competencyScores).map(([name, score]: [string, any]) => ({
            name,
            score: typeof score === 'number' ? score : (typeof score === 'object' ? score.score : 5),
            strengths: score.strengths || [],
            improvements: score.improvements || [],
            expectation: score.expectation || 'Performance assessment'
          }));
          reviewData.competencyScores = scoresArray;
        } else {
          // Handle array format like [{"Building Rapport": 2}]
          reviewData.competencyScores = reviewData.competencyScores.map((item: any) => {
            // If item already has name/score properties, return as is
            if (item.name && typeof item.score === 'number') {
              return {
                ...item,
                strengths: item.strengths || [],
                improvements: item.improvements || [],
                expectation: item.expectation || 'Performance assessment'
              };
            }
            // Otherwise, convert {competencyName: score} format
            const [name, score] = Object.entries(item)[0] as [string, any];
            return {
              name,
              score: typeof score === 'number' ? score : 5,
              strengths: [],
              improvements: [],
              expectation: 'Performance assessment'
            };
          });
        }
      } else {
        reviewData.competencyScores = [];
      }

      // Ensure other arrays have defaults
      if (!Array.isArray(reviewData.generalStrengths)) {
        reviewData.generalStrengths = [];
      }
      if (!Array.isArray(reviewData.generalImprovements)) {
        reviewData.generalImprovements = [];
      }
      if (typeof reviewData.overallScore !== 'number') {
        reviewData.overallScore = 5;
      }
    } catch (parseError) {
      console.error('Failed to parse review JSON:', reviewText);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse review data'
      });
    }

    return res.json({
      success: true,
      data: reviewData
    });
  } catch (error) {
    console.error('Generate review error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate review'
    });
  }
});

export default router;
