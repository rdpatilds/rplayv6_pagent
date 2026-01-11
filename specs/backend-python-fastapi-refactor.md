# Plan: Refactor Backend from Node.js/Express to Python/FastAPI

## Task Description
Refactor the entire backend application from Node.js/Express/TypeScript to Python/FastAPI. This is a 1:1 port that maintains exact API compatibility, database schema, and functionality. No new features will be added - the goal is to replace the technology stack while preserving identical behavior.

## Objective
Replace the Node.js/Express/TypeScript backend with a Python/FastAPI implementation that:
- Maintains 100% API compatibility (same endpoints, request/response formats)
- Uses the same PostgreSQL database and schema
- Preserves all business logic and validation rules
- Supports the same authentication mechanism (session tokens)
- Integrates with the same external services (OpenAI, Azure AI Agents)
- Provides WebSocket TTS functionality via Socket.io

## Problem Statement
The current backend is built with:
- **Runtime:** Node.js 20
- **Framework:** Express.js 4.18.2
- **Language:** TypeScript 5
- **Database:** PostgreSQL (Neon serverless) with `@neondatabase/serverless`
- **AI:** OpenAI SDK + Azure AI Projects SDK
- **Real-time:** Socket.io for WebSocket TTS

The refactor targets:
- **Runtime:** Python 3.11+
- **Framework:** FastAPI
- **Database:** PostgreSQL with asyncpg
- **AI:** openai Python SDK + azure-ai-projects
- **Real-time:** python-socketio

## Solution Approach
Implement a phased migration:
1. **Phase 1:** Set up Python project structure with FastAPI foundation
2. **Phase 2:** Port database layer (connection, repositories)
3. **Phase 3:** Port services (business logic)
4. **Phase 4:** Port routes (API endpoints)
5. **Phase 5:** Port middleware (auth, error handling)
6. **Phase 6:** Port AI integrations (OpenAI, Azure Agents)
7. **Phase 7:** Port WebSocket TTS service
8. **Phase 8:** Validation and testing

## Relevant Files

### Current Backend Structure (to port)
```
backend/
├── index.ts                    # Main entry point
├── config/
│   └── index.ts               # Configuration management
├── db/
│   ├── connection.ts          # Database connection
│   ├── index.ts               # DB exports
│   └── repositories/          # 11 repository files
│       ├── user-repository.ts
│       ├── session-repository.ts
│       ├── simulation-repository.ts
│       ├── feedback-repository.ts
│       ├── competency-repository.ts
│       ├── parameter-repository.ts
│       ├── engagement-repository.ts
│       ├── rubric-repository.ts
│       ├── file-competency-repository.ts
│       ├── file-industry-repository.ts
│       └── file-rubric-repository.ts
├── routes/                     # 10 route files
│   ├── auth.ts
│   ├── users.ts
│   ├── simulation.ts
│   ├── chat.ts
│   ├── parameters.ts
│   ├── competencies.ts
│   ├── feedback.ts
│   ├── engagement.ts
│   ├── difficulty.ts
│   ├── industry-settings.ts
│   └── agents.ts
├── services/                   # 10 service files
│   ├── auth-service.ts
│   ├── user-service.ts
│   ├── simulation-service.ts
│   ├── feedback-service.ts
│   ├── competency-service.ts
│   ├── parameter-service.ts
│   ├── engagement-service.ts
│   ├── industry-service.ts
│   ├── ai-service.ts
│   ├── email-service.ts
│   ├── rubric-service.ts
│   ├── profile-generation-service.ts
│   ├── fusion-model-service.ts
│   └── websocket-tts-service.ts
├── middleware/
│   ├── auth-middleware.ts
│   ├── error-handler.ts
│   └── validation-middleware.ts
├── agents/                     # Azure AI Agents
│   ├── index.ts
│   ├── azure-client.ts
│   ├── base-agent.ts
│   ├── simulation-client-agent.ts
│   ├── profile-generation-agent.ts
│   ├── evaluation-agent.ts
│   └── expert-guidance-agent.ts
└── utils/
    ├── file-storage.ts
    └── validation.ts
```

