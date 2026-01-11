# Plan: Refactor OpenAI Chat Completion API to Azure AI Agents

## Task Description
Refactor the existing codebase to replace OpenAI Chat Completion API calls with Azure AI Agents. This involves identifying the minimal set of agents required for the current functionality and implementing them using the Azure AI Agent SDK pattern from the reference implementation.

## Objective
Replace all OpenAI Chat Completion API usage with Azure AI Agents while maintaining 100% backward compatibility with existing functionality. The application should work identically from the user's perspective, with the added benefits of agentic architecture (autonomous tool use, self-correction, and streaming capabilities).

## Problem Statement
The current codebase uses OpenAI Chat Completion API in multiple locations:
1. **Backend services** - `ai-service.ts`, `chat.ts`, `simulation.ts`, `websocket-tts-service.ts`
2. **Frontend actions** - `simulation/actions.ts`, `review-actions.ts`, `profile-generator/actions.ts`, `chat-actions.ts`, `sentiment-analyzer.ts`

This scattered implementation:
- Makes it difficult to switch LLM providers
- Lacks autonomous tool-calling capabilities
- Has no self-correction mechanism for failed operations
- Requires manual error handling at each call site

## Solution Approach
Implement a centralized Azure AI Agent architecture:
1. Create a shared `azure-agents/` module in the backend with specialized agents
2. Each agent has defined tools that map to existing business logic
3. Agents use polling-based execution with tool calls handled server-side
4. Maintain backward compatibility via adapter functions that consume agent responses
5. Support fallback to OpenAI when Azure is not configured

## Relevant Files

### Backend Files to Modify
- **`backend/services/ai-service.ts`** - Core AI service; refactor to use agents
- **`backend/routes/chat.ts`** - Chat endpoints; add streaming support
- **`backend/routes/simulation.ts`** - Simulation endpoints; use agents
- **`backend/config/index.ts`** - Add Azure configuration
- **`backend/package.json`** - Add Azure SDK dependencies

### Frontend Files to Modify
- **`frontend/app/api/simulation/actions.ts`** - Simulation actions; use backend agents
- **`frontend/app/api/simulation/review-actions.ts`** - Review generation; use backend
- **`frontend/app/profile-generator/actions.ts`** - Profile generation; use backend
- **`frontend/app/profile-generator/chat-actions.ts`** - Profile chat; use backend
- **`frontend/app/profile-generator/sentiment-analyzer.ts`** - Sentiment; use backend

### New Files to Create
- **`backend/agents/index.ts`** - Agent exports and initialization
- **`backend/agents/agent-config.ts`** - Agent instructions and shared configuration
- **`backend/agents/azure-client.ts`** - Azure AI Project client wrapper
- **`backend/agents/simulation-client-agent.ts`** - Client persona simulation agent
- **`backend/agents/profile-generation-agent.ts`** - Profile generation agent
- **`backend/agents/evaluation-agent.ts`** - Performance evaluation agent
- **`backend/agents/expert-guidance-agent.ts`** - Expert guidance agent
- **`backend/routes/agents.ts`** - New API routes for agent interactions

## Implementation Phases

### Phase 1: Foundation (Infrastructure Setup)
- Add Azure SDK dependencies to backend
- Create Azure configuration in `backend/config/index.ts`
- Create base agent infrastructure (`azure-client.ts`, `agent-config.ts`)
- Set up agent initialization and health check endpoints

### Phase 2: Core Implementation (Agent Development)
- Implement each of the 4 specialized agents:
  1. Simulation Client Agent
  2. Profile Generation Agent
  3. Evaluation Agent
  4. Expert Guidance Agent
- Create tool functions for each agent
- Implement agent streaming with SSE support

### Phase 3: Integration & Migration
- Update existing services to use agents
- Add adapter functions for backward compatibility
- Update frontend to use new backend endpoints
- Implement graceful fallback to OpenAI when Azure unavailable
- Update environment variable documentation

## Minimal Agent Architecture

Based on codebase analysis, **4 specialized agents** are required:

