/**
 * Base Agent Class
 * Provides common functionality for all Azure AI Agents
 *
 * Note: Uses type casting in some places due to Azure AI SDK beta type inconsistencies.
 * The SDK API is functional at runtime even when TypeScript types don't match exactly.
 */

import type {
  AgentsClient,
  Agent,
  AgentThread,
  ThreadMessage,
  ThreadRun,
  ToolOutput,
  FunctionToolDefinition,
  RequiredToolCall,
} from '@azure/ai-agents';
import { getAgentsClient, getModelDeploymentName, buildAgentName } from './azure-client.js';
import { AgentConfig, AGENT_CONFIGS, AgentName } from './agent-config.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  metadata?: Record<string, any>;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
    result: any;
  }>;
}

export interface StreamEvent {
  type: 'status' | 'tool_call' | 'tool_result' | 'thinking' | 'complete' | 'error';
  data: Record<string, any>;
}

export type ToolHandler = (args: any) => Promise<any>;

/**
 * Abstract base class for Azure AI Agents
 */
export abstract class BaseAgent {
  protected agentName: AgentName;
  protected config: AgentConfig;
  protected agent: Agent | null = null;
  protected client: AgentsClient | null = null;
  protected toolHandlers: Map<string, ToolHandler> = new Map();

  constructor(agentName: AgentName) {
    this.agentName = agentName;
    this.config = AGENT_CONFIGS[agentName];

    if (!this.config) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    // Register tool handlers (to be overridden by subclasses)
    this.registerToolHandlers();
  }

  /**
   * Register tool handlers - to be overridden by subclasses
   */
  protected abstract registerToolHandlers(): void;

  /**
   * Initialize the agent - creates or retrieves from Azure
   */
  async initialize(): Promise<void> {
    console.log(`[${this.agentName}] Initializing agent...`);

    try {
      this.client = await getAgentsClient();
      const fullAgentName = buildAgentName(this.agentName);

      // Try to find existing agent
      const agents = this.client.listAgents();
      let existingAgent: Agent | undefined;

      for await (const agent of agents) {
        if (agent.name === fullAgentName) {
          existingAgent = agent;
          break;
        }
      }

      if (existingAgent) {
        console.log(`[${this.agentName}] Found existing agent: ${existingAgent.id}`);
        this.agent = existingAgent;
      } else {
        // Create new agent
        console.log(`[${this.agentName}] Creating new agent...`);
        this.agent = await this.client.createAgent(getModelDeploymentName(), {
          name: fullAgentName,
          instructions: this.config.instructions,
          tools: this.config.tools,
        });
        console.log(`[${this.agentName}] Created agent: ${this.agent.id}`);
      }
    } catch (error) {
      console.error(`[${this.agentName}] Failed to initialize:`, error);
      throw error;
    }
  }