### New Files to Create
```
backend-python/
├── pyproject.toml              # Project configuration & dependencies
├── .env.sample                 # Environment template
├── main.py                     # FastAPI entry point
├── app/
│   ├── __init__.py
│   ├── config.py               # Configuration management
│   ├── database.py             # Database connection
│   ├── dependencies.py         # FastAPI dependencies (auth, etc.)
│   ├── models/                 # Pydantic models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── simulation.py
│   │   ├── feedback.py
│   │   ├── competency.py
│   │   ├── parameter.py
│   │   ├── engagement.py
│   │   ├── rubric.py
│   │   └── common.py           # Shared response models
│   ├── repositories/           # Database access layer
│   │   ├── __init__.py
│   │   ├── base.py             # Base repository class
│   │   ├── user_repository.py
│   │   ├── session_repository.py
│   │   ├── simulation_repository.py
│   │   ├── feedback_repository.py
│   │   ├── competency_repository.py
│   │   ├── parameter_repository.py
│   │   ├── engagement_repository.py
│   │   ├── rubric_repository.py
│   │   ├── file_competency_repository.py
│   │   ├── file_industry_repository.py
│   │   └── file_rubric_repository.py
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── simulation_service.py
│   │   ├── feedback_service.py
│   │   ├── competency_service.py
│   │   ├── parameter_service.py
│   │   ├── engagement_service.py
│   │   ├── industry_service.py
│   │   ├── ai_service.py
│   │   ├── email_service.py
│   │   ├── rubric_service.py
│   │   ├── profile_generation_service.py
│   │   ├── fusion_model_service.py
│   │   └── tts_service.py
│   ├── routers/                # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── simulation.py
│   │   ├── chat.py
│   │   ├── parameters.py
│   │   ├── competencies.py
│   │   ├── feedback.py
│   │   ├── engagement.py
│   │   ├── difficulty.py
│   │   ├── industry_settings.py
│   │   ├── agents.py
│   │   └── health.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── error_handler.py
│   │   └── logging.py
│   ├── agents/                 # Azure AI Agents
│   │   ├── __init__.py
│   │   ├── azure_client.py
│   │   ├── base_agent.py
│   │   ├── simulation_client_agent.py
│   │   ├── profile_generation_agent.py
│   │   ├── evaluation_agent.py
│   │   └── expert_guidance_agent.py
│   └── utils/
│       ├── __init__.py
│       ├── file_storage.py
│       └── validation.py
├── sio/                        # Socket.io server
│   ├── __init__.py
│   └── tts_handler.py
└── tests/                      # Test directory
    ├── __init__.py
    ├── conftest.py
    └── test_health.py
```

## Implementation Phases

### Phase 1: Foundation (Project Setup)
- Initialize Python project with uv/pyproject.toml
- Set up FastAPI application structure
- Configure environment variables
- Set up CORS middleware
- Create basic health endpoints

### Phase 2: Database Layer
- Set up asyncpg connection pool
- Port all 11 repositories to Python
- Implement SQL query builders
- Add connection pooling and error handling

### Phase 3: Pydantic Models
- Create request/response models for all endpoints
- Implement validation rules matching TypeScript Zod schemas
- Create shared response models (success/error patterns)

### Phase 4: Services Layer
- Port all 14 services to Python
- Maintain exact same business logic
- Implement password hashing with passlib
- Port email service with aiosmtplib

### Phase 5: Routes/Routers
- Port all 11 route files to FastAPI routers
- Implement exact same endpoint signatures
- Maintain response format compatibility
- Add OpenAPI documentation

### Phase 6: Authentication & Middleware
- Implement session token authentication
- Create FastAPI dependencies for auth
- Port role-based access control
- Add error handling middleware

### Phase 7: AI Integration
- Port OpenAI integration
- Port Azure AI Agents (4 agents)
- Implement fallback logic
- Port streaming SSE support

### Phase 8: WebSocket TTS
- Set up python-socketio
- Port TTS service with OpenAI
- Implement audio streaming
- Handle connection management

## Step by Step Tasks

### 1. Initialize Python Project
- Create `backend-python/` directory
- Create `pyproject.toml` with dependencies:
  ```toml
  [project]
  name = "rplay-backend"
  version = "1.0.0"
  requires-python = ">=3.11"
  dependencies = [
      "fastapi>=0.115.0",
      "uvicorn[standard]>=0.32.0",
      "asyncpg>=0.30.0",
      "pydantic>=2.10.0",
      "pydantic-settings>=2.6.0",
      "python-multipart>=0.0.12",
      "passlib[bcrypt]>=1.7.4",
      "python-jose[cryptography]>=3.3.0",
      "aiosmtplib>=3.0.0",
      "openai>=1.58.0",
      "azure-ai-projects>=1.0.0b4",
      "azure-identity>=1.19.0",
      "python-socketio>=5.11.0",
      "orjson>=3.10.0",
      "python-dotenv>=1.0.0",
      "httpx>=0.28.0",
  ]

  [project.optional-dependencies]
  dev = [
      "pytest>=8.3.0",
      "pytest-asyncio>=0.24.0",
      "httpx>=0.28.0",
      "ruff>=0.8.0",
  ]
  ```
