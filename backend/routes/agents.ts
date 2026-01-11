/**
 * Agent Routes
 * API endpoints for Azure AI Agent interactions
 */

import express from 'express';
import {
  simulationClientAgent,
  profileGenerationAgent,
  evaluationAgent,
  expertGuidanceAgent,
  getAgentStatus,
  areAgentsAvailable,
  BaseAgent,
  type ChatMessage,
  type SimulationContext,
  type ProfileGenerationRequest,
  type EvaluationRequest,
  type GuidanceRequest,
} from '../agents/index.js';
import { isAzureConfigured } from '../config/index.js';

const router = express.Router();

/**
 * GET /api/agents/health
 * Get agent health and status
 */
router.get('/health', (req, res) => {
  const status = getAgentStatus();
  res.json({
    configured: status.azureConfigured,
    available: areAgentsAvailable(),
    client: status.azureClient,
    agents: status.agents,
  });
});

/**
 * POST /api/agents/chat/client
 * Generate client response using Simulation Client Agent
 */
router.post('/chat/client', async (req, res) => {
  try {
    const {
      messages,
      clientProfile,
      personalitySettings,
      simulationSettings,
      emotionalState,
      sessionId,
    } = req.body;

    // Validate required fields
    if (!messages || !clientProfile || !simulationSettings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: messages, clientProfile, simulationSettings',
      });
    }

    // Check if agents are available
    if (!areAgentsAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Azure AI Agents not available. Use OpenAI fallback.',
        fallback: true,
      });
    }

    // Build simulation context
    const context: SimulationContext = {
      sessionId: sessionId || `session-${Date.now()}`,
      clientProfile,
      personalitySettings: personalitySettings || {
        mood: 'neutral',
        archetype: 'Standard Client',
        traits: { openness: 50, agreeableness: 50, conscientiousness: 50, neuroticism: 50, extraversion: 50 },
        influence: 'balanced',
      },
      simulationSettings,
      emotionalState,
    };

    // Generate response
    const response = await simulationClientAgent.generateResponse(messages, context);

    return res.json({
      success: response.success,
      message: response.message,
      objectiveProgress: response.objectiveProgress,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('[AgentRoutes] Client chat error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      fallback: true,
    });
  }
});

/**
 * POST /api/agents/chat/client/stream
 * Generate client response with SSE streaming
 */
router.post('/chat/client/stream', async (req, res) => {
  try {
    const {
      messages,
      clientProfile,
      personalitySettings,
      simulationSettings,
      emotionalState,
      sessionId,
    } = req.body;

    // Validate required fields
    if (!messages || !clientProfile || !simulationSettings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if agents are available
    if (!areAgentsAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Azure AI Agents not available',
        fallback: true,
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build context
    const context: SimulationContext = {
      sessionId: sessionId || `session-${Date.now()}`,
      clientProfile,
      personalitySettings: personalitySettings || {
        mood: 'neutral',
        archetype: 'Standard Client',
        traits: { openness: 50, agreeableness: 50, conscientiousness: 50, neuroticism: 50, extraversion: 50 },
        influence: 'balanced',
      },
      simulationSettings,
      emotionalState,
    };

    // Set context
    simulationClientAgent.setContext(context.sessionId, context);

    // Stream response
    for await (const event of simulationClientAgent.chatStream(messages, context)) {
      res.write(BaseAgent.formatSSE(event));
    }

    res.end();
  } catch (error) {
    console.error('[AgentRoutes] Client stream error:', error);
    res.write(BaseAgent.formatSSE({
      type: 'error',
      data: { error: error instanceof Error ? error.message : 'Stream error' },
    }));
    res.end();
  }
});

/**
 * POST /api/agents/chat/expert
 * Generate expert guidance using Expert Guidance Agent
 */
router.post('/chat/expert', async (req, res) => {
  try {
    const {
      messages,
      clientProfile,
      personalitySettings,
      simulationSettings,
      objectives,
      sessionId,
    } = req.body;

    // Validate required fields
    if (!messages || !clientProfile || !simulationSettings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if agents are available
    if (!areAgentsAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Azure AI Agents not available. Use OpenAI fallback.',
        fallback: true,
      });
    }

    // Build guidance request
    const request: GuidanceRequest = {
      messages,
      clientProfile,
      personalitySettings: personalitySettings || {
        mood: 'neutral',
        archetype: 'Standard Client',
        traits: {},
        influence: 'balanced',
      },
      simulationSettings,
      objectives,
      sessionId: sessionId || `session-${Date.now()}`,
    };

    // Generate guidance
    const response = await expertGuidanceAgent.generateGuidance(request);

    return res.json({
      success: response.success,
      message: response.message,
      tier: response.tier,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('[AgentRoutes] Expert chat error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      fallback: true,
    });
  }
});

/**
 * POST /api/agents/profile/generate
 * Generate client profile using Profile Generation Agent
 */
router.post('/profile/generate', async (req, res) => {
  try {
    const {
      industry,
      subcategory,
      difficulty,
      focusAreas,
      existingProfiles,
    } = req.body;

    // Validate required fields
    if (!industry || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: industry, difficulty',
      });
    }

    // Check if agents are available
    if (!areAgentsAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Azure AI Agents not available. Use OpenAI fallback.',
        fallback: true,
      });
    }

    // Build profile request
    const request: ProfileGenerationRequest = {
      industry,
      subcategory,
      difficulty,
      focusAreas,
      existingProfiles,
    };

    // Generate profile
    const response = await profileGenerationAgent.generateProfile(request);

    return res.json({
      success: response.success,
      profile: response.profile,
      message: response.message,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('[AgentRoutes] Profile generation error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      fallback: true,
    });
  }
});

/**
 * POST /api/agents/evaluation/review
 * Generate performance review using Evaluation Agent
 */
router.post('/evaluation/review', async (req, res) => {
  try {
    const {
      messages,
      competencies,
      difficulty,
      rubrics,
    } = req.body;

    // Validate required fields
    if (!messages || !competencies || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: messages, competencies, difficulty',
      });
    }

    // Check if agents are available
    if (!areAgentsAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Azure AI Agents not available. Use OpenAI fallback.',
        fallback: true,
      });
    }

    // Build evaluation request
    const request: EvaluationRequest = {
      messages,
      competencies,
      difficulty,
      rubrics,
    };

    // Generate review
    const response = await evaluationAgent.generateReview(request);

    return res.json({
      success: response.success,
      review: response.review,
      message: response.message,
      metadata: response.metadata,
    });
  } catch (error) {
    console.error('[AgentRoutes] Evaluation error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      fallback: true,
    });
  }
});

/**
 * POST /api/agents/initialize
 * Manually initialize agents (for admin use)
 */
router.post('/initialize', async (req, res) => {
  try {
    if (!isAzureConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Azure is not configured',
      });
    }

    const { initializeAgents } = await import('../agents/index.ts');
    const result = await initializeAgents();

    return res.json(result);
  } catch (error) {
    console.error('[AgentRoutes] Initialization error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Initialization failed',
    });
  }
});

export default router;