  /**
   * Ensure agent is initialized
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.agent || !this.client) {
      await this.initialize();
    }
  }

  /**
   * Non-streaming chat - for backward compatibility
   */
  async chat(
    messages: ChatMessage[],
    context?: Record<string, any>
  ): Promise<AgentResponse> {
    await this.ensureInitialized();

    if (!this.client || !this.agent) {
      throw new Error('Agent not initialized');
    }

    const toolCalls: AgentResponse['toolCalls'] = [];

    try {
      // Create a thread
      const thread = await this.client.threads.create();

      // Add messages to thread
      for (const msg of messages) {
        if (msg.role !== 'system') {
          await this.client.messages.create(
            thread.id,
            msg.role === 'user' ? 'user' : 'assistant',
            msg.content
          );
        }
      }

      // Add context as a user message if provided
      if (context) {
        await this.client.messages.create(
          thread.id,
          'user',
          `[CONTEXT]: ${JSON.stringify(context)}`
        );
      }

      // Run the agent - using createAndPoll for simpler handling
      const poller = this.client.runs.createAndPoll(thread.id, this.agent.id);
      let run = await poller.pollUntilDone();

      // Poll for completion with tool call handling
      const maxIterations = 20;
      let iteration = 0;

      while (run.status === 'requires_action' && iteration < maxIterations) {
        // Handle required actions (tool calls)
        // Using type assertion due to SDK beta type inconsistencies
        const requiredAction = run.requiredAction as any;
        if (requiredAction?.submitToolOutputs?.toolCalls) {
          const toolOutputs = await this.handleToolCalls(
            requiredAction.submitToolOutputs.toolCalls,
            toolCalls
          );

          const submitResponse = this.client.runs.submitToolOutputs(
            thread.id,
            run.id,
            toolOutputs
          ) as any;

          // Wait for run to complete after submitting tool outputs
          run = await submitResponse.finalRun();
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
          run = await this.client.runs.get(thread.id, run.id);
        }

        iteration++;
      }

      if (iteration >= maxIterations) {
        throw new Error('Agent run exceeded maximum iterations');
      }

      // Check for errors
      if (run.status === 'failed') {
        throw new Error(`Agent run failed: ${run.lastError?.message || 'Unknown error'}`);
      }

      // Get the response messages
      const messagesResponse = this.client.messages.list(thread.id);
      let responseContent = '';

      for await (const message of messagesResponse) {
        if (message.role === 'assistant') {
          for (const content of message.content) {
            if (content.type === 'text') {
              responseContent = (content as any).text.value;
              break;
            }
          }
          if (responseContent) break;
        }
      }

      // Cleanup thread
      await this.client.threads.delete(thread.id);

      return {
        success: true,
        message: responseContent,
        toolCalls,
        metadata: {
          runId: run.id,
          iterations: iteration,
        },
      };
    } catch (error) {
      console.error(`[${this.agentName}] Chat error:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        toolCalls,
      };
    }
  }

  /**
   * Streaming chat with SSE support
   */
  async *chatStream(
    messages: ChatMessage[],
    context?: Record<string, any>
  ): AsyncGenerator<StreamEvent> {
    await this.ensureInitialized();

    if (!this.client || !this.agent) {
      yield {
        type: 'error',
        data: { error: 'Agent not initialized' },
      };
      return;
    }

    const toolCalls: AgentResponse['toolCalls'] = [];

    try {
      yield { type: 'status', data: { status: 'creating_thread', message: 'Starting conversation...' } };

      // Create a thread
      const thread = await this.client.threads.create();

      // Add messages to thread
      for (const msg of messages) {
        if (msg.role !== 'system') {
          await this.client.messages.create(
            thread.id,
            msg.role === 'user' ? 'user' : 'assistant',
            msg.content
          );
        }
      }

      // Add context
      if (context) {
        await this.client.messages.create(
          thread.id,
          'user',
          `[CONTEXT]: ${JSON.stringify(context)}`
        );
      }

      yield { type: 'status', data: { status: 'running', message: 'Processing...' } };

      // Run the agent using createAndPoll
      const poller = this.client.runs.createAndPoll(thread.id, this.agent.id);
      let run = await poller.pollUntilDone();

      const maxIterations = 20;
      let iteration = 0;

      while (run.status === 'requires_action' && iteration < maxIterations) {
        yield { type: 'thinking', data: { status: 'thinking', iteration } };

        // Using type assertion due to SDK beta type inconsistencies
        const requiredAction = run.requiredAction as any;
        if (requiredAction?.submitToolOutputs?.toolCalls) {
          // Emit tool calls
          for (const toolCall of requiredAction.submitToolOutputs.toolCalls) {
            yield {
              type: 'tool_call',
              data: {
                tool: toolCall.function.name,
                arguments: JSON.parse(toolCall.function.arguments),
              },
            };
          }

          const toolOutputs = await this.handleToolCalls(
            requiredAction.submitToolOutputs.toolCalls,
            toolCalls
          );

          // Emit tool results
          for (const output of toolOutputs) {
            yield {
              type: 'tool_result',
              data: {
                toolCallId: output.toolCallId,
                result: output.output ? JSON.parse(output.output) : null,
              },
            };
          }

          const submitResponse = this.client.runs.submitToolOutputs(
            thread.id,
            run.id,
            toolOutputs
          ) as any;

          run = await submitResponse.finalRun();
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
          run = await this.client.runs.get(thread.id, run.id);
        }

        iteration++;
      }

      if (iteration >= maxIterations) {
        yield { type: 'error', data: { error: 'Maximum iterations exceeded' } };
        return;
      }

      if (run.status === 'failed') {
        yield { type: 'error', data: { error: run.lastError?.message || 'Run failed' } };
        return;
      }

      // Get response
      const messagesResponse = this.client.messages.list(thread.id);
      let responseContent = '';

      for await (const message of messagesResponse) {
        if (message.role === 'assistant') {
          for (const content of message.content) {
            if (content.type === 'text') {
              responseContent = (content as any).text.value;
              break;
            }
          }
          if (responseContent) break;
        }
      }

      // Cleanup
      await this.client.threads.delete(thread.id);

      yield {
        type: 'complete',
        data: {
          response: responseContent,
          metadata: { runId: run.id, iterations: iteration },
          toolCalls,
        },
      };
    } catch (error) {
      yield {
        type: 'error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      };
    }
  }

  /**
   * Handle tool calls from the agent
   */
  protected async handleToolCalls(
    toolCalls: RequiredToolCall[],
    toolCallLog: AgentResponse['toolCalls']
  ): Promise<ToolOutput[]> {
    const outputs: ToolOutput[] = [];

    for (const toolCall of toolCalls) {
      const tc = toolCall as any;
      const toolName = tc.function.name;
      const args = JSON.parse(tc.function.arguments);

      console.log(`[${this.agentName}] Executing tool: ${toolName}`);

      let result: any;
      const handler = this.toolHandlers.get(toolName);

      if (handler) {
        try {
          result = await handler(args);
        } catch (error) {
          console.error(`[${this.agentName}] Tool error:`, error);
          result = { error: error instanceof Error ? error.message : 'Tool execution failed' };
        }
      } else {
        result = { error: `Unknown tool: ${toolName}` };
      }

      toolCallLog?.push({
        name: toolName,
        arguments: args,
        result,
      });

      outputs.push({
        toolCallId: tc.id,
        output: JSON.stringify(result),
      });
    }

    return outputs;
  }

  /**
   * Format SSE event for streaming responses
   */
  static formatSSE(event: StreamEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  }

  /**
   * Get agent status
   */
  getStatus(): {
    name: string;
    initialized: boolean;
    agentId: string | null;
  } {
    return {
      name: this.agentName,
      initialized: !!this.agent,
      agentId: this.agent?.id || null,
    };
  }

  /**
   * Delete the agent from Azure
   */
  async delete(): Promise<void> {
    if (this.client && this.agent) {
      await this.client.deleteAgent(this.agent.id);
      this.agent = null;
      console.log(`[${this.agentName}] Agent deleted`);
    }
  }
}

export default BaseAgent;