- Create `.env.sample` matching backend/.env.sample
- Run `uv sync` to install dependencies

### 2. Create Configuration Module
- Create `app/config.py`:
  - Port all config from `backend/config/index.ts`
  - Use pydantic-settings for environment loading
  - Implement `Settings` class with validation
  - Add config validation functions
  - Support same environment variables:
    - DATABASE_URL
    - OPENAI_API_KEY
    - AZURE_AI_PROJECT_ENDPOINT
    - AZURE_AI_MODEL_DEPLOYMENT_NAME
    - AZURE_AI_AGENT_NAME_PREFIX
    - AZURE_AI_API_KEY
    - EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM
    - APP_URL, NODE_ENV, LOG_LEVEL
    - Feature flags

### 3. Create Database Connection
- Create `app/database.py`:
  - Use asyncpg for async PostgreSQL
  - Create connection pool singleton
  - Add `get_db()` dependency for FastAPI
  - Implement `test_connection()` function
  - Handle connection errors gracefully
  - Support Neon serverless connection string

### 4. Create Base Repository
- Create `app/repositories/base.py`:
  - Abstract base class with common methods
  - `execute()` - Run SQL query
  - `fetch_one()` - Get single row
  - `fetch_all()` - Get all rows
  - `fetch_val()` - Get single value
  - Handle UUID serialization
  - Handle JSONB columns

### 5. Port User Repository
- Create `app/repositories/user_repository.py`:
  - `find_by_id(id: UUID) -> User | None`
  - `find_by_email(email: str) -> User | None`
  - `find_all() -> list[User]`
  - `find_by_role(role: str) -> list[User]`
  - `create(user_data: UserCreate) -> User`
  - `update(id: UUID, user_data: UserUpdate) -> User`
  - `delete(id: UUID) -> bool`
- Match exact SQL queries from TypeScript version

### 6. Port Session Repository
- Create `app/repositories/session_repository.py`:
  - `find_by_token(token: str) -> Session | None`
  - `create(user_id: UUID, token: str, expires_at: datetime) -> Session`
  - `delete_by_token(token: str) -> bool`
  - `delete_all_for_user(user_id: UUID) -> int`
  - `delete_expired() -> int`

### 7. Port Simulation Repository
- Create `app/repositories/simulation_repository.py`:
  - `find_by_id(id: UUID) -> Simulation | None`
  - `find_by_simulation_id(sim_id: str) -> Simulation | None`
  - `find_by_user_id(user_id: UUID) -> list[Simulation]`
  - `create(data: SimulationCreate) -> Simulation`
  - `update(id: UUID, updates: SimulationUpdate) -> Simulation`
  - `delete(id: UUID) -> bool`
  - `complete(id: UUID, xp: int, review: dict) -> Simulation`
  - `get_user_stats(user_id: UUID) -> UserStats`
- Handle JSONB columns for client_profile, conversation_history, objectives

### 8. Port Remaining Repositories
- Create `app/repositories/feedback_repository.py`
- Create `app/repositories/competency_repository.py`
- Create `app/repositories/parameter_repository.py`
- Create `app/repositories/engagement_repository.py`
- Create `app/repositories/rubric_repository.py`
- Create `app/repositories/file_competency_repository.py`
- Create `app/repositories/file_industry_repository.py`
- Create `app/repositories/file_rubric_repository.py`
- Each repository mirrors TypeScript version exactly

### 9. Create Pydantic Models
- Create `app/models/user.py`:
  ```python
  class UserBase(BaseModel):
      email: EmailStr
      name: str
      role: Literal["learner", "trainer", "company_admin", "super_admin"]
      job_role: str | None = None

  class UserCreate(UserBase):
      password: str

  class User(UserBase):
      id: UUID
      created_at: datetime
      updated_at: datetime | None

  class UserWithStats(User):
      total_simulations: int
      completed_simulations: int
      avg_score: float | None
  ```
