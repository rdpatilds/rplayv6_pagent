# Financial Services Simulator - System Design V1 (Simplified)

**Version:** 1.0
**Date:** December 18, 2025
**Author:** Principal Engineer
**Status:** Design Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [V1 Design Principles](#2-v1-design-principles)
3. [Architecture Overview](#3-architecture-overview)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Database Design](#7-database-design)
8. [Multi-Tenancy Strategy](#8-multi-tenancy-strategy)
9. [Authentication Integration](#9-authentication-integration)
10. [Module Specifications](#10-module-specifications)
11. [Local Development Setup](#11-local-development-setup)
12. [Testing Strategy](#12-testing-strategy)
13. [Migration from MVP](#13-migration-from-mvp)
14. [Deployment Strategy](#14-deployment-strategy)
15. [Technology Stack](#15-technology-stack)
16. [Phase 2 Evolution Path](#16-phase-2-evolution-path)

---

## 1. Executive Summary

### 1.1 Purpose

This document outlines the **V1 simplified architecture** for the Financial Services Simulator platform. V1 focuses on:

- **Monorepo structure** with frontend and backend
- **Modular backend** (not microservices) for easier development and testing
- **Simple multi-tenancy** using tenant_id columns
- **External auth service** integration (Cognito-based, separate repo)
- **Local testability** with minimal dependencies
- **Clear migration path** from existing MVP

### 1.2 Key Simplifications from Full Design

| Aspect | Full Design | V1 Simplified |
|--------|-------------|---------------|
| **Services** | 9 microservices | 2 services (Frontend + Backend monolith) |
| **Auth** | Dedicated Auth Service | External (existing Cognito auth service) |
| **Multi-Tenancy** | Schema-per-tenant + RLS | tenant_id column only |
| **Repository** | Multiple repos | Single monorepo |
| **Deployment** | Kubernetes + ArgoCD | Azure App Service or simple K8s |
| **Complexity** | Production-ready enterprise | MVP-to-product transition |

### 1.3 Success Criteria for V1

- ✅ Separate frontend and backend codebases in monorepo
- ✅ Backend runs independently with modular architecture
- ✅ Multi-tenant support with tenant_id filtering
- ✅ Integration with existing Cognito auth service
- ✅ Runs locally with only DATABASE_URL environment variable
- ✅ Clear module boundaries for future microservice extraction
- ✅ RAG integration with Azure OpenAI and Cognitive Search
- ✅ LMS integration support (LTI 1.3)

---

## 2. V1 Design Principles

### 2.1 Simplicity First

- **Monorepo**: Easier dependency management, shared types, faster development
- **Modular Monolith**: Clear module boundaries, but single deployment unit
- **Simple Multi-Tenancy**: tenant_id column in all tables, enforced at application layer
- **Minimal Infrastructure**: Can run on Azure App Service, no K8s required initially

### 2.2 Testability

- **Local Development**: Full stack runs locally with just PostgreSQL
- **Mock Auth**: JWT token mocking for local testing
- **Integration Tests**: Easy to test modules in isolation
- **E2E Tests**: Single deployment simplifies testing

### 2.3 Future-Proof

- **Clear Module Boundaries**: Each module can become a microservice later
- **API Contracts**: Well-defined interfaces between modules
- **Database Isolation**: Each module has its own schema namespace (future migration ready)
- **Event-Driven Ready**: Internal event bus (in-memory for V1, Azure Service Bus for V2)

### 2.4 Developer Experience

- **Fast Feedback**: Hot reload for frontend and backend
- **Type Safety**: Shared TypeScript types across frontend and backend
- **Clear Structure**: Logical folder organization
- **Documentation**: API docs auto-generated from code (OpenAPI)

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         End Users / LMS                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Front Door (CDN)                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐      ┌──────────────────────────────────┐
│   Frontend   │      │    External Auth Service         │
│   (Next.js)  │      │    (Cognito - Separate Repo)     │
│              │      │                                   │
│  - React SPA │      │  - User authentication           │
│  - Tailwind  │      │  - JWT token issuance            │
│  - shadcn/ui │      │  - User management               │
└──────┬───────┘      └────────────┬─────────────────────┘
       │                           │
       │  JWT                      │ JWT
       ├───────────────┐           │
       │               │           │
       ▼               ▼           │
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js Monolith)                   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      Core Modules                         │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │   Auth       │  │  Simulator   │  │   Persona    │    │  │
│  │  │   Module     │  │   Module     │  │   (AI/RAG)   │    │  │
│  │  │              │  │              │  │   Module     │    │  │
│  │  │ - JWT verify │  │ - Session    │  │ - Profile    │    │  │
│  │  │ - Tenant ctx │  │ - Objectives │  │ - AI chat    │    │  │
│  │  │ - User info  │  │ - Review     │  │ - RAG search │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │  Analytics   │  │     LMS      │  │ Notification │    │  │
│  │  │   Module     │  │   Module     │  │   Module     │    │  │
│  │  │              │  │              │  │              │    │  │
│  │  │ - Events     │  │ - LTI 1.3    │  │ - Email      │    │  │
│  │  │ - Metrics    │  │ - Grade sync │  │ - In-app     │    │  │
│  │  │ - Reports    │  │ - Roster     │  │ - Templates  │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────┬──────────────────────────────┘  │
│                               │                                  │
│  ┌────────────────────────────▼──────────────────────────────┐  │
│  │              Shared Infrastructure Layer                  │  │
│  │                                                            │  │
│  │  - Database Client (Prisma/Drizzle)                       │  │
│  │  - Redis Client (Caching)                                 │  │
│  │  - Azure OpenAI Client                                    │  │
│  │  - Azure Cognitive Search Client                          │  │
│  │  - Event Bus (In-memory for V1)                           │  │
│  │  - Logger (Winston/Pino)                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │   PostgreSQL     │    │  Azure Services  │
    │   (Primary DB)   │    │                  │
    │                  │    │ - OpenAI         │
    │ - User data      │    │ - Cognitive      │
    │ - Simulations    │    │   Search (RAG)   │
    │ - Analytics      │    │ - Blob Storage   │
    └──────────────────┘    └──────────────────┘
              │
              ▼
    ┌──────────────────┐
    │  Redis Cache     │
    │                  │
    │ - Session cache  │
    │ - User cache     │
    │ - Prompt cache   │
    └──────────────────┘
```

### 3.2 Component Responsibilities

**Frontend (Next.js App):**
- User interface (learner portal, admin portal)
- Authentication flow (redirect to Cognito, handle callback)
- API communication with backend
- State management
- Client-side routing

**Backend (Node.js Monolith):**
- API endpoints (REST)
- Business logic (modules)
- JWT validation
- Multi-tenant context enforcement
- Database operations
- Azure service integration (OpenAI, Cognitive Search)
- Event handling

**External Auth Service (Cognito - Separate Repo):**
- User authentication
- JWT token issuance (access token + id token)
- User profile management
- Password reset, email verification

**PostgreSQL:**
- Single database with all tables
- tenant_id column in every table
- Application-enforced multi-tenancy

**Redis:**
- User session cache
- Tenant configuration cache
- AI prompt response cache

**Azure OpenAI:**
- GPT-4o for conversation AI
- text-embedding-ada-002 for RAG embeddings

**Azure Cognitive Search:**
- Vector search for RAG
- Kaplan content index

---

## 4. Monorepo Structure

### 4.1 Directory Layout

```
/simulator-platform
├── package.json                 # Root workspace config
├── turbo.json                   # Turborepo config (optional)
├── tsconfig.json                # Base TypeScript config
├── .env.example                 # Environment variables template
├── README.md
│
├── /apps
│   ├── /frontend                # Next.js frontend application
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── /src
│   │   │   ├── /app            # Next.js App Router
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── /dashboard
│   │   │   │   ├── /simulation
│   │   │   │   ├── /admin
│   │   │   │   └── /auth
│   │   │   ├── /components     # React components
│   │   │   │   ├── /ui         # shadcn/ui components
│   │   │   │   ├── /simulation
│   │   │   │   └── /admin
│   │   │   ├── /lib            # Frontend utilities
│   │   │   │   ├── /api        # API client
│   │   │   │   ├── /auth       # Auth helpers
│   │   │   │   └── /hooks      # Custom React hooks
│   │   │   ├── /store          # State management
│   │   │   └── /styles         # Global styles
│   │   └── /public             # Static assets
│   │
│   └── /backend                 # Node.js backend application
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json        # NestJS CLI config
│       ├── /src
│       │   ├── main.ts          # Application entry point
│       │   ├── app.module.ts    # Root module
│       │   ├── /common          # Shared utilities
│       │   │   ├── /decorators
│       │   │   ├── /filters     # Exception filters
│       │   │   ├── /guards      # Auth guards
│       │   │   ├── /interceptors # Logging, etc.
│       │   │   ├── /middleware  # Tenant context, etc.
│       │   │   └── /pipes       # Validation pipes
│       │   ├── /config          # Configuration
│       │   │   ├── database.config.ts
│       │   │   ├── redis.config.ts
│       │   │   ├── azure.config.ts
│       │   │   └── auth.config.ts
│       │   ├── /modules         # Feature modules
│       │   │   ├── /auth        # Auth module (JWT validation)
│       │   │   ├── /simulator   # Simulator module
│       │   │   ├── /persona     # AI/RAG module
│       │   │   ├── /analytics   # Analytics module
│       │   │   ├── /lms         # LMS integration
│       │   │   └── /notification # Notifications
│       │   └── /infrastructure  # Infrastructure layer
│       │       ├── /database    # Database client
│       │       │   ├── schema.prisma  # Prisma schema
│       │       │   └── /migrations
│       │       ├── /cache       # Redis client
│       │       ├── /azure       # Azure clients
│       │       │   ├── openai.client.ts
│       │       │   └── search.client.ts
│       │       └── /events      # Event bus
│       └── /test                # Integration tests
│
├── /packages                    # Shared packages
│   ├── /types                   # Shared TypeScript types
│   │   ├── package.json
│   │   └── /src
│   │       ├── user.types.ts
│   │       ├── simulation.types.ts
│   │       ├── persona.types.ts
│   │       └── index.ts
│   │
│   ├── /utils                   # Shared utilities
│   │   ├── package.json
│   │   └── /src
│   │       ├── format.ts
│   │       ├── validation.ts
│   │       └── index.ts
│   │
│   └── /config                  # Shared configuration
│       ├── package.json
│       └── /src
│           ├── constants.ts
│           └── index.ts
│
├── /scripts                     # Build/deployment scripts
│   ├── setup-local.sh
│   ├── seed-database.ts
│   └── generate-jwt.ts          # Mock JWT for local dev
│
├── /docs                        # Documentation
│   ├── API.md
│   ├── SETUP.md
│   └── MIGRATION.md
│
└── /infrastructure              # Deployment configs
    ├── /docker
    │   ├── Dockerfile.frontend
    │   └── Dockerfile.backend
    ├── /kubernetes              # K8s manifests (for later)
    └── /terraform               # IaC (for later)
```

### 4.2 Workspace Configuration (package.json)

```json
{
  "name": "simulator-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:frontend": "npm run dev --workspace=apps/frontend",
    "dev:backend": "npm run dev --workspace=apps/backend",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:migrate": "npm run migrate --workspace=apps/backend",
    "db:seed": "npm run seed --workspace=apps/backend",
    "setup:local": "bash scripts/setup-local.sh"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  }
}
```

---

## 5. Backend Architecture

### 5.1 Modular Monolith Design

The backend is structured as a **modular monolith** using NestJS. Each module is self-contained with:
- Controllers (API endpoints)
- Services (business logic)
- Repositories (database access)
- DTOs (data transfer objects)
- Entities (domain models)

**Benefits:**
- Clear module boundaries for future microservice extraction
- Easy to test modules in isolation
- Single deployment unit (simpler for V1)
- Shared infrastructure (database connection pool, etc.)

### 5.2 Module Structure

```typescript
/src/modules/simulator
├── simulator.module.ts          # Module definition
├── /controllers
│   ├── simulation.controller.ts # API endpoints
│   └── review.controller.ts
├── /services
│   ├── simulation.service.ts    # Business logic
│   ├── profile.service.ts
│   └── review.service.ts
├── /repositories
│   └── simulation.repository.ts # Database queries
├── /dto
│   ├── create-simulation.dto.ts
│   └── simulation-response.dto.ts
├── /entities
│   └── simulation.entity.ts     # Domain model
└── /tests
    └── simulation.service.spec.ts
```

### 5.3 Core Modules

#### 5.3.1 Auth Module

**Responsibilities:**
- Validate JWT tokens from Cognito
- Extract user info (user_id, tenant_id) from JWT
- Provide authentication guards
- Manage tenant context

**Key Files:**
```typescript
/modules/auth
├── auth.module.ts
├── /guards
│   ├── jwt-auth.guard.ts        # Validates JWT
│   └── tenant-guard.guard.ts    # Enforces tenant context
├── /strategies
│   └── jwt.strategy.ts          # Passport JWT strategy
├── /decorators
│   ├── current-user.decorator.ts
│   └── current-tenant.decorator.ts
└── /services
    └── auth.service.ts
```

**JWT Validation:**
```typescript
// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        // Fetch JWKS from Cognito
        const jwks = await this.fetchJwks();
        const key = this.getSigningKey(jwks, rawJwtToken);
        done(null, key);
      },
      algorithms: ['RS256']
    });
  }

  async validate(payload: any) {
    // Extract claims from JWT
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      tenantId: payload['custom:tenant_id'], // Cognito custom attribute
      roles: payload['custom:roles']?.split(',') || ['learner']
    };
  }

  private async fetchJwks() {
    // Fetch from Cognito JWKS endpoint
    const jwksUrl = this.configService.get('COGNITO_JWKS_URL');
    const response = await fetch(jwksUrl);
    return response.json();
  }

  private getSigningKey(jwks: any, token: string) {
    // Extract kid from JWT header and find matching key
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
    const key = jwks.keys.find(k => k.kid === header.kid);

    if (!key) throw new Error('Invalid JWT signature');

    // Convert JWK to PEM format
    return this.jwkToPem(key);
  }
}
```

**Tenant Context Middleware:**
```typescript
// tenant-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // User is attached by JWT auth guard
    const user = (req as any).user;

    if (user && user.tenantId) {
      // Attach tenant context to request
      (req as any).tenantId = user.tenantId;

      // Set PostgreSQL session variable for RLS (future use)
      // await db.query(`SET app.tenant_id = '${user.tenantId}'`);
    }

    next();
  }
}
```

**Current User Decorator:**
```typescript
// current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

// Usage in controller:
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: any) {
  return user;
}
```

---

#### 5.3.2 Simulator Module

**Responsibilities:**
- Manage simulation sessions
- Handle industry/difficulty configuration
- Track objectives and progress
- Generate performance reviews

**API Endpoints:**
```typescript
// simulation.controller.ts
@Controller('api/v1/simulations')
@UseGuards(JwtAuthGuard)
export class SimulationController {
  constructor(private simulationService: SimulationService) {}

