/**
 * Azure AI Agents Module
 * Exports all agents and initialization utilities
 */

export { default as azureClient, getAzureClient, getAgentsClient, isAzureClientAvailable, getAzureClientStatus } from './azure-client.js';
export { AGENT_NAMES, AGENT_CONFIGS, type AgentName, type AgentConfig } from './agent-config.js';
export { BaseAgent, type ChatMessage, type AgentResponse, type StreamEvent } from './base-agent.js';
export {
  SimulationClientAgent,
  simulationClientAgent,
  type ClientProfile,
  type EmotionalState,
  type ObjectiveProgress,
  type SimulationContext,
} from './simulation-client-agent.js';
export {
  ProfileGenerationAgent,
  profileGenerationAgent,
  type GeneratedProfile,
  type ProfileGenerationRequest,
} from './profile-generation-agent.js';
export {
  EvaluationAgent,
  evaluationAgent,
  type CompetencyScore,
  type PerformanceReview,
  type Competency,
  type Rubric,
  type EvaluationRequest,
} from './evaluation-agent.js';
export {
  ExpertGuidanceAgent,
  expertGuidanceAgent,
  type GuidanceRequest,
  type GuidanceResponse,
} from './expert-guidance-agent.js';

import { isAzureConfigured } from '../config/index.js';
import { getAzureClient, getAzureClientStatus } from './azure-client.js';
import { simulationClientAgent } from './simulation-client-agent.js';
import { profileGenerationAgent } from './profile-generation-agent.js';
import { evaluationAgent } from './evaluation-agent.js';
import { expertGuidanceAgent } from './expert-guidance-agent.js';

// All agent instances
const agents = {
  simulationClient: simulationClientAgent,
  profileGeneration: profileGenerationAgent,
  evaluation: evaluationAgent,
  expertGuidance: expertGuidanceAgent,
};

/**
 * Initialize all agents
 */
export async function initializeAgents(): Promise<{
  success: boolean;
  agents: Array<{ name: string; initialized: boolean; error?: string }>;
}> {
  if (!isAzureConfigured()) {
    console.log('[Agents] Azure not configured, skipping agent initialization');
    return {
      success: false,
      agents: Object.keys(agents).map(name => ({
        name,
        initialized: false,
        error: 'Azure not configured',
      })),
    };
  }

  console.log('[Agents] Initializing Azure AI Agents...');
  const results: Array<{ name: string; initialized: boolean; error?: string }> = [];

  // Initialize Azure client first
  try {
    await getAzureClient();
    console.log('[Agents] Azure client initialized');
  } catch (error) {
    console.error('[Agents] Failed to initialize Azure client:', error);
    return {
      success: false,
      agents: Object.keys(agents).map(name => ({
        name,
        initialized: false,
        error: error instanceof Error ? error.message : 'Azure client initialization failed',
      })),
    };
  }

  // Initialize each agent
  for (const [name, agent] of Object.entries(agents)) {
    try {
      await agent.initialize();
      results.push({ name, initialized: true });
      console.log(`[Agents] ${name} agent initialized`);
    } catch (error) {
      console.error(`[Agents] Failed to initialize ${name} agent:`, error);
      results.push({
        name,
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const allInitialized = results.every(r => r.initialized);
  console.log(`[Agents] Initialization complete. Success: ${allInitialized}`);

  return {
    success: allInitialized,
    agents: results,
  };
}

/**
 * Get status of all agents
 */
export function getAgentStatus(): {
  azureConfigured: boolean;
  azureClient: ReturnType<typeof getAzureClientStatus>;
  agents: Array<{ name: string; initialized: boolean; agentId: string | null }>;
} {
  return {
    azureConfigured: isAzureConfigured(),
    azureClient: getAzureClientStatus(),
    agents: Object.entries(agents).map(([agentKey, agent]) => {
      const status = agent.getStatus();
      return {
        name: agentKey,
        initialized: status.initialized,
        agentId: status.agentId,
      };
    }),
  };
}

/**
 * Check if agents are available for use
 */
export function areAgentsAvailable(): boolean {
  if (!isAzureConfigured()) {
    return false;
  }

  const status = getAgentStatus();
  return status.azureClient.initialized && status.agents.some(a => a.initialized);
}

export default {
  agents,
  initializeAgents,
  getAgentStatus,
  areAgentsAvailable,
};