### 1. Simulation Client Agent
**Purpose**: Simulate client personas in training conversations
**Tools**:
- `get_client_profile` - Retrieve current client profile details
- `get_emotional_state` - Get client's emotional context
- `track_objectives` - Update objective progress based on conversation
- `generate_response` - Generate contextual client response

**Used by**:
- `backend/routes/chat.ts` - `/client-response` endpoint
- `frontend/app/api/simulation/actions.ts` - `generateClientResponse()`

### 2. Profile Generation Agent
**Purpose**: Generate realistic client profiles for simulations
**Tools**:
- `get_industry_settings` - Retrieve industry-specific configuration
- `get_difficulty_settings` - Get difficulty level parameters
- `generate_diversity_params` - Create diversity parameters
- `validate_profile` - Validate generated profile structure

**Used by**:
- `frontend/app/profile-generator/actions.ts` - `generateProfile()`
- `backend/services/ai-service.ts` - `generateClientProfile()`

### 3. Evaluation Agent
**Purpose**: Evaluate advisor performance and generate reviews
**Tools**:
- `get_rubrics` - Retrieve evaluation rubrics
- `get_competencies` - Get competency definitions
- `analyze_conversation` - Analyze conversation transcript
- `calculate_scores` - Compute competency scores

**Used by**:
- `frontend/app/api/simulation/review-actions.ts` - `generatePerformanceReview()`
- `backend/services/ai-service.ts` - `generateEvaluation()`

### 4. Expert Guidance Agent
**Purpose**: Provide expert advice to advisors during simulations
**Tools**:
- `get_objectives` - Retrieve current objectives and progress
- `get_context` - Get simulation context and client info
- `generate_guidance` - Create actionable guidance

**Used by**:
- `backend/routes/chat.ts` - `/expert-response` endpoint

## Step by Step Tasks

### 1. Add Azure SDK Dependencies
- Add `@azure/ai-projects` to `backend/package.json`
- Add `@azure/identity` to `backend/package.json`
- Run `npm install` to install dependencies

### 2. Update Backend Configuration
- Add Azure environment variables to `backend/config/index.ts`:
  - `AZURE_AI_PROJECT_ENDPOINT`
  - `AZURE_AI_MODEL_DEPLOYMENT_NAME`
  - `AZURE_AI_AGENT_NAME_PREFIX`
- Update `backend/.env.sample` with Azure configuration template
- Add configuration validation for Azure settings

### 3. Create Azure Client Wrapper
- Create `backend/agents/azure-client.ts`:
  - Initialize AIProjectClient with DefaultAzureCredential
  - Implement singleton pattern for client reuse
  - Add `isConfigured()` check for fallback logic
  - Add `initialize()` method with error handling

### 4. Create Agent Configuration Module
- Create `backend/agents/agent-config.ts`:
  - Define `SIMULATION_CLIENT_INSTRUCTIONS` for client persona behavior
  - Define `PROFILE_GENERATION_INSTRUCTIONS` for profile creation
  - Define `EVALUATION_INSTRUCTIONS` for performance assessment
  - Define `EXPERT_GUIDANCE_INSTRUCTIONS` for advisor support
  - Export tool definitions for each agent

### 5. Implement Base Agent Class
- Create `backend/agents/base-agent.ts`:
  - Abstract class with common agent functionality
  - `initialize()` - Create/retrieve agent from Azure
  - `chat()` - Non-streaming chat for backward compatibility
  - `chatStream()` - Streaming chat with SSE formatting
  - `handleToolCall()` - Route tool calls to implementations
  - `formatSSE()` - Format Server-Sent Events

### 6. Implement Simulation Client Agent
- Create `backend/agents/simulation-client-agent.ts`:
  - Extend BaseAgent with simulation-specific tools
  - Implement `getClientProfile()` tool - returns current client profile
  - Implement `getEmotionalState()` tool - returns emotional context
  - Implement `trackObjectives()` tool - evaluates and updates progress
  - Define agent instructions for realistic client behavior
  - Handle difficulty-level specific behavior adjustments