  // Get available industries and configurations
  @Get('industries')
  async getIndustries(@CurrentUser('tenantId') tenantId: string) {
    return this.simulationService.getAvailableIndustries(tenantId);
  }

  // Create new simulation session
  @Post()
  async createSimulation(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateSimulationDto
  ) {
    return this.simulationService.createSimulation(userId, tenantId, dto);
  }

  // Get simulation session details
  @Get(':sessionId')
  async getSimulation(
    @Param('sessionId') sessionId: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.simulationService.getSimulation(sessionId, tenantId);
  }

  // Send message in simulation
  @Post(':sessionId/messages')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: SendMessageDto
  ) {
    return this.simulationService.handleMessage(sessionId, tenantId, dto);
  }

  // Complete simulation and get review
  @Post(':sessionId/complete')
  async completeSimulation(
    @Param('sessionId') sessionId: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.simulationService.completeSimulation(sessionId, tenantId);
  }

  // Get user's simulation history
  @Get()
  async getHistory(
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.simulationService.getUserHistory(userId, tenantId);
  }
}
```

**Service Logic:**
```typescript
// simulation.service.ts
@Injectable()
export class SimulationService {
  constructor(
    private simulationRepository: SimulationRepository,
    private personaService: PersonaService,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async createSimulation(
    userId: string,
    tenantId: string,
    dto: CreateSimulationDto
  ): Promise<Simulation> {
    this.logger.log(`Creating simulation for user ${userId}, tenant ${tenantId}`);

    // Generate client profile via Persona module
    const clientProfile = await this.personaService.generateClientProfile({
      industry: dto.industry,
      difficulty: dto.difficulty,
      focusAreas: dto.focusAreas,
      tenantId
    });

    // Create simulation record
    const simulation = await this.simulationRepository.create({
      user_id: userId,
      tenant_id: tenantId,
      industry: dto.industry,
      subcategory: dto.subcategory,
      difficulty: dto.difficulty,
      focus_areas: dto.focusAreas,
      client_profile: clientProfile,
      conversation_history: [],
      objectives_completed: {},
      current_state: 'in_progress'
    });

    // Publish event
    this.eventBus.publish('simulation.created', {
      simulationId: simulation.id,
      userId,
      tenantId
    });

    return simulation;
  }

  async handleMessage(
    sessionId: string,
    tenantId: string,
    dto: SendMessageDto
  ): Promise<MessageResponse> {
    // Get simulation (with tenant filtering)
    const simulation = await this.simulationRepository.findByIdAndTenant(
      sessionId,
      tenantId
    );

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    // Call Persona module for AI response
    const aiResponse = await this.personaService.generateResponse({
      profile: simulation.client_profile,
      conversationHistory: simulation.conversation_history,
      userMessage: dto.message,
      objectives: simulation.objectives_completed,
      tenantId
    });

    // Update conversation history
    simulation.conversation_history.push(
      { role: 'user', content: dto.message, timestamp: new Date() },
      { role: 'assistant', content: aiResponse.message, timestamp: new Date() }
    );

    // Update objectives if AI indicated progress
    if (aiResponse.objectivesUpdate) {
      simulation.objectives_completed = {
        ...simulation.objectives_completed,
        ...aiResponse.objectivesUpdate
      };
    }

    // Save to database
    await this.simulationRepository.update(simulation.id, {
      conversation_history: simulation.conversation_history,
      objectives_completed: simulation.objectives_completed
    });

    // Publish event
    this.eventBus.publish('simulation.message_sent', {
      simulationId: simulation.id,
      messageCount: simulation.conversation_history.length
    });

    return {
      message: aiResponse.message,
      objectives: simulation.objectives_completed,
      ragSources: aiResponse.ragSources
    };
  }

  async completeSimulation(
    sessionId: string,
    tenantId: string
  ): Promise<PerformanceReview> {
    const simulation = await this.simulationRepository.findByIdAndTenant(
      sessionId,
      tenantId
    );

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    // Generate performance review via Persona module
    const review = await this.personaService.generatePerformanceReview({
      simulationId: simulation.id,
      conversationHistory: simulation.conversation_history,
      objectives: simulation.objectives_completed,
      industry: simulation.industry,
      difficulty: simulation.difficulty,
      tenantId
    });

    // Update simulation state
    await this.simulationRepository.update(simulation.id, {
      current_state: 'completed',
      completed_at: new Date(),
      duration_seconds: this.calculateDuration(simulation.started_at)
    });

    // Publish event
    this.eventBus.publish('simulation.completed', {
      simulationId: simulation.id,
      userId: simulation.user_id,
      tenantId,
      score: review.overall_score
    });

    return review;
  }
}
```

**Repository (Tenant Filtering):**
```typescript
// simulation.repository.ts
@Injectable()
export class SimulationRepository {
  constructor(private db: DatabaseService) {}