- Create models for all entities (session, simulation, feedback, etc.)
- Create `app/models/common.py` for shared responses:
  ```python
  class SuccessResponse(BaseModel, Generic[T]):
      success: bool = True
      data: T

  class ErrorResponse(BaseModel):
      success: bool = False
      error: str | dict
  ```

### 10. Port Auth Service
- Create `app/services/auth_service.py`:
  - `login(email: str, password: str) -> LoginResponse`
  - `signup(data: SignupData) -> SignupResponse`
  - `logout(token: str) -> bool`
  - `verify_session(token: str) -> User | None`
  - `refresh_session(token: str) -> Session`
  - `change_password(user_id: UUID, current: str, new: str) -> bool`
  - `generate_session_token() -> str` (use secrets.token_urlsafe)
  - `validate_password_strength(password: str) -> bool`
  - `hash_password(password: str) -> str` (use passlib bcrypt)
  - `verify_password(plain: str, hashed: str) -> bool`
- Session expiry: 30 days
- Password policy: min 8 chars, complexity required

### 11. Port User Service
- Create `app/services/user_service.py`:
  - `get_user_by_id(user_id: UUID) -> User`
  - `get_user_with_stats(user_id: UUID) -> UserWithStats`
  - `get_user_by_email(email: str) -> User`
  - `get_all_users() -> list[User]`
  - `create_user(data: UserCreate) -> User`
  - `update_user(user_id: UUID, data: UserUpdate) -> User`
  - `delete_user(user_id: UUID) -> bool`
  - `get_users_by_role(role: str) -> list[User]`

### 12. Port Simulation Service
- Create `app/services/simulation_service.py`:
  - `start_simulation(data: StartSimulation) -> Simulation`
  - `get_simulation_by_id(id: UUID) -> Simulation`
  - `get_simulation_with_details(id: UUID) -> SimulationWithDetails`
  - `get_user_simulations(user_id: UUID) -> list[Simulation]`
  - `get_all_simulations(limit: int | None) -> list[Simulation]`
  - `update_conversation(id: UUID, history: list, objectives: list) -> Simulation`
  - `delete_simulation(id: UUID) -> bool`
  - `get_user_stats(user_id: UUID) -> UserSimulationStats`
  - `generate_objectives(competencies: list, difficulty: int) -> list[str]`
  - `is_valid_industry(industry: str) -> bool`

### 13. Port Remaining Services
- Create `app/services/feedback_service.py`
- Create `app/services/competency_service.py`
- Create `app/services/parameter_service.py`
- Create `app/services/engagement_service.py`
- Create `app/services/industry_service.py`
- Create `app/services/email_service.py` (use aiosmtplib)
- Create `app/services/rubric_service.py`
- Create `app/services/profile_generation_service.py`
- Create `app/services/fusion_model_service.py`
- Each service mirrors TypeScript version exactly

### 14. Create FastAPI Dependencies
- Create `app/dependencies.py`:
  ```python
  async def get_current_user(
      authorization: str = Header(None),
      session_token: str = Cookie(None)
  ) -> User:
      token = extract_token(authorization) or session_token
      if not token:
          raise HTTPException(401, "Not authenticated")
      user = await auth_service.verify_session(token)
      if not user:
          raise HTTPException(401, "Invalid session")
      return user

  async def require_admin(user: User = Depends(get_current_user)) -> User:
      if user.role not in ["super_admin", "company_admin"]:
          raise HTTPException(403, "Admin access required")
      return user

  async def optional_auth(...) -> User | None:
      # Returns user if authenticated, None otherwise
  ```

### 15. Port Auth Routes
- Create `app/routers/auth.py`:
  - `POST /api/auth/register` - User registration
  - `POST /api/auth/login` - Login with email/password
  - `POST /api/auth/change-password` - Change password (auth required)
  - `GET /api/auth/debug-constraint` - Debug endpoint
- Use FastAPI APIRouter with prefix="/api/auth"
- Match exact request/response formats

### 16. Port Users Routes
- Create `app/routers/users.py`:
  - `GET /api/users` - Get all users (admin)
  - `POST /api/users` - Create user (admin)
  - `GET /api/users/{id}` - Get user by ID (self/admin)
  - `PUT /api/users/{id}` - Update user (admin)
  - `DELETE /api/users/{id}` - Delete user (admin)
  - `POST /api/users/bulk-import` - Bulk import (admin)