### 7. Implement Profile Generation Agent
- Create `backend/agents/profile-generation-agent.ts`:
  - Extend BaseAgent with profile generation tools
  - Implement `getIndustrySettings()` tool - returns industry config
  - Implement `getDifficultySettings()` tool - returns difficulty params
  - Implement `generateDiversityParams()` tool - creates diversity params
  - Implement `validateProfile()` tool - validates profile structure
  - Define agent instructions for diverse profile creation

### 8. Implement Evaluation Agent
- Create `backend/agents/evaluation-agent.ts`:
  - Extend BaseAgent with evaluation tools
  - Implement `getRubrics()` tool - returns evaluation rubrics
  - Implement `getCompetencies()` tool - returns competency definitions
  - Implement `analyzeConversation()` tool - analyzes transcript
  - Implement `calculateScores()` tool - computes scores
  - Define agent instructions for fair, critical evaluation

### 9. Implement Expert Guidance Agent
- Create `backend/agents/expert-guidance-agent.ts`:
  - Extend BaseAgent with guidance tools
  - Implement `getObjectives()` tool - returns current objectives
  - Implement `getContext()` tool - returns simulation context
  - Implement `generateGuidance()` tool - creates actionable advice
  - Define agent instructions for supportive guidance

### 10. Create Agent Routes
- Create `backend/routes/agents.ts`:
  - `POST /api/agents/chat/client` - Client response generation
  - `POST /api/agents/chat/expert` - Expert guidance generation
  - `POST /api/agents/profile/generate` - Profile generation
  - `POST /api/agents/evaluation/review` - Performance review
  - `GET /api/agents/health` - Agent health status
  - Add streaming support with SSE for all chat endpoints

### 11. Update AI Service for Fallback
- Modify `backend/services/ai-service.ts`:
  - Import and check Azure agent availability
  - Add `useAzureAgent()` check at start of each method
  - Route to agent when available, fallback to OpenAI
  - Maintain exact same response format for compatibility

### 12. Update Chat Routes
- Modify `backend/routes/chat.ts`:
  - Check Azure agent availability at start
  - Use SimulationClientAgent for `/client-response`
  - Use ExpertGuidanceAgent for `/expert-response`
  - Maintain backward compatibility with existing response format
  - Add optional streaming support via SSE

### 13. Update Frontend Simulation Actions
- Modify `frontend/app/api/simulation/actions.ts`:
  - Update `generateClientResponse()` to call backend `/api/agents/chat/client`
  - Update `generateConversationStarter()` to use backend agent
  - Handle SSE streaming for real-time updates
  - Maintain fallback to direct OpenAI calls if backend unavailable

### 14. Update Frontend Review Actions
- Modify `frontend/app/api/simulation/review-actions.ts`:
  - Update `generatePerformanceReview()` to call `/api/agents/evaluation/review`
  - Parse agent response into existing PerformanceReview format
  - Maintain fallback with existing OpenAI implementation

### 15. Update Frontend Profile Generation
- Modify `frontend/app/profile-generator/actions.ts`:
  - Update `generateProfile()` to call `/api/agents/profile/generate`
  - Pass all existing parameters to backend
  - Parse agent response into existing profile format
  - Maintain fallback with existing implementation

### 16. Update Frontend Chat Actions
- Modify `frontend/app/profile-generator/chat-actions.ts`:
  - Update `generateProfileResponse()` to use backend agent
  - Maintain emotional state tracking integration
  - Handle SSE streaming for real-time responses

### 17. Create Agent Initialization on Server Start
- Modify `backend/index.ts`:
  - Import agent initialization
  - Call agent initialization on server startup
  - Log agent status (configured/not configured)
  - Add agent health to server health check

### 18. Update Environment Documentation
- Update `backend/.env.sample`:
  - Add Azure configuration section with comments
  - Document fallback behavior
- Update `frontend/.env.sample`:
  - Remove duplicate OpenAI key if using backend exclusively
- Update `README.md`:
  - Add Azure AI Agent configuration section
  - Document agent architecture
  - Explain fallback behavior