  async findByIdAndTenant(id: string, tenantId: string): Promise<Simulation | null> {
    return this.db.simulation.findFirst({
      where: {
        id,
        tenant_id: tenantId // ALWAYS filter by tenant
      }
    });
  }

  async create(data: CreateSimulationData): Promise<Simulation> {
    // tenant_id is REQUIRED in data
    if (!data.tenant_id) {
      throw new Error('tenant_id is required');
    }

    return this.db.simulation.create({ data });
  }

  async findByUserAndTenant(userId: string, tenantId: string): Promise<Simulation[]> {
    return this.db.simulation.findMany({
      where: {
        user_id: userId,
        tenant_id: tenantId
      },
      orderBy: { started_at: 'desc' }
    });
  }
}
```

---

#### 5.3.3 Persona Module (AI/RAG)

**Responsibilities:**
- Generate client profiles using Fusion Model
- Generate AI responses with RAG context
- Manage personality archetypes, moods, quirks
- Integrate with Azure OpenAI
- Semantic search via Azure Cognitive Search
- Generate performance reviews

**Service Structure:**
```typescript
// persona.service.ts
@Injectable()
export class PersonaService {
  constructor(
    private azureOpenAI: AzureOpenAIClient,
    private cognitiveSearch: AzureCognitiveSearchClient,
    private fusionModelService: FusionModelService,
    private ragService: RagService,
    private logger: Logger
  ) {}

  async generateClientProfile(params: ProfileGenerationParams): Promise<ClientProfile> {
    // 1. Select random personality components from Fusion Model
    const personality = await this.fusionModelService.generatePersonality({
      difficulty: params.difficulty,
      industry: params.industry
    });

    // 2. Generate demographics with AI
    const demographicsPrompt = this.buildDemographicsPrompt(params);
    const demographics = await this.azureOpenAI.chat({
      messages: [{ role: 'user', content: demographicsPrompt }],
      temperature: 0.9
    });

    // 3. Combine into full profile
    return {
      demographics: JSON.parse(demographics.content),
      personality,
      financialSituation: this.generateFinancialSituation(params),
      visibilityLevel: this.getDifficultyVisibility(params.difficulty)
    };
  }

  async generateResponse(params: GenerateResponseParams): Promise<AIResponse> {
    // 1. Retrieve relevant content via RAG
    const ragContext = await this.ragService.searchContent({
      query: params.userMessage,
      industry: params.profile.industry,
      tenantId: params.tenantId,
      topK: 3
    });

    // 2. Build system prompt with RAG context
    const systemPrompt = this.buildSystemPrompt({
      profile: params.profile,
      ragContext: ragContext.map(r => r.content).join('\n\n'),
      objectives: params.objectives,
      conversationHistory: params.conversationHistory
    });

    // 3. Call Azure OpenAI
    const response = await this.azureOpenAI.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        ...params.conversationHistory,
        { role: 'user', content: params.userMessage }
      ],
      temperature: 0.7,
      functions: [this.objectiveTrackingFunction]
    });

    // 4. Parse function call for objectives update
    const objectivesUpdate = response.function_call
      ? JSON.parse(response.function_call.arguments)
      : null;

    return {
      message: response.content,
      objectivesUpdate,
      ragSources: ragContext.map(r => r.metadata.source)
    };
  }

  async generatePerformanceReview(params: ReviewParams): Promise<PerformanceReview> {
    // Use AI to analyze conversation and generate review
    const reviewPrompt = this.buildReviewPrompt(params);

    const response = await this.azureOpenAI.chat({
      messages: [{ role: 'user', content: reviewPrompt }],
      temperature: 0.3 // Lower temperature for consistent reviews
    });

    const review = JSON.parse(response.content);

    // Save to database
    return this.db.performanceReview.create({
      data: {
        simulation_id: params.simulationId,
        competency_scores: review.competency_scores,
        overall_score: review.overall_score,
        strengths: review.strengths,
        areas_for_improvement: review.areas_for_improvement,
        xp_earned: this.calculateXP(review.overall_score)
      }
    });
  }
}
```

**RAG Service:**
```typescript
// rag.service.ts
@Injectable()
export class RagService {
  constructor(
    private azureOpenAI: AzureOpenAIClient,
    private cognitiveSearch: AzureCognitiveSearchClient,
    private db: DatabaseService,
    private cache: CacheService
  ) {}