### 17. Port Simulation Routes
- Create `app/routers/simulation.py`:
  - `GET /api/simulation` - Get user's simulations
  - `POST /api/simulation` - Start new simulation
  - `GET /api/simulation/{id}` - Get simulation with details
  - `PUT /api/simulation/{id}` - Update conversation history
  - `PATCH /api/simulation/{id}` - Update simulation
  - `DELETE /api/simulation/{id}` - Delete simulation
  - `POST /api/simulation/{id}/complete` - Mark complete
  - `POST /api/simulation/generate-review` - Generate AI review

### 18. Port Chat Routes
- Create `app/routers/chat.py`:
  - `POST /api/chat/client-response` - Generate AI client response
  - `POST /api/chat/expert-response` - Generate expert guidance
  - `POST /api/chat/set-api-key` - Store API key in memory
  - `POST /api/chat/test-api-key` - Test OpenAI API key
- Implement Azure agent → OpenAI fallback logic

### 19. Port Remaining Routes
- Create `app/routers/parameters.py`
- Create `app/routers/competencies.py`
- Create `app/routers/feedback.py`
- Create `app/routers/engagement.py`
- Create `app/routers/difficulty.py`
- Create `app/routers/industry_settings.py`
- Create `app/routers/agents.py`
- Create `app/routers/health.py`

### 20. Port AI Service
- Create `app/services/ai_service.py`:
  - Use `openai` Python SDK
  - `generate_text(prompt: str, model: str, params: dict) -> str`
  - `generate_completion(messages: list, model: str) -> str`
  - `evaluate_text(text: str, criteria: list) -> dict`
  - `extract_entities(text: str) -> list`
  - `summarize_text(text: str) -> str`
- Support streaming with SSE

### 21. Port Azure AI Agents
- Create `app/agents/azure_client.py`:
  - Initialize AIProjectClient with DefaultAzureCredential
  - Singleton pattern for client reuse
  - `is_configured() -> bool`
  - `initialize() -> None`
- Create `app/agents/base_agent.py`:
  - Abstract class with common functionality
  - `initialize() -> None`
  - `chat(messages: list) -> str`
  - `chat_stream(messages: list) -> AsyncGenerator`
  - `handle_tool_call(tool_name: str, args: dict) -> dict`
- Create agent implementations:
  - `app/agents/simulation_client_agent.py`
  - `app/agents/profile_generation_agent.py`
  - `app/agents/evaluation_agent.py`
  - `app/agents/expert_guidance_agent.py`

### 22. Port WebSocket TTS Service
- Create `sio/__init__.py`:
  ```python
  import socketio
  sio = socketio.AsyncServer(
      async_mode='asgi',
      cors_allowed_origins=[
          "http://localhost:3000",
          "http://localhost:3002",
      ]
  )
  ```
- Create `sio/tts_handler.py`:
  - Handle `connection` event
  - Handle `generate-speech` event (call OpenAI TTS API)
  - Handle `stop-speech` event
  - Emit `tts-connected`, `tts-error` events
  - Track connection statistics
- Use OpenAI TTS API with streaming

### 23. Create Error Handling Middleware
- Create `app/middleware/error_handler.py`:
  ```python
  @app.exception_handler(HTTPException)
  async def http_exception_handler(request, exc):
      return JSONResponse(
          status_code=exc.status_code,
          content={"success": False, "error": exc.detail}
      )

  @app.exception_handler(Exception)
  async def general_exception_handler(request, exc):
      return JSONResponse(
          status_code=500,
          content={"success": False, "error": "Internal server error"}
      )
  ```

### 24. Create Main Application Entry Point
- Create `main.py`:
  ```python
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware
  import socketio

  app = FastAPI(title="RPlay API", version="1.0.0")

  # CORS
  app.add_middleware(
      CORSMiddleware,
      allow_origins=[
          "http://localhost:3000",
          "http://localhost:3002",
      ],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )

  # Mount routers
  app.include_router(auth_router)
  app.include_router(users_router)
  # ... all routers

  # Socket.io
  socket_app = socketio.ASGIApp(sio, app)

  @app.on_event("startup")
  async def startup():
      await database.connect()
      await initialize_agents()

  @app.on_event("shutdown")
  async def shutdown():
      await database.disconnect()
  ```

### 25. Update Root Package Configuration
- Update root `package.json` to add Python backend scripts:
  ```json
  {
    "scripts": {
      "dev:backend-python": "cd backend-python && uv run uvicorn main:socket_app --reload --port 3001",
      "build:backend-python": "cd backend-python && uv sync",
      "start:backend-python": "cd backend-python && uv run uvicorn main:socket_app --port 3001"
    }
  }
  ```

