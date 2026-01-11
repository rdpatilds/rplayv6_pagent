/**
 * Azure AI Projects Client Wrapper
 * Provides a singleton client for Azure AI Agent operations
 */

import { AIProjectClient } from '@azure/ai-projects';
import { AgentsClient } from '@azure/ai-agents';
import { DefaultAzureCredential } from '@azure/identity';
// NOTE: AzureKeyCredential is not used - AIProjectClient doesn't support API key auth
// import { AzureKeyCredential } from '@azure/core-auth';

import { config, isAzureConfigured } from '../config/index.js';

// Singleton client instance
let clientInstance: AIProjectClient | null = null;
let agentsClient: AgentsClient | null = null;
let initializationPromise: Promise<AIProjectClient> | null = null;
let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Get the Azure AI Projects client instance
 * Uses singleton pattern for connection reuse
 */
export async function getAzureClient(): Promise<AIProjectClient> {
  if (!isAzureConfigured()) {
    throw new Error('Azure AI is not configured. Set AZURE_AI_PROJECT_ENDPOINT environment variable.');
  }

  // Return existing instance if available
  if (clientInstance && isInitialized) {
    return clientInstance;
  }

  // Return existing initialization promise if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = initializeClient();

  try {
    clientInstance = await initializationPromise;
    agentsClient = clientInstance.agents;
    isInitialized = true;
    return clientInstance;
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error(String(error));
    initializationPromise = null;
    throw initializationError;
  }
}

/**
 * Get the AgentsClient for agent operations
 */
export async function getAgentsClient(): Promise<AgentsClient> {
  const client = await getAzureClient();
  return client.agents;
}

/**
 * Initialize the Azure AI Projects client
 *
 * NOTE: AIProjectClient only supports Azure AD authentication (DefaultAzureCredential).
 * API Key authentication is NOT supported by the Azure AI Projects SDK.
 * See: https://github.com/Azure/azure-sdk-for-js/issues/34675
 *
 * For authentication, use one of:
 * - Azure CLI: run 'az login' for local development
 * - Managed Identity: automatic when running in Azure
 * - Service Principal: set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID
 */
async function initializeClient(): Promise<AIProjectClient> {
  console.log('[AzureClient] Initializing Azure AI Projects client...');

  const endpoint = config.azure.projectEndpoint;
  const apiKey = config.azure.apiKey;

  if (!endpoint) {
    throw new Error('AZURE_AI_PROJECT_ENDPOINT is not set');
  }

  // Warn if API key is configured - it won't work with AIProjectClient
  if (apiKey) {
    console.warn('[AzureClient] ⚠️  WARNING: AZURE_AI_API_KEY is set but AIProjectClient does not support API Key authentication.');
    console.warn('[AzureClient] ⚠️  The Azure AI Projects SDK only supports Azure AD (Entra ID) authentication.');
    console.warn('[AzureClient] ⚠️  See: https://github.com/Azure/azure-sdk-for-js/issues/34675');
    console.warn('[AzureClient] ⚠️  Falling back to DefaultAzureCredential (Azure CLI, Managed Identity, or Service Principal).');
  }

  try {
    // Always use DefaultAzureCredential - API Key is not supported by AIProjectClient
    const credential = new DefaultAzureCredential();

    console.log('[AzureClient] Using DefaultAzureCredential for authentication');

    const client = new AIProjectClient(endpoint, credential);

    console.log('[AzureClient] Azure AI Projects client initialized successfully');
    return client;
  } catch (error) {
    console.error('[AzureClient] Failed to initialize Azure AI Projects client:', error);
    throw error;
  }
}

/**
 * Check if Azure client is available
 */
export function isAzureClientAvailable(): boolean {
  return isAzureConfigured() && isInitialized && !initializationError;
}

/**
 * Get Azure client initialization status
 */
export function getAzureClientStatus(): {
  configured: boolean;
  initialized: boolean;
  error: string | null;
} {
  return {
    configured: isAzureConfigured(),
    initialized: isInitialized,
    error: initializationError?.message || null,
  };
}

/**
 * Reset the client (useful for testing or reconnection)
 */
export function resetAzureClient(): void {
  clientInstance = null;
  agentsClient = null;
  initializationPromise = null;
  isInitialized = false;
  initializationError = null;
  console.log('[AzureClient] Client reset');
}

/**
 * Get the configured model deployment name
 */
export function getModelDeploymentName(): string {
  return config.azure.modelDeploymentName;
}

/**
 * Get the agent name prefix
 */
export function getAgentNamePrefix(): string {
  return config.azure.agentNamePrefix;
}

/**
 * Build a full agent name with prefix
 */
export function buildAgentName(baseName: string): string {
  return `${config.azure.agentNamePrefix}${baseName}`;
}

export default {
  getAzureClient,
  isAzureClientAvailable,
  getAzureClientStatus,
  resetAzureClient,
  getModelDeploymentName,
  getAgentNamePrefix,
  buildAgentName,
};