  async ingestDocument(
    tenantId: string,
    document: File,
    metadata: DocumentMetadata
  ): Promise<void> {
    // 1. Extract text from PDF
    const text = await this.extractText(document);

    // 2. Chunk text
    const chunks = this.chunkText(text, { size: 1000, overlap: 200 });

    // 3. Generate embeddings
    const embeddings = await Promise.all(
      chunks.map(chunk =>
        this.azureOpenAI.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk
        })
      )
    );

    // 4. Index in Cognitive Search
    const searchDocuments = chunks.map((chunk, i) => ({
      id: `${metadata.documentId}_${i}`,
      tenantId: tenantId || null, // null = shared content
      content: chunk,
      contentVector: embeddings[i].data[0].embedding,
      documentId: metadata.documentId,
      chunkIndex: i,
      metadata: JSON.stringify(metadata),
      industry: metadata.industry
    }));

    await this.cognitiveSearch.uploadDocuments(searchDocuments);

    // 5. Store metadata in PostgreSQL
    await this.db.contentChunk.createMany({
      data: chunks.map((chunk, i) => ({
        tenant_id: tenantId,
        document_id: metadata.documentId,
        chunk_index: i,
        content: chunk,
        metadata,
        embedding_id: searchDocuments[i].id
      }))
    });
  }

  async searchContent(params: SearchParams): Promise<SearchResult[]> {
    // Check cache first
    const cacheKey = `rag:${params.tenantId}:${params.query}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // 1. Generate query embedding
    const queryEmbedding = await this.azureOpenAI.embeddings.create({
      model: 'text-embedding-ada-002',
      input: params.query
    });

    // 2. Hybrid search (vector + keyword)
    const results = await this.cognitiveSearch.search(params.query, {
      vectorQueries: [{
        vector: queryEmbedding.data[0].embedding,
        kNearestNeighborsCount: params.topK * 2,
        fields: 'contentVector'
      }],
      filter: `(tenantId eq '${params.tenantId}' or tenantId eq null) and industry eq '${params.industry}'`,
      select: ['content', 'metadata', 'documentId'],
      top: params.topK
    });

    const searchResults = results.results.map(r => ({
      content: r.document.content,
      metadata: JSON.parse(r.document.metadata),
      score: r.score
    }));

    // Cache results for 1 hour
    await this.cache.set(cacheKey, searchResults, 3600);

    return searchResults;
  }
}
```

---

#### 5.3.4 Analytics Module

**Responsibilities:**
- Track engagement events
- Calculate performance metrics
- Generate reports
- Dashboard data

**Event Tracking:**
```typescript
// analytics.service.ts
@Injectable()
export class AnalyticsService {
  constructor(
    private db: DatabaseService,
    private eventBus: EventBus
  ) {
    // Subscribe to events
    this.eventBus.subscribe('simulation.*', this.handleSimulationEvent.bind(this));
  }

  async trackEvent(
    tenantId: string,
    userId: string,
    eventType: string,
    metadata: any
  ): Promise<void> {
    await this.db.engagementEvent.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        event_type: eventType,
        metadata,
        timestamp: new Date()
      }
    });
  }

  async getUserPerformance(userId: string, tenantId: string): Promise<UserPerformance> {
    const simulations = await this.db.simulation.findMany({
      where: { user_id: userId, tenant_id: tenantId, current_state: 'completed' },
      include: { performance_review: true }
    });

    const totalSimulations = simulations.length;
    const avgScore = simulations.reduce((sum, s) =>
      sum + (s.performance_review?.overall_score || 0), 0) / totalSimulations;
    const totalXP = simulations.reduce((sum, s) =>
      sum + (s.performance_review?.xp_earned || 0), 0);

    return {
      totalSimulations,
      avgScore,
      totalXP,
      recentSimulations: simulations.slice(0, 5)
    };
  }

  async getTenantMetrics(tenantId: string, dateRange: DateRange): Promise<TenantMetrics> {
    // Aggregate metrics for tenant
    const [activeUsers, totalSimulations, avgDuration] = await Promise.all([
      this.db.simulation.groupBy({
        by: ['user_id'],
        where: {
          tenant_id: tenantId,
          started_at: { gte: dateRange.start, lte: dateRange.end }
        },
        _count: true
      }),
      this.db.simulation.count({
        where: {
          tenant_id: tenantId,
          started_at: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      this.db.simulation.aggregate({
        where: {
          tenant_id: tenantId,
          current_state: 'completed',
          completed_at: { gte: dateRange.start, lte: dateRange.end }
        },
        _avg: { duration_seconds: true }
      })
    ]);

    return {
      activeUsers: activeUsers.length,
      totalSimulations,
      avgSimulationDuration: avgDuration._avg.duration_seconds,
      period: dateRange
    };
  }

  private async handleSimulationEvent(event: Event) {
    // Auto-track simulation events
    await this.trackEvent(
      event.data.tenantId,
      event.data.userId,
      event.type,
      event.data
    );
  }
}
```

---

#### 5.3.5 LMS Module

**Responsibilities:**
- LTI 1.3 launch handling
- Deep linking
- Grade passback
- User provisioning (SCIM)

**LTI Controller:**
```typescript
// lms.controller.ts
@Controller('api/v1/lms')
export class LmsController {
  constructor(private lmsService: LmsService) {}

  @Post('lti/login')
  async handleLtiLogin(@Body() body: LtiLoginRequest) {
    return this.lmsService.handleLoginInitiation(body);
  }

  @Post('lti/launch')
  async handleLtiLaunch(@Body() body: LtiLaunchRequest) {
    return this.lmsService.handleLaunch(body);
  }

  @Post('lti/deep-link')
  async handleDeepLink(@Body() body: DeepLinkRequest) {
    return this.lmsService.handleDeepLinking(body);
  }

  @Post('grades/sync/:simulationId')
  @UseGuards(JwtAuthGuard)
  async syncGrade(
    @Param('simulationId') simulationId: string,
    @CurrentUser('tenantId') tenantId: string
  ) {
    return this.lmsService.syncGrade(simulationId, tenantId);
  }
}
```

---

#### 5.3.6 Notification Module

**Responsibilities:**
- Email notifications
- In-app notifications
- Template management

**Notification Service:**
```typescript
// notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    private emailService: EmailService,
    private db: DatabaseService,
    private eventBus: EventBus
  ) {
    this.eventBus.subscribe('simulation.completed', this.sendCompletionEmail.bind(this));
  }

  async sendEmail(
    tenantId: string,
    userId: string,
    templateCode: string,
    variables: any
  ): Promise<void> {
    const template = await this.db.notificationTemplate.findUnique({
      where: { code: templateCode }
    });

    const email = await this.renderTemplate(template, variables);

    await this.emailService.send({
      to: variables.email,
      subject: email.subject,
      html: email.body
    });

    await this.db.notification.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        template_code: templateCode,
        channel: 'email',
        status: 'sent'
      }
    });
  }

  private async sendCompletionEmail(event: Event) {
    const { userId, simulationId } = event.data;
    // Send completion email with review
  }
}
```

---

### 5.4 Shared Infrastructure

**Database Client (Prisma):**
```typescript
// infrastructure/database/database.service.ts
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Redis Cache:**
```typescript
// infrastructure/cache/cache.service.ts
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis({
      host: configService.get('REDIS_HOST') || 'localhost',
      port: configService.get('REDIS_PORT') || 6379,
      password: configService.get('REDIS_PASSWORD'),
      db: 0
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
```

**Event Bus (In-Memory for V1):**
```typescript
// infrastructure/events/event-bus.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBus {
  constructor(private eventEmitter: EventEmitter2) {}

  publish(eventType: string, data: any): void {
    this.eventEmitter.emit(eventType, { type: eventType, data, timestamp: new Date() });
  }

  subscribe(pattern: string, handler: (event: Event) => void): void {
    this.eventEmitter.on(pattern, handler);
  }
}
```

---

## 6. Frontend Architecture

### 6.1 Application Structure

**Next.js App Router Structure:**
```
/apps/frontend/src/app
├── layout.tsx                      # Root layout
├── page.tsx                        # Landing page
├── /auth
│   ├── /login
│   │   └── page.tsx                # Redirect to Cognito login
│   ├── /callback
│   │   └── page.tsx                # OAuth callback handler
│   └── /logout
│       └── page.tsx                # Logout handler
├── /dashboard
│   └── page.tsx                    # User dashboard
├── /simulation
│   ├── /attestation
│   │   └── page.tsx
│   ├── /select
│   │   └── page.tsx                # Industry/difficulty selection
│   ├── /setup
│   │   └── page.tsx                # Simulation preview
│   ├── /[sessionId]
│   │   ├── page.tsx                # Main simulation session
│   │   └── /review
│   │       └── page.tsx            # Performance review
│   └── /history
│       └── page.tsx                # Past simulations
├── /admin
│   ├── page.tsx                    # Admin dashboard
│   ├── /users
│   ├── /simulators
│   ├── /analytics
│   └── /settings
└── /profile
    └── page.tsx                    # User profile
```

### 6.2 Authentication Flow

**Login Redirect:**
```typescript
// app/auth/login/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Cognito hosted UI
    const cognitoAuthUrl = new URL(process.env.NEXT_PUBLIC_COGNITO_AUTH_URL);
    cognitoAuthUrl.searchParams.set('response_type', 'code');
    cognitoAuthUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
    cognitoAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
    cognitoAuthUrl.searchParams.set('scope', 'openid email profile');

    window.location.href = cognitoAuthUrl.toString();
  }, []);

  return <div>Redirecting to login...</div>;
}
```

**OAuth Callback:**
```typescript
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      // Exchange code for tokens via backend
      fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
        .then(res => res.json())
        .then(data => {
          // Store tokens and user info
          login(data.access_token, data.id_token, data.user);
          router.push('/dashboard');
        })
        .catch(err => {
          console.error('Auth error:', err);
          router.push('/auth/login');
        });
    }
  }, [searchParams, login, router]);

  return <div>Completing authentication...</div>;
}
```

**Auth Context:**
```typescript
// lib/auth/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, idToken: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (token: string, idToken: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('access_token', token);
    localStorage.setItem('id_token', idToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isAuthenticated: !!user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 6.3 API Client

**API Client with Auth:**
```typescript
// lib/api/client.ts
import { useAuth } from '@/lib/auth';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = localStorage.getItem('access_token');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        window.location.href = '/auth/login';
      }
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Simulation endpoints
  async getIndustries() {
    return this.request<Industry[]>('/api/v1/simulations/industries');
  }

  async createSimulation(data: CreateSimulationDto) {
    return this.request<Simulation>('/api/v1/simulations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async sendMessage(sessionId: string, message: string) {
    return this.request<MessageResponse>(`/api/v1/simulations/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Add more methods as needed
}