### 26. Validate Implementation
- Test all endpoints manually:
  - Health check: `curl http://localhost:3001/health`
  - Auth flow: register, login, change-password
  - CRUD operations on all resources
  - AI endpoints: client-response, expert-response
  - WebSocket TTS connection
- Verify response formats match exactly
- Run frontend against Python backend
- Check no TypeScript errors in frontend (API compatibility)

## Testing Strategy

### Unit Tests
- Test each repository method with mock database
- Test each service method with mock repositories
- Test password hashing and validation
- Test session token generation and verification

### Integration Tests
- Test each API endpoint with real database
- Test authentication flow end-to-end
- Test role-based access control
- Test AI integration with mock responses

### Compatibility Tests
- Run existing Playwright E2E tests against Python backend
- Verify all frontend flows work unchanged
- Compare API responses between Node.js and Python backends

### Edge Cases
- Invalid authentication tokens
- Expired sessions
- Database connection failures
- OpenAI API errors
- Azure agent unavailability (fallback to OpenAI)
- WebSocket disconnection handling

## Acceptance Criteria
1. All existing API endpoints work identically
2. Same request/response formats maintained
3. Authentication works with existing frontend
4. Database schema unchanged (same migrations)
5. WebSocket TTS functions correctly
6. AI integrations (OpenAI + Azure) work with fallback
7. CORS configuration matches original
8. Health endpoints report correct status
9. Existing Playwright tests pass
10. Frontend works without modification

## Validation Commands

Execute these commands to validate the implementation:

```bash
# Install dependencies
cd backend-python && uv sync

# Run development server
uv run uvicorn main:socket_app --reload --port 3001

# Test health endpoint
curl http://localhost:3001/health

# Test database connection
curl http://localhost:3001/api/health/db

# Test agent health
curl http://localhost:3001/api/agents/health

# Run Python tests
cd backend-python && uv run pytest

# Run E2E tests (from root)
npm run test:e2e

# Build frontend and test against Python backend
npm run build:frontend
```

## Notes

### Python Dependencies Summary
| Purpose | Package |
|---------|---------|
| Web framework | fastapi |
| ASGI server | uvicorn[standard] |
| PostgreSQL async | asyncpg |
| Validation | pydantic, pydantic-settings |
| Password hashing | passlib[bcrypt] |
| Email | aiosmtplib |
| OpenAI | openai |
| Azure AI | azure-ai-projects, azure-identity |
| WebSocket | python-socketio |
| JSON (fast) | orjson |
| Environment | python-dotenv |
| HTTP client | httpx |

### Key Differences from Node.js
| Aspect | Node.js/Express | Python/FastAPI |
|--------|-----------------|----------------|
| Async | Promises | async/await (native) |
| Validation | Zod | Pydantic |
| DB driver | @neondatabase/serverless | asyncpg |
| Password hash | bcryptjs | passlib |
| UUID | uuid package | uuid module (stdlib) |
| JSON | JSON.parse/stringify | orjson |
| Types | TypeScript interfaces | Pydantic models |
| Middleware | Express middleware | FastAPI middleware/depends |
| WebSocket | socket.io | python-socketio |

### Migration Considerations
1. **Database Connection:** asyncpg uses connection pooling differently - configure pool size appropriately
2. **Session Storage:** Keep using database sessions (not JWT) for compatibility
3. **File Storage:** JSON files in shared/data/ are read the same way
4. **Environment:** Same .env variables, loaded with python-dotenv
5. **CORS:** Same origins configured in FastAPI CORSMiddleware
6. **Error Responses:** Maintain `{success: false, error: "..."}` format

### Directory Structure Rationale
- `app/` - Main application code (FastAPI convention)
- `app/models/` - Pydantic models (request/response schemas)
- `app/repositories/` - Database access layer
- `app/services/` - Business logic layer
- `app/routers/` - API route handlers
- `app/agents/` - Azure AI Agents
- `sio/` - Socket.io handlers (separate from main app)
- `tests/` - Test files

### Keeping Node.js Backend
The original `backend/` directory is preserved during migration. Once Python backend is validated, it can be removed or archived. During transition:
- Port 3001: Python backend (new)
- Port 3002: Node.js backend (legacy, for comparison)
