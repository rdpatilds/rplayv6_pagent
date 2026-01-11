/**
 * Backend Server Entry Point
 * Simple Express server that serves the API routes
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config, isAzureConfigured } from './config/index.ts';
import authRouter from './routes/auth.ts';
import usersRouter from './routes/users.ts';
import simulationRouter from './routes/simulation.ts';
import parametersRouter from './routes/parameters.ts';
import competenciesRouter from './routes/competencies.ts';
import feedbackRouter from './routes/feedback.ts';
import engagementRouter from './routes/engagement.ts';
import difficultyRouter from './routes/difficulty.ts';
import chatRouter from './routes/chat.ts';
import industrySettingsRouter from './routes/industry-settings.ts';
import agentsRouter from './routes/agents.js';
import { WebSocketTTSService } from './services/websocket-tts-service.js';
import { initializeAgents, getAgentStatus } from './agents/index.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    config.app.url,
    'http://localhost:3000',
    'http://localhost:3002',
    'http://192.168.0.113:3000',
    'http://192.168.0.113:3002',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Query:`, req.query, '- Body:', req.body ? Object.keys(req.body) : 'none');
  next();
});

// Initialize TTS Service
const corsOrigins = [
  config.app.url,
  'http://localhost:3000',
  'http://localhost:3002',
  'http://192.168.0.113:3000',
  'http://192.168.0.113:3002',
];

const ttsService = new WebSocketTTSService(
  httpServer,
  process.env.OPENAI_API_KEY || '',
  corsOrigins
);

// Health check endpoint
app.get('/health', (req, res) => {
  const agentStatus = getAgentStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.app.environment,
    tts: {
      enabled: !!process.env.OPENAI_API_KEY,
      activeConnections: ttsService.getStats().activeConnections,
    },
    agents: {
      configured: agentStatus.azureConfigured,
      initialized: agentStatus.azureClient.initialized,
      count: agentStatus.agents.filter(a => a.initialized).length,
    },
  });
});

// Database connection test
app.get('/api/health/db', async (req, res) => {
  try {
    // Simple database connection test
    const { sql } = await import('./db/index.ts');
    await sql`SELECT 1 as test`;
    res.json({
      status: 'connected',
      database: 'postgresql (Neon)',
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed'
    });
  }
});

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/parameters', parametersRouter);
app.use('/api/competencies', competenciesRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/engagement', engagementRouter);
app.use('/api/difficulty', difficultyRouter);
app.use('/api/chat', chatRouter);
app.use('/api/industry-settings', industrySettingsRouter);
app.use('/api/agents', agentsRouter);

// TTS stats endpoint
app.get('/api/tts/stats', (req, res) => {
  res.json(ttsService.getStats());
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'AI Simulation Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dbHealth: '/api/health/db',
      auth: '/api/auth/*',
      users: '/api/users/*',
      simulation: '/api/simulation/*',
      parameters: '/api/parameters/*',
      competencies: '/api/competencies/*',
      feedback: '/api/feedback/*',
      engagement: '/api/engagement/*',
      difficulty: '/api/difficulty/*',
      chat: '/api/chat/*',
      industrySettings: '/api/industry-settings/*',
      agents: '/api/agents/*',
      tts: '/api/tts/stats',
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('✓ Backend server running');
  console.log(`✓ Port: ${PORT}`);
  console.log(`✓ Environment: ${config.app.environment}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ DB Health: http://localhost:${PORT}/api/health/db`);
  console.log(`✓ Agents Health: http://localhost:${PORT}/api/agents/health`);
  console.log(`✓ TTS Stats: http://localhost:${PORT}/api/tts/stats`);
  console.log(`✓ WebSocket TTS: Enabled`);
  console.log('='.repeat(50));

  // Test database connection on startup
  import('./db/index.ts')
    .then(({ sql }) => sql`SELECT 1 as test`)
    .then(() => console.log('✓ Database connected'))
    .catch((err) => console.error('✗ Database connection failed:', err.message));

  // Initialize Azure AI Agents on startup (non-blocking)
  if (isAzureConfigured()) {
    console.log('⏳ Initializing Azure AI Agents...');
    initializeAgents()
      .then((result) => {
        if (result.success) {
          console.log(`✓ Azure AI Agents initialized (${result.agents.filter(a => a.initialized).length}/${result.agents.length} agents)`);
        } else {
          console.warn('⚠ Some Azure AI Agents failed to initialize');
          result.agents.filter(a => !a.initialized).forEach(a => {
            console.warn(`  - ${a.name}: ${a.error}`);
          });
        }
      })
      .catch((err) => console.error('✗ Azure AI Agents initialization failed:', err.message));
  } else {
    console.log('ℹ Azure AI Agents not configured (using OpenAI fallback)');
  }
});

export default app;