export const apiClient = new ApiClient();
```

**React Query Integration:**
```typescript
// lib/hooks/useSimulation.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useSimulation(sessionId: string) {
  const queryClient = useQueryClient();

  const { data: simulation, isLoading } = useQuery({
    queryKey: ['simulation', sessionId],
    queryFn: () => apiClient.getSimulation(sessionId)
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => apiClient.sendMessage(sessionId, message),
    onSuccess: (data) => {
      // Update cache with new message
      queryClient.setQueryData(['simulation', sessionId], (old: any) => ({
        ...old,
        conversation_history: [
          ...old.conversation_history,
          { role: 'user', content: message },
          { role: 'assistant', content: data.message }
        ],
        objectives_completed: data.objectives
      }));
    }
  });

  return {
    simulation,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isLoading
  };
}
```

---

## 7. Database Design

### 7.1 Schema Overview

**Simple Multi-Tenancy Principle:**
- Every table has a `tenant_id` column (UUID)
- Application ALWAYS filters by `tenant_id` in queries
- No separate tenant database/schema (for V1 simplicity)

### 7.2 Core Tables

```sql
-- Users (managed by external Cognito auth service)
-- We only store references, actual auth is in Cognito
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- Multi-tenant field
  cognito_sub TEXT UNIQUE NOT NULL, -- Cognito user ID
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('learner', 'trainer', 'admin', 'super_admin')) DEFAULT 'learner',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_email ON users(email);

-- Industries
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry subcategories
CREATE TABLE industry_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(industry_id, code)
);

-- Competencies
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry-competency mapping
CREATE TABLE industry_competencies (
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  weight DECIMAL(3,2) DEFAULT 1.0,
  PRIMARY KEY (industry_id, competency_id)
);

-- Evaluation rubrics
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE, -- NULL = default
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  criteria JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulations (tenant-specific)
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES industries(id),
  subcategory_id UUID REFERENCES industry_subcategories(id),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
  focus_areas TEXT[],
  client_profile JSONB NOT NULL,
  conversation_history JSONB DEFAULT '[]',
  objectives_completed JSONB DEFAULT '{}',
  current_state TEXT CHECK (current_state IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_simulations_tenant ON simulations(tenant_id);
CREATE INDEX idx_simulations_user ON simulations(user_id);
CREATE INDEX idx_simulations_tenant_user ON simulations(tenant_id, user_id);
CREATE INDEX idx_simulations_state ON simulations(current_state);
CREATE INDEX idx_simulations_completed_at ON simulations(completed_at DESC);

-- Performance reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  competency_scores JSONB NOT NULL,
  overall_score DECIMAL(4,2),
  strengths TEXT[],
  areas_for_improvement TEXT[],
  xp_earned INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_reviews_tenant ON performance_reviews(tenant_id);
CREATE INDEX idx_performance_reviews_simulation ON performance_reviews(simulation_id);

-- Fusion Model: Personality Archetypes
CREATE TABLE personality_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  traits JSONB NOT NULL,
  behaviors JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fusion Model: Communication Styles
CREATE TABLE communication_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  characteristics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fusion Model: Moods
CREATE TABLE personality_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  intensity_range JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fusion Model: Quirks
CREATE TABLE personality_quirks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  impact JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content chunks for RAG (metadata; vectors in Cognitive Search)
CREATE TABLE content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- NULL = shared Kaplan content
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding_id TEXT NOT NULL, -- Reference to Cognitive Search doc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_content_chunks_tenant ON content_chunks(tenant_id);
CREATE INDEX idx_content_chunks_document ON content_chunks(document_id);

-- LMS platforms (tenant-specific)
CREATE TABLE lms_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  platform_type TEXT CHECK (platform_type IN ('canvas', 'moodle', 'blackboard', 'brightspace', 'custom')),
  name TEXT NOT NULL,
  issuer_url TEXT NOT NULL,
  client_id TEXT NOT NULL,
  auth_endpoint TEXT NOT NULL,
  token_endpoint TEXT NOT NULL,
  jwks_endpoint TEXT NOT NULL,
  deployment_id TEXT,
  public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, platform_type)
);

CREATE INDEX idx_lms_platforms_tenant ON lms_platforms(tenant_id);

-- LTI resource links
CREATE TABLE lti_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  lms_platform_id UUID NOT NULL REFERENCES lms_platforms(id) ON DELETE CASCADE,
  resource_link_id TEXT NOT NULL,
  context_id TEXT NOT NULL,
  simulator_id TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lms_platform_id, resource_link_id)
);

CREATE INDEX idx_lti_links_tenant ON lti_resource_links(tenant_id);

-- Grade sync log
CREATE TABLE grade_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  lms_platform_id UUID NOT NULL REFERENCES lms_platforms(id),
  resource_link_id TEXT NOT NULL,
  user_lti_id TEXT NOT NULL,
  score DECIMAL(5,2),
  status TEXT CHECK (status IN ('pending', 'synced', 'failed')),
  error_message TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grade_sync_tenant ON grade_sync_log(tenant_id);
CREATE INDEX idx_grade_sync_status ON grade_sync_log(status);

-- Engagement events (analytics)
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_events_tenant ON engagement_events(tenant_id);
CREATE INDEX idx_engagement_events_user ON engagement_events(user_id);
CREATE INDEX idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX idx_engagement_events_timestamp ON engagement_events(timestamp DESC);

-- Notification templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  channel TEXT CHECK (channel IN ('email', 'in_app')) NOT NULL,
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_code TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Tenant configuration (simple key-value store per tenant)
CREATE TABLE tenant_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_tenant_configs_tenant ON tenant_configs(tenant_id);

-- Tenant simulator access (which simulators each tenant can use)
CREATE TABLE tenant_simulator_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- MULTI-TENANT
  industry_code TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, industry_code)
);

CREATE INDEX idx_tenant_simulator_access ON tenant_simulator_access(tenant_id);
```

### 7.3 Tenant Data Seeding

For V1, we can have a simple tenant setup:

```sql
-- Example: Create two tenants
INSERT INTO tenant_configs (tenant_id, key, value) VALUES
  ('00000000-0000-0000-0000-000000000001', 'name', '"Tenant A - Acme Corp"'),
  ('00000000-0000-0000-0000-000000000001', 'branding', '{"logo": "/logos/acme.png", "primary_color": "#230F6E"}'),
  ('00000000-0000-0000-0000-000000000002', 'name', '"Tenant B - Example Inc"'),
  ('00000000-0000-0000-0000-000000000002', 'branding', '{"logo": "/logos/example.png", "primary_color": "#FF5733"}');