### 19. Validate Implementation
- Test each agent endpoint manually
- Verify streaming works correctly
- Confirm fallback to OpenAI works when Azure not configured
- Run existing application flows to verify backward compatibility
- Check no TypeScript errors in build

## Testing Strategy

### Unit Tests
- **Agent Configuration**: Verify tool definitions match expected schema
- **Tool Functions**: Test each tool returns correct data format
- **SSE Formatting**: Verify event format matches `event: {type}\ndata: {json}\n\n`
- **Agent Initialization**: Test graceful handling of missing Azure config
- **Fallback Logic**: Test correct routing when Azure unavailable

### Integration Tests
- **Agent Endpoints**: Test each `/api/agents/*` endpoint
- **Streaming**: Verify SSE stream format and event sequence
- **End-to-End Flow**: Test complete simulation with agents
- **Backward Compatibility**: Existing tests should pass unchanged

### Edge Cases
- Missing Azure configuration (should fallback to OpenAI)
- Agent not found/deleted (should recreate)
- Tool execution failure (should return error to agent)
- Network timeout during polling (should timeout gracefully)
- Concurrent requests (should handle multiple threads)

## Acceptance Criteria
1. All existing functionality works identically from user perspective
2. Azure AI Agents are used when `AZURE_AI_PROJECT_ENDPOINT` is configured
3. Graceful fallback to OpenAI when Azure is not configured
4. No breaking changes to API contracts
5. Streaming endpoints available for real-time updates
6. Health check endpoint reports agent status
7. All existing tests pass without modification
8. TypeScript builds without errors

## Validation Commands

Execute these commands to validate the implementation:

```bash
# Install dependencies
cd /mnt/d/Experiments/Kp/rplayv6 && npm install

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend

# Start development servers
npm run dev

# Test health endpoint (after server starts)
curl http://localhost:3001/health

# Test agent health (after server starts)
curl http://localhost:3001/api/agents/health

# Run existing tests
npm test
```

## Notes

### New Dependencies Required
Add to `backend/package.json`:
```json
{
  "dependencies": {
    "@azure/ai-projects": "^1.0.0",
    "@azure/identity": "^4.0.0"
  }
}
```

### Environment Variables
Required for Azure AI Agent:
- `AZURE_AI_PROJECT_ENDPOINT` - Full project endpoint URL
- `AZURE_AI_MODEL_DEPLOYMENT_NAME` - Model deployment name (e.g., `gpt-4o`)
- `AZURE_AI_AGENT_NAME_PREFIX` - Prefix for agent names (e.g., `rplay-`)

For authentication (DefaultAzureCredential supports multiple methods):
- Environment variables: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
- Managed Identity (when running in Azure)
- Azure CLI credentials (for local development)

### SSE Event Types
Streaming endpoints emit these events:
| Event | Description | Data |
|-------|-------------|------|
| `status` | Progress updates | `{"status": "...", "message": "..."}` |
| `tool_call` | Agent calling a tool | `{"tool": "...", "arguments": {...}}` |
| `tool_result` | Tool execution result | `{"tool": "...", "result": {...}}` |
| `thinking` | Agent processing | `{"status": "thinking", "iteration": N}` |
| `complete` | Final response | `{"response": "...", "metadata": {...}}` |
| `error` | Error occurred | `{"error": "...", "details": "..."}` |

### Architecture Diagram
```
┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │    Backend      │
│  (Next.js)      │────▶│   (Express)     │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼───────┐
              │  Azure    │           │    OpenAI     │
              │  Agents   │           │   (Fallback)  │
              └─────┬─────┘           └───────────────┘
                    │
    ┌───────┬───────┼───────┬───────┐
    │       │       │       │       │
┌───▼──┐┌───▼──┐┌───▼──┐┌───▼──┐
│Client││Profile││Eval ││Expert│
│Agent ││Agent  ││Agent││Agent │
└──────┘└───────┘└──────┘└──────┘
```

### Backward Compatibility Strategy
1. All existing API endpoints remain unchanged
2. Response formats are identical
3. New streaming endpoints are additive (optional)
4. Environment variables are optional (fallback works)
5. No frontend changes required for basic functionality