-- Tenant A has access to Insurance and Wealth Management
INSERT INTO tenant_simulator_access (tenant_id, industry_code, enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'insurance', true),
  ('00000000-0000-0000-0000-000000000001', 'wealth_management', true);

-- Tenant B has access to Insurance only
INSERT INTO tenant_simulator_access (tenant_id, industry_code, enabled) VALUES
  ('00000000-0000-0000-0000-000000000002', 'insurance', true);
```

---

## 8. Multi-Tenancy Strategy

### 8.1 Tenant ID Propagation

**Flow:**
1. User authenticates via Cognito
2. JWT contains `custom:tenant_id` claim
3. Backend extracts tenant_id from JWT in auth middleware
4. tenant_id is injected into request context
5. All database queries MUST filter by tenant_id

### 8.2 Middleware Enforcement

```typescript
// Tenant context middleware (already shown in Auth Module)
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user; // From JWT auth guard

    if (user && user.tenantId) {
      (req as any).tenantId = user.tenantId;
    } else {
      throw new ForbiddenException('No tenant context');
    }

    next();
  }
}
```

### 8.3 Repository Pattern with Tenant Filtering

**Base Repository:**
```typescript
// base.repository.ts
export abstract class TenantAwareRepository<T> {
  constructor(protected db: DatabaseService) {}

  protected ensureTenantFilter(where: any, tenantId: string): any {
    if (!tenantId) {
      throw new Error('tenant_id is required');
    }

    return {
      ...where,
      tenant_id: tenantId
    };
  }

  async findMany(tenantId: string, where: any = {}): Promise<T[]> {
    return (this.db[this.tableName] as any).findMany({
      where: this.ensureTenantFilter(where, tenantId)
    });
  }

  async findOne(id: string, tenantId: string): Promise<T | null> {
    return (this.db[this.tableName] as any).findFirst({
      where: this.ensureTenantFilter({ id }, tenantId)
    });
  }

  async create(tenantId: string, data: any): Promise<T> {
    return (this.db[this.tableName] as any).create({
      data: {
        ...data,
        tenant_id: tenantId
      }
    });
  }

  abstract get tableName(): string;
}
```

### 8.4 Testing Multi-Tenancy

**Unit Test:**
```typescript
describe('Simulation Repository - Multi-Tenancy', () => {
  it('should only return simulations for specified tenant', async () => {
    const tenantA = 'tenant-a-uuid';
    const tenantB = 'tenant-b-uuid';

    // Create simulations for both tenants
    await simulationRepo.create(tenantA, { /* data */ });
    await simulationRepo.create(tenantB, { /* data */ });

    // Query as tenant A
    const tenantASimulations = await simulationRepo.findMany(tenantA);
    expect(tenantASimulations).toHaveLength(1);
    expect(tenantASimulations[0].tenant_id).toBe(tenantA);

    // Query as tenant B
    const tenantBSimulations = await simulationRepo.findMany(tenantB);
    expect(tenantBSimulations).toHaveLength(1);
    expect(tenantBSimulations[0].tenant_id).toBe(tenantB);
  });

  it('should throw error when trying to access another tenant data', async () => {
    const tenantA = 'tenant-a-uuid';
    const tenantB = 'tenant-b-uuid';

    const simulation = await simulationRepo.create(tenantA, { /* data */ });

    // Try to access tenant A's simulation as tenant B
    const result = await simulationRepo.findOne(simulation.id, tenantB);
    expect(result).toBeNull();
  });
});
```

---

## 9. Authentication Integration

### 9.1 Cognito Auth Service (External)

**Assumptions:**
- External Auth Service is already implemented (separate repo)
- Uses AWS Cognito User Pools
- Provides OIDC endpoints
- Issues JWT tokens with custom claims

**Custom Claims in JWT:**
```json
{
  "sub": "cognito-user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "custom:tenant_id": "tenant-uuid",
  "custom:roles": "learner,trainer",
  "cognito:groups": ["learners"],
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX",
  "iat": 1703000000,
  "exp": 1703003600
}
```

### 9.2 Backend JWT Validation

**Validation Strategy:**
1. Extract JWT from Authorization header
2. Fetch JWKS from Cognito
3. Verify JWT signature using JWKS
4. Validate expiration, issuer, audience
5. Extract user claims

**Implementation (already shown in Auth Module):**
```typescript
// Use passport-jwt with Cognito JWKS
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        const jwks = await fetchCognitoJwks(configService.get('COGNITO_JWKS_URL'));
        const key = getSigningKey(jwks, rawJwtToken);
        done(null, key);
      },
      algorithms: ['RS256']
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      tenantId: payload['custom:tenant_id'],
      roles: payload['custom:roles']?.split(',') || []
    };
  }
}
```

### 9.3 Frontend Token Management

**Token Storage:**
- access_token: localStorage (or httpOnly cookie for better security)
- id_token: localStorage
- refresh_token: httpOnly cookie (managed by backend)

**Token Refresh:**
```typescript
// Token refresh logic
async function refreshAccessToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include' // Send refresh token cookie
  });

  if (response.ok) {
    const { access_token, id_token } = await response.json();
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('id_token', id_token);
    return access_token;
  } else {
    // Refresh failed, redirect to login
    window.location.href = '/auth/login';
  }
}
```

### 9.4 Local Development Mock

**For local testing without Cognito:**

```typescript
// scripts/generate-jwt.ts
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Generate RSA key pair (run once)
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

fs.writeFileSync('.dev/private_key.pem', privateKey);
fs.writeFileSync('.dev/public_key.pem', publicKey);

// Generate mock JWT
const payload = {
  sub: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  'custom:tenant_id': '00000000-0000-0000-0000-000000000001',
  'custom:roles': 'learner',
  iss: 'http://localhost:3001',
  aud: 'simulator-app',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000)
};

const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
console.log('Mock JWT:', token);
```

**Use in development:**
```bash
# Generate token
npm run generate:jwt

# Copy token and use in API requests
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/v1/simulations/industries
```

---

## 10. Module Specifications

### 10.1 Module Summary

| Module | Responsibilities | Key Dependencies |
|--------|------------------|------------------|
| **Auth** | JWT validation, tenant context | passport-jwt, jwks-rsa |
| **Simulator** | Session management, objectives | Persona module, DB |
| **Persona** | AI responses, RAG, profiles | Azure OpenAI, Cognitive Search |
| **Analytics** | Events, metrics, reports | DB, Event Bus |
| **LMS** | LTI 1.3, grade sync | ltijs library |
| **Notification** | Email, in-app notifications | SendGrid or Azure Email |

### 10.2 Inter-Module Communication

**Synchronous (Direct):**
- Simulator → Persona (generate profile, AI response)
- Simulator → Analytics (get user stats)

**Asynchronous (Event Bus):**
- Simulator publishes `simulation.completed` → Analytics subscribes
- Simulator publishes `simulation.completed` → Notification subscribes (send email)
- Simulator publishes `simulation.completed` → LMS subscribes (grade sync)

**Event Bus (In-Memory for V1):**
```typescript
// Example event flow
await eventBus.publish('simulation.completed', {
  simulationId: 'sim-123',
  userId: 'user-456',
  tenantId: 'tenant-789',
  score: 85
});

// Analytics module auto-logs this event
// Notification module sends completion email
// LMS module syncs grade to LMS
```

---

## 11. Local Development Setup

### 11.1 Prerequisites

- Node.js 20+
- PostgreSQL 16
- Redis (optional for V1, but recommended)
- Azure OpenAI API key (or mock for local dev)

### 11.2 Setup Steps

```bash
# 1. Clone repository
git clone <repo-url>
cd simulator-platform

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Configure .env
# Edit .env with your local database URL, etc.
DATABASE_URL="postgresql://user:password@localhost:5432/simulator_dev"
REDIS_URL="redis://localhost:6379"
AZURE_OPENAI_API_KEY="your-key-here"  # Or leave blank for mock
COGNITO_JWKS_URL="http://localhost:3001/mock-jwks"  # Mock for local dev

# 5. Setup database
npm run db:migrate  # Run Prisma migrations
npm run db:seed     # Seed with test data

# 6. Generate mock JWT (for local dev)
npm run generate:jwt

# 7. Start development servers
npm run dev  # Starts both frontend and backend

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```

### 11.3 Database Seeding

```typescript
// scripts/seed-database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Create test tenants
  const tenantA = await prisma.tenantConfig.create({
    data: {
      tenant_id: '00000000-0000-0000-0000-000000000001',
      key: 'name',
      value: { name: 'Tenant A - Test Corp' }
    }
  });

  // Create test user
  const user = await prisma.user.create({
    data: {
      tenant_id: '00000000-0000-0000-0000-000000000001',
      cognito_sub: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'learner'
    }
  });

  // Create industries
  const insurance = await prisma.industry.create({
    data: {
      code: 'insurance',
      name: 'Insurance',
      description: 'Life, health, property & casualty insurance',
      active: true
    }
  });

  // Create competencies
  await prisma.competency.createMany({
    data: [
      { code: 'communication', name: 'Communication', category: 'soft_skills' },
      { code: 'needs_assessment', name: 'Needs Assessment', category: 'technical' },
      { code: 'product_knowledge', name: 'Product Knowledge', category: 'technical' }
    ]
  });

  // Create personality components
  await prisma.personalityArchetype.createMany({
    data: [
      {
        code: 'analyst',
        name: 'The Analyst',
        traits: { openness: 7, conscientiousness: 9, extraversion: 4 },
        behaviors: { detail_oriented: true, asks_many_questions: true }
      },
      {
        code: 'helper',
        name: 'The Helper',
        traits: { openness: 6, agreeableness: 9, extraversion: 7 },
        behaviors: { friendly: true, cooperative: true }
      }
    ]
  });

  console.log('Database seeded successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 11.4 Mock Azure Services (Optional)

For local development without Azure dependencies:

```typescript
// Mock Azure OpenAI
class MockAzureOpenAI {
  async chat(params: any) {
    return {
      content: "This is a mock AI response for local development.",
      function_call: null
    };
  }

  async embeddings(params: any) {
    return {
      data: [{ embedding: new Array(1536).fill(0.1) }]
    };
  }
}

// Use in development
const openAIClient = process.env.NODE_ENV === 'development' && !process.env.AZURE_OPENAI_API_KEY
  ? new MockAzureOpenAI()
  : new AzureOpenAIClient();
```

---

## 12. Testing Strategy

### 12.1 Testing Pyramid

```
        /\
       /  \
      /E2E \         10% - Playwright (critical user flows)
     /------\
    /        \
   /Integration\    30% - Integration tests (API, DB)
  /------------\
 /              \
/   Unit Tests   \  60% - Unit tests (services, utils)
/________________\
```

### 12.2 Unit Tests

**Example: Simulation Service Test**
```typescript
// simulation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SimulationService } from './simulation.service';
import { SimulationRepository } from './simulation.repository';
import { PersonaService } from '../persona/persona.service';

describe('SimulationService', () => {
  let service: SimulationService;
  let repository: jest.Mocked<SimulationRepository>;
  let personaService: jest.Mocked<PersonaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        {
          provide: SimulationRepository,
          useValue: {
            create: jest.fn(),
            findByIdAndTenant: jest.fn()
          }
        },
        {
          provide: PersonaService,
          useValue: {
            generateClientProfile: jest.fn(),
            generateResponse: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<SimulationService>(SimulationService);
    repository = module.get(SimulationRepository);
    personaService = module.get(PersonaService);
  });

  describe('createSimulation', () => {
    it('should create a simulation with generated profile', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const dto = {
        industry: 'insurance',
        difficulty: 'beginner',
        focusAreas: ['life_insurance']
      };

      const mockProfile = { /* mock profile */ };
      personaService.generateClientProfile.mockResolvedValue(mockProfile);

      const mockSimulation = {
        id: 'sim-789',
        user_id: userId,
        tenant_id: tenantId,
        client_profile: mockProfile,
        ...dto
      };
      repository.create.mockResolvedValue(mockSimulation);

      const result = await service.createSimulation(userId, tenantId, dto);

      expect(personaService.generateClientProfile).toHaveBeenCalledWith({
        industry: dto.industry,
        difficulty: dto.difficulty,
        focusAreas: dto.focusAreas,
        tenantId
      });
      expect(repository.create).toHaveBeenCalled();
      expect(result.id).toBe('sim-789');
    });
  });
});
```

### 12.3 Integration Tests

**Example: API Integration Test**
```typescript
// simulation.controller.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Simulation API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Generate test JWT
    authToken = generateTestJWT({
      userId: 'test-user',
      tenantId: 'test-tenant',
      roles: ['learner']
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/simulations', () => {
    it('should create a new simulation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/simulations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          industry: 'insurance',
          difficulty: 'beginner',
          focusAreas: ['life_insurance']
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.industry).toBe('insurance');
      expect(response.body.tenant_id).toBe('test-tenant');
    });

    it('should reject request without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/simulations')
        .send({})
        .expect(401);
    });

    it('should enforce tenant isolation', async () => {
      // Create simulation as tenant A
      const tenantAToken = generateTestJWT({ tenantId: 'tenant-a' });
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/simulations')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({ /* data */ })
        .expect(201);

      const simulationId = createResponse.body.id;

      // Try to access as tenant B
      const tenantBToken = generateTestJWT({ tenantId: 'tenant-b' });
      await request(app.getHttpServer())
        .get(`/api/v1/simulations/${simulationId}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(404); // Not found (due to tenant filtering)
    });
  });
});
```

### 12.4 E2E Tests

**Example: Playwright E2E Test**
```typescript
// e2e/simulation-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete simulation flow', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:3000/auth/login');
  // Mock auth or use test credentials
  await mockCognitoAuth(page);

  // 2. Navigate to simulation selection
  await page.goto('http://localhost:3000/simulation/select');
  await expect(page.locator('h1')).toContainText('Select Industry');

  // 3. Select industry and difficulty
  await page.click('text=Insurance');
  await page.click('text=Beginner');
  await page.click('button:has-text("Continue")');

  // 4. Start simulation
  await page.click('button:has-text("Start Simulation")');
  await expect(page.locator('.chat-panel')).toBeVisible();

  // 5. Send a message
  await page.fill('textarea[name="message"]', 'Hello, I need help with life insurance.');
  await page.click('button:has-text("Send")');

  // 6. Wait for AI response
  await expect(page.locator('.ai-message').last()).toBeVisible({ timeout: 10000 });

  // 7. End simulation
  await page.click('button:has-text("End Simulation")');
  await page.click('button:has-text("Confirm")');

  // 8. Check review page
  await expect(page.locator('h1')).toContainText('Performance Review');
  await expect(page.locator('.overall-score')).toBeVisible();
});
```

---

## 13. Migration from MVP

### 13.1 Migration Strategy

**Approach: Incremental Refactoring**

1. **Phase 1: Setup Monorepo** (Week 1)
   - Create monorepo structure
   - Move existing frontend to `apps/frontend`
   - Extract shared types to `packages/types`

2. **Phase 2: Extract Backend** (Week 2-3)
   - Create `apps/backend` with NestJS
   - Extract API routes from Next.js to NestJS controllers
   - Move database queries to repositories
   - Keep both systems running in parallel

3. **Phase 3: Add Multi-Tenancy** (Week 3-4)
   - Add tenant_id columns to all tables
   - Implement tenant context middleware
   - Update all queries to filter by tenant_id
   - Migrate test data with tenant assignments

4. **Phase 4: Integrate External Auth** (Week 4-5)
   - Implement JWT validation for Cognito
   - Update frontend auth flow
   - Remove old session-based auth
   - Test with Cognito integration

5. **Phase 5: Modularize Backend** (Week 5-6)
   - Refactor into modules (Simulator, Persona, Analytics, etc.)
   - Extract business logic from controllers to services
   - Add event bus for inter-module communication

6. **Phase 6: Testing & Optimization** (Week 6-7)
   - Write integration tests
   - Performance optimization
   - Documentation
   - Deploy to staging

### 13.2 Database Migration

**Migration Script:**
```sql
-- Add tenant_id to existing tables
ALTER TABLE simulations ADD COLUMN tenant_id UUID;
ALTER TABLE performance_reviews ADD COLUMN tenant_id UUID;
ALTER TABLE engagement_events ADD COLUMN tenant_id UUID;

-- Migrate existing data to default tenant
UPDATE simulations SET tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE performance_reviews SET tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE engagement_events SET tenant_id = '00000000-0000-0000-0000-000000000001';

-- Make tenant_id NOT NULL after migration
ALTER TABLE simulations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE performance_reviews ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE engagement_events ALTER COLUMN tenant_id SET NOT NULL;

-- Add indexes
CREATE INDEX idx_simulations_tenant ON simulations(tenant_id);
CREATE INDEX idx_performance_reviews_tenant ON performance_reviews(tenant_id);
CREATE INDEX idx_engagement_events_tenant ON engagement_events(tenant_id);

-- Migrate users table
ALTER TABLE users ADD COLUMN cognito_sub TEXT;
ALTER TABLE users DROP COLUMN password; -- Remove plain text passwords!
UPDATE users SET cognito_sub = email; -- Temporary mapping
ALTER TABLE users ALTER COLUMN cognito_sub SET NOT NULL;
CREATE UNIQUE INDEX idx_users_cognito_sub ON users(cognito_sub);
```

### 13.3 Code Migration Checklist

- [ ] Create monorepo structure
- [ ] Extract shared types
- [ ] Setup backend NestJS project
- [ ] Migrate API routes to NestJS controllers
- [ ] Add tenant_id to all database tables
- [ ] Implement tenant context middleware
- [ ] Update all database queries with tenant filtering
- [ ] Replace session auth with JWT auth
- [ ] Integrate with Cognito
- [ ] Refactor into modules
- [ ] Add event bus
- [ ] Write tests
- [ ] Update documentation
- [ ] Deploy to staging

---

## 14. Deployment Strategy

### 14.1 V1 Deployment Options

**Option 1: Azure App Service (Simplest)**
- Deploy frontend and backend as separate App Services
- Use Azure Database for PostgreSQL
- Use Azure Cache for Redis
- Pros: Managed, auto-scaling, easy to set up
- Cons: Less control, potentially higher cost

**Option 2: Azure Container Instances**
- Docker containers for frontend and backend
- More control than App Service
- Still managed, but cheaper

**Option 3: Azure Kubernetes Service (Future-proof)**
- Full K8s deployment (as in full design)
- Most complex, but best for scaling
- Recommended for V2

**Recommended for V1: Option 1 (Azure App Service)**

### 14.2 Deployment Architecture (App Service)

```
Azure Front Door
  ↓
  ├─> Frontend App Service (Next.js)
  └─> Backend App Service (NestJS)
         ↓
         ├─> Azure Database for PostgreSQL
         ├─> Azure Cache for Redis
         ├─> Azure OpenAI
         └─> Azure Cognitive Search
```

### 14.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'apps/backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd apps/backend
          npm ci

      - name: Run tests
        run: |
          cd apps/backend
          npm test

      - name: Build
        run: |
          cd apps/backend
          npm run build

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'simulator-backend-prod'
          publish-profile: ${{ secrets.AZURE_BACKEND_PUBLISH_PROFILE }}
          package: apps/backend/dist
```

### 14.4 Environment Variables

**Backend (.env.production):**
```bash
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@simulator-prod.postgres.database.azure.com:5432/simulator

# Redis
REDIS_URL=redis://simulator-cache.redis.cache.windows.net:6380?password=xxx

# Azure OpenAI
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://simulator-openai.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_GPT=gpt-4o
AZURE_OPENAI_DEPLOYMENT_EMBEDDING=text-embedding-ada-002

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://simulator-search.search.windows.net
AZURE_SEARCH_API_KEY=xxx
AZURE_SEARCH_INDEX_NAME=kaplan-content-index

# Cognito (external auth service)
COGNITO_JWKS_URL=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX/.well-known/jwks.json
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX

# Logging
LOG_LEVEL=info
```

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_API_URL=https://api.simulator.com
NEXT_PUBLIC_COGNITO_AUTH_URL=https://auth.simulator.com/oauth2/authorize
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxx
```

---

## 15. Technology Stack

### 15.1 Backend Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime |
| **Framework** | NestJS | 10.x | Backend framework |
| **Language** | TypeScript | 5.x | Type safety |
| **Database** | PostgreSQL | 16 | Primary database |
| **ORM** | Prisma | 5.x | Database ORM |
| **Cache** | Redis | 7.x | Caching layer |
| **Validation** | class-validator + Zod | Latest | DTO validation |
| **Auth** | passport-jwt | 4.x | JWT authentication |
| **Testing** | Jest | 29.x | Unit & integration tests |
| **API Docs** | Swagger (NestJS) | Latest | OpenAPI documentation |
| **Logging** | Winston | 3.x | Structured logging |
| **Events** | EventEmitter2 | Latest | In-memory event bus |

### 15.2 Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Framework** | Next.js | 15.x | React framework |
| **Language** | TypeScript | 5.x | Type safety |
| **UI Library** | React | 19.x | UI rendering |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Components** | shadcn/ui | Latest | UI component library |
| **State** | Zustand | 4.x | State management |
| **Forms** | React Hook Form + Zod | Latest | Form handling |
| **API Client** | TanStack Query | 5.x | Data fetching |
| **Testing** | Vitest + Testing Library | Latest | Unit tests |
| **E2E** | Playwright | 1.x | E2E tests |

### 15.3 Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Hosting** | Azure App Service | Application hosting |
| **Database** | Azure Database for PostgreSQL | Managed PostgreSQL |
| **Cache** | Azure Cache for Redis | Managed Redis |
| **CDN** | Azure Front Door | CDN + WAF |
| **AI** | Azure OpenAI | GPT-4o + embeddings |
| **Search** | Azure Cognitive Search | Vector search for RAG |
| **Storage** | Azure Blob Storage | File storage |
| **Secrets** | Azure Key Vault | Secret management |
| **Monitoring** | Azure Monitor | Logging + metrics |
| **CI/CD** | GitHub Actions | Build + deploy pipelines |

---

## 16. Phase 2 Evolution Path

### 16.1 When to Evolve to Microservices

**Indicators:**
- Backend monolith becomes too large (>100k LOC)
- Different modules need different scaling profiles
- Team grows beyond 10 engineers
- Need for polyglot services (e.g., Python for ML)

### 16.2 Microservice Extraction Strategy

**Step 1: Identify Bounded Contexts**
- Simulator module → Simulator Service
- Persona module → AI/RAG Service
- Analytics module → Analytics Service
- LMS module → LMS Integration Service

**Step 2: Extract Incrementally**
1. Start with least coupled module (e.g., Notification)
2. Create separate service
3. Migrate database tables
4. Update API calls to use HTTP instead of direct function calls
5. Deploy separately
6. Monitor and validate
7. Repeat for next module

**Step 3: Add Service Mesh**
- Implement Kubernetes
- Add Linkerd or Istio for service-to-service communication
- Distributed tracing with OpenTelemetry

### 16.3 Database Evolution

**Current V1: Single Database**
```
PostgreSQL (all tables with tenant_id)
```

**Future V2: Database per Service**
```
simulator-db (simulations, reviews)
persona-db (profiles, archetypes, content_chunks)
analytics-db (events, metrics)
lms-db (platforms, resource_links)
```

**Migration Strategy:**
- Use database views initially to share data
- Gradually introduce event-driven data sync
- Eventually separate databases completely

### 16.4 Advanced Features (Phase 2+)

- **Voice simulation**: Azure Speech Services
- **Advanced analytics**: ML-based performance predictions
- **Mobile app**: React Native
- **Offline mode**: PWA with local storage sync
- **Advanced RAG**: Multi-modal RAG (text + images + videos)
- **Custom simulator builder**: Low-code platform for creating new simulators
- **White-label**: Full multi-tenant white-label solution

---

## Conclusion

This V1 design provides a **pragmatic, simplified architecture** that:

✅ **Separates frontend and backend** in a monorepo
✅ **Uses modular monolith** for easier development and testing
✅ **Implements simple multi-tenancy** with tenant_id columns
✅ **Integrates with external Cognito auth** service
✅ **Runs locally** with just PostgreSQL and minimal setup
✅ **Provides clear migration path** from existing MVP
✅ **Enables future evolution** to microservices when needed

**Next Steps:**
1. Review and approve design
2. Setup monorepo structure
3. Begin Phase 1 migration (setup + infrastructure)
4. Iterative development and testing
5. Deploy to staging
6. Production cutover

**Estimated Timeline:** 6-7 weeks for full V1 migration
**Team Size:** 4-6 engineers (2 frontend, 3 backend, 1 QA)

---

**Document Version:** 1.0
**Last Updated:** December 18, 2025
**Prepared by:** Principal Engineer
**Status:** Ready for Review
