# Financial Services Simulator - System Design Document

**Version:** 1.0
**Date:** December 18, 2025
**Author:** Principal Engineer
**Status:** Design Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Business Requirements](#3-business-requirements)
4. [Target Architecture Overview](#4-target-architecture-overview)
5. [Microservices Architecture](#5-microservices-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Multi-Tenancy Architecture](#7-multi-tenancy-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Database Architecture](#9-database-architecture)
10. [RAG Implementation](#10-rag-implementation)
11. [LMS Integration](#11-lms-integration)
12. [Infrastructure Architecture](#12-infrastructure-architecture)
13. [DevOps & CI/CD](#13-devops--cicd)
14. [Security Architecture](#14-security-architecture)
15. [Observability & Monitoring](#15-observability--monitoring)
16. [Migration Strategy](#16-migration-strategy)
17. [Technology Stack](#17-technology-stack)
18. [Appendices](#18-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document outlines the system design for transforming the current MVP financial services simulator into a production-ready, multi-tenant SaaS platform. The new architecture will support enterprise-scale deployment with proper security, scalability, and extensibility.

### 1.2 Key Objectives

- **Multi-Tenancy**: Support multiple organizations (tenants) with isolated data and configurable simulator access
- **Extensibility**: Enable dynamic addition of new simulators per tenant after onboarding
- **Security**: Implement OIDC/OAuth 2.0 authentication with Azure AD B2C
- **AI-Powered**: Integrate Azure OpenAI and RAG with Azure Cognitive Search for proprietary Kaplan content
- **LMS Integration**: Seamless integration with existing Learning Management Systems
- **Cloud-Native**: Deploy on Azure Kubernetes Service (AKS) with GitOps using ArgoCD
- **Scalability**: Support thousands of concurrent users with horizontal scaling

### 1.3 Architecture Principles

1. **Microservices-First**: Decompose monolith into domain-driven microservices
2. **API-First**: All services communicate via well-defined REST/gRPC APIs
3. **Event-Driven**: Asynchronous communication using Azure Service Bus for decoupling
4. **Database per Service**: Each microservice owns its data store
5. **Tenant Isolation**: Strong data isolation with row-level security and separate schemas
6. **Immutable Infrastructure**: GitOps-driven deployments with infrastructure as code
7. **Security by Design**: Zero-trust architecture with defense in depth
8. **Observability**: Comprehensive logging, metrics, and distributed tracing

---

## 2. Current State Analysis

### 2.1 MVP Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon Serverless) |
| AI Provider | OpenAI GPT-4o |
| UI Library | React 19 + Tailwind CSS + shadcn/ui |
| Authentication | Custom session-based (localStorage + DB) |
| Deployment | Vercel (assumed) |

### 2.2 Current Features

**Simulators:**
- Insurance (Life & Health, Property & Casualty)
- Wealth Management
- Securities

**Difficulty Levels:**
- Beginner, Intermediate, Advanced (with progressive information hiding)

**Core Capabilities:**
- AI-powered client conversations using "Fusion Model" personality system
- Real-time objective tracking (rapport, needs assessment, objections, recommendations)
- Performance review with competency scoring
- Admin dashboard for user/company management
- Engagement analytics and NPS feedback

### 2.3 Critical Gaps for Production

| Category | Current State | Production Requirement |
|----------|---------------|------------------------|
| **Security** | Plain text passwords, no CSRF protection | OIDC/OAuth, encrypted secrets, CSRF tokens |
| **Multi-Tenancy** | Basic company_id field, no isolation | Row-level security, tenant context enforcement |
| **Authentication** | Custom session auth | Azure AD B2C with OIDC/OAuth 2.0 |
| **Scalability** | In-memory caching, single instance | Distributed cache (Redis), horizontal scaling |
| **Data Management** | No migrations, manual schema updates | Automated migrations, version control |
| **Observability** | Console.log statements | Structured logging, APM, distributed tracing |
| **API Design** | Internal Next.js API routes | RESTful APIs with versioning, rate limiting |
| **Deployment** | Serverless platform | Kubernetes with GitOps |
| **LMS Integration** | None | SSO, grade sync, LTI integration |
| **RAG** | None | Azure Cognitive Search with vector embeddings |

---

## 3. Business Requirements

### 3.1 Multi-Tenant Requirements

**Tenant Isolation:**
- Tenant A (Org A): Access to Insurance + Wealth Management simulators
- Tenant B (Org B): Access to Insurance simulator only
- Tenant-specific branding, configuration, and content

**Dynamic Simulator Assignment:**
- Post-onboarding ability to add new simulators to existing tenants
- Per-simulator licensing model
- Feature flags for simulator modules

**Tenant Management:**
- Self-service tenant onboarding portal
- Tenant admin role for user management within organization
- Usage analytics and billing per tenant

### 3.2 Functional Requirements

**Authentication:**
- OIDC/OAuth 2.0 authentication
- Azure AD B2C integration
- SSO with enterprise identity providers (SAML, OIDC)
- Multi-factor authentication (MFA)

**LMS Integration:**
- LTI 1.3 Advantage integration
- Grade passback to LMS
- Deep linking for simulator launch
- User provisioning via SCIM

**RAG Implementation:**
- Ingest Kaplan proprietary content (PDFs, documents)
- Vector embeddings using Azure OpenAI text-embedding-ada-002
- Semantic search via Azure Cognitive Search
- Context injection into AI conversations

**Simulator Extensibility:**
- Plugin architecture for new simulators
- Configurable competencies per simulator
- Industry-specific rubrics and parameters
- Versioned simulator modules

### 3.3 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Availability** | 99.9% uptime (8.76 hours downtime/year) |
| **Performance** | API response time < 200ms (p95), AI responses < 3s |
| **Scalability** | Support 10,000 concurrent users |
| **Data Residency** | Azure region compliance (e.g., US, EU) |
| **Disaster Recovery** | RPO < 1 hour, RTO < 4 hours |
| **Security** | SOC2 Type II compliance ready |
| **Accessibility** | WCAG 2.1 AA compliance |

---

## 4. Target Architecture Overview

### 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          End Users / LMS                            │
└────────────────┬───────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Azure Front Door (CDN + WAF)                   │
└────────────────┬───────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Azure Kubernetes Service (AKS)                   │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │                       Ingress Controller                      │   │
│ │                      (NGINX Ingress)                          │   │
│ └───────────┬──────────────────────────────────────────────────┘   │
│             │                                                        │
│ ┌───────────▼──────────────────────────────────────────────────┐   │
│ │                    API Gateway Service                       │   │
│ │            (Rate Limiting, Auth, Routing)                    │   │
│ └───┬────────────────────────────────────────────────┬────────┘   │
│     │                                                 │             │
│ ┌───▼──────────┐  ┌──────────────┐  ┌──────────────▼──────────┐   │
│ │  Frontend    │  │   Auth       │  │  Tenant Service         │   │
│ │  (React SPA) │  │   Service    │  │  (Multi-tenancy)        │   │
│ └──────────────┘  │  (OIDC/OAuth)│  └─────────────────────────┘   │
│                   └──────┬───────┘                                  │
│                          │                                          │
│ ┌────────────────────────┴────────────────────────────────────┐   │
│ │               Business Microservices Layer                  │   │
│ │                                                              │   │
│ │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│ │  │  Simulator   │  │   AI/RAG     │  │     LMS      │      │   │
│ │  │   Service    │  │   Service    │  │  Integration │      │   │
│ │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │   │
│ │         │                  │                  │              │   │
│ │  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐      │   │
│ │  │   Profile    │  │  Analytics   │  │ Notification │      │   │
│ │  │   Service    │  │   Service    │  │   Service    │      │   │
│ │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│ └──────────────────────────┬─────────────────────────────────┘   │
│                            │                                       │
│ ┌──────────────────────────▼─────────────────────────────────┐   │
│ │              Azure Service Bus (Event Bus)                 │   │
│ └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    ▼                        ▼                        ▼
┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Azure      │    │  Azure Cognitive │    │  Azure Database  │
│  OpenAI     │    │  Search (RAG)    │    │  for PostgreSQL  │
│  (GPT-4o)   │    │  + Blob Storage  │    │  (Flexible)      │
└─────────────┘    └──────────────────┘    └──────────────────┘
                                                     │
                   ┌─────────────────────────────────┤
                   │                                 │
         ┌─────────▼─────────┐           ┌──────────▼──────────┐
         │  Tenant A DB      │           │  Shared Services DB │
         │  (tenant_a schema)│           │  (tenants, auth)    │
         └───────────────────┘           └─────────────────────┘
         ┌───────────────────┐
         │  Tenant B DB      │
         │  (tenant_b schema)│
         └───────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    Supporting Infrastructure                        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Azure       │  │  Azure Key   │  │  Azure       │             │
│  │  Monitor     │  │  Vault       │  │  Container   │             │
│  │  (Logging)   │  │  (Secrets)   │  │  Registry    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Azure       │  │  ArgoCD      │  │  GitHub      │             │
│  │  Redis Cache │  │  (GitOps)    │  │  (Source)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Architecture Layers

**Presentation Layer:**
- React SPA with TypeScript
- Responsive design with Tailwind CSS
- Progressive Web App (PWA) capabilities

**API Gateway Layer:**
- Kong or Azure API Management
- Request routing, rate limiting, authentication
- API versioning and transformation

**Business Logic Layer:**
- Microservices for domain logic
- Event-driven communication
- Stateless services for horizontal scaling

**Data Layer:**
- PostgreSQL for transactional data
- Redis for caching and sessions
- Azure Blob Storage for files
- Azure Cognitive Search for vector search

**Integration Layer:**
- Azure Service Bus for async messaging
- REST APIs for synchronous communication
- Webhooks for external integrations

---

## 5. Microservices Architecture

### 5.1 Service Decomposition

#### 5.1.1 **API Gateway Service**

**Responsibilities:**
- Unified entry point for all client requests
- Request routing to appropriate microservices
- Rate limiting and throttling
- API key management
- Request/response transformation
- CORS handling

**Technology:** Kong Gateway or Azure API Management

**Endpoints:**
- `/api/v1/auth/*` → Auth Service
- `/api/v1/simulators/*` → Simulator Service
- `/api/v1/ai/*` → AI/RAG Service
- `/api/v1/lms/*` → LMS Integration Service
- `/api/v1/analytics/*` → Analytics Service

**Configuration:**
```yaml
rate_limiting:
  anonymous: 100 requests/minute
  authenticated: 1000 requests/minute

cors:
  allowed_origins: ["https://*.yourdomain.com"]
  allowed_methods: ["GET", "POST", "PUT", "DELETE"]

authentication:
  jwt_issuer: "https://yourtenant.b2clogin.com"
  jwt_audience: "your-api-client-id"
```

---

#### 5.1.2 **Auth Service**

**Responsibilities:**
- OIDC/OAuth 2.0 authentication
- Azure AD B2C integration
- JWT token generation and validation
- Session management with Redis
- User identity management
- Multi-factor authentication (MFA)
- Password reset and email verification

**Technology Stack:**
- Node.js + Express + TypeScript
- Passport.js with OIDC strategy
- Redis for session storage
- Azure AD B2C for identity provider

**Database Schema (auth_db):**
```sql
-- User identities (federated from Azure AD B2C)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azure_ad_oid TEXT UNIQUE NOT NULL, -- Azure AD Object ID
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  name TEXT NOT NULL,
  picture_url TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Sessions (stored in Redis with DB backup)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  refresh_token_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**API Endpoints:**
```typescript
POST   /api/v1/auth/login              // Initiate OIDC login
POST   /api/v1/auth/callback           // OIDC callback handler
POST   /api/v1/auth/logout             // Logout user
POST   /api/v1/auth/refresh            // Refresh access token
GET    /api/v1/auth/me                 // Get current user info
POST   /api/v1/auth/verify-email       // Verify email address
POST   /api/v1/auth/reset-password     // Request password reset
```

**OIDC Flow:**
```
User → Frontend → API Gateway → Auth Service
                                    ↓
                            Azure AD B2C
                                    ↓
                         (User authenticates)
                                    ↓
                            Auth Service
                                    ↓
                        (Generate JWT + Refresh Token)
                                    ↓
                              Redis Cache
                                    ↓
                            Return to Frontend
```

---

#### 5.1.3 **Tenant Service**

**Responsibilities:**
- Multi-tenant management
- Tenant onboarding and provisioning
- Tenant configuration and feature flags
- Simulator licensing per tenant
- Tenant-level user management (roles, permissions)
- Branding and customization
- Usage quotas and limits

**Technology Stack:**
- Node.js + NestJS + TypeScript
- PostgreSQL for tenant metadata
- Redis for tenant context caching

**Database Schema (tenant_db):**
```sql
-- Tenant/Organization table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  domain TEXT, -- Custom domain (e.g., acme.simulator.com)
  logo_url TEXT,
  primary_color TEXT DEFAULT '#230F6E',
  status TEXT CHECK (status IN ('active', 'suspended', 'trial')) DEFAULT 'trial',
  subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  max_users INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant-specific configuration
CREATE TABLE tenant_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

-- Simulator licensing (which simulators each tenant has access to)
CREATE TABLE tenant_simulator_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  simulator_code TEXT NOT NULL, -- 'insurance', 'wealth_management', 'securities'
  enabled BOOLEAN DEFAULT true,
  max_concurrent_sessions INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}', -- Simulator-specific features
  licensed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL for perpetual license
  UNIQUE(tenant_id, simulator_code)
);

-- User roles within tenant (RBAC)
CREATE TABLE tenant_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('learner', 'trainer', 'admin', 'owner')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_user_roles_tenant ON tenant_user_roles(tenant_id);
CREATE INDEX idx_tenant_user_roles_user ON tenant_user_roles(user_id);
```

**API Endpoints:**
```typescript
// Tenant Management
POST   /api/v1/tenants                     // Create new tenant
GET    /api/v1/tenants/:tenantId           // Get tenant details
PUT    /api/v1/tenants/:tenantId           // Update tenant
DELETE /api/v1/tenants/:tenantId           // Soft delete tenant

// Simulator Access
GET    /api/v1/tenants/:tenantId/simulators              // List enabled simulators
POST   /api/v1/tenants/:tenantId/simulators/:simulator   // Enable simulator
DELETE /api/v1/tenants/:tenantId/simulators/:simulator   // Disable simulator
PUT    /api/v1/tenants/:tenantId/simulators/:simulator   // Update simulator config

// User Management (within tenant)
GET    /api/v1/tenants/:tenantId/users                   // List tenant users
POST   /api/v1/tenants/:tenantId/users                   // Add user to tenant
PUT    /api/v1/tenants/:tenantId/users/:userId/role      // Update user role
DELETE /api/v1/tenants/:tenantId/users/:userId           // Remove user from tenant

// Configuration
GET    /api/v1/tenants/:tenantId/config                  // Get all configs
PUT    /api/v1/tenants/:tenantId/config/:key             // Update config value
```

**Tenant Context Middleware:**
```typescript
// Inject tenant context into all requests
export async function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user; // From JWT
  const tenantId = user.tenant_id;

  // Load tenant from cache or DB
  const tenant = await getTenantById(tenantId);

  if (!tenant || tenant.status !== 'active') {
    return res.status(403).json({ error: 'Tenant inactive' });
  }

  // Inject into request context
  req.tenantContext = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    features: tenant.features,
    simulators: await getTenantSimulators(tenant.id)
  };

  next();
}
```

---

#### 5.1.4 **Simulator Service**

**Responsibilities:**
- Core simulation orchestration
- Industry and difficulty configuration
- Competency and rubric management
- Client profile generation
- Simulation session lifecycle
- Objective tracking
- Performance review generation

**Technology Stack:**
- Node.js + NestJS + TypeScript
- PostgreSQL for simulation data
- Redis for session state caching
- Azure Service Bus for events

**Database Schema (simulator_db per tenant):**
```sql
-- Industries (extensible catalog)
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'insurance', 'wealth_management', 'securities'
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-categories within industries
CREATE TABLE industry_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID NOT NULL REFERENCES industries(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(industry_id, code)
);

-- Competencies (skills evaluated)
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'communication', 'product_knowledge', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry-competency mapping
CREATE TABLE industry_competencies (
  industry_id UUID NOT NULL REFERENCES industries(id),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  weight DECIMAL(3,2) DEFAULT 1.0, -- Importance weight
  PRIMARY KEY (industry_id, competency_id)
);

-- Rubrics for evaluation
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id UUID NOT NULL REFERENCES competencies(id),
  industry_id UUID REFERENCES industries(id), -- NULL for default
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  criteria JSONB NOT NULL, -- Scoring criteria for each score level
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulation sessions (tenant-isolated)
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL, -- FK to tenant service
  user_id UUID NOT NULL, -- FK to auth service
  industry_id UUID NOT NULL REFERENCES industries(id),
  subcategory_id UUID REFERENCES industry_subcategories(id),
  difficulty TEXT NOT NULL,
  focus_areas TEXT[],
  client_profile JSONB NOT NULL, -- Generated AI client persona
  conversation_history JSONB DEFAULT '[]',
  objectives_completed JSONB DEFAULT '{}',
  current_state TEXT DEFAULT 'in_progress', -- in_progress, completed, abandoned
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

CREATE INDEX idx_simulations_tenant ON simulations(tenant_id);
CREATE INDEX idx_simulations_user ON simulations(user_id);
CREATE INDEX idx_simulations_state ON simulations(current_state);

-- Performance reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  competency_scores JSONB NOT NULL, -- { competency_id: { score, feedback } }
  overall_score DECIMAL(4,2),
  strengths TEXT[],
  areas_for_improvement TEXT[],
  xp_earned INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoints:**
```typescript
// Industry & Configuration
GET    /api/v1/simulators/industries                         // List available industries
GET    /api/v1/simulators/industries/:industryId/competencies // Get competencies

// Simulation Lifecycle
POST   /api/v1/simulators/sessions                           // Create new simulation
GET    /api/v1/simulators/sessions/:sessionId                // Get session details
PUT    /api/v1/simulators/sessions/:sessionId/state          // Update session state
DELETE /api/v1/simulators/sessions/:sessionId                // Abandon session

// Conversation
POST   /api/v1/simulators/sessions/:sessionId/messages       // Send message to AI client
GET    /api/v1/simulators/sessions/:sessionId/history        // Get conversation history

// Review
POST   /api/v1/simulators/sessions/:sessionId/complete       // Complete & generate review
GET    /api/v1/simulators/sessions/:sessionId/review         // Get performance review
GET    /api/v1/simulators/history                            // Get user's simulation history
```

**Simulation Orchestration Flow:**
```typescript
// 1. Create Session
async createSimulation(userId: string, tenantId: string, params: SimulationParams) {
  // Generate client profile via AI/RAG Service
  const clientProfile = await aiRagService.generateClientProfile(params);

  // Create database record
  const simulation = await db.simulations.create({
    tenant_id: tenantId,
    user_id: userId,
    industry_id: params.industryId,
    difficulty: params.difficulty,
    client_profile: clientProfile,
    ...
  });

  // Publish event
  await eventBus.publish('simulation.created', {
    simulationId: simulation.id,
    userId,
    tenantId
  });

  return simulation;
}

// 2. Handle Message
async handleMessage(sessionId: string, userMessage: string) {
  // Get session from cache/DB
  const session = await getSession(sessionId);

  // Call AI/RAG service for response
  const aiResponse = await aiRagService.generateResponse({
    profile: session.client_profile,
    history: session.conversation_history,
    userMessage,
    objectives: session.objectives_completed
  });

  // Update conversation history
  await updateConversationHistory(sessionId, userMessage, aiResponse);

  // Update objectives if needed
  if (aiResponse.objectivesUpdate) {
    await updateObjectives(sessionId, aiResponse.objectivesUpdate);
  }

  return aiResponse;
}
```

---

#### 5.1.5 **AI/RAG Service**

**Responsibilities:**
- Azure OpenAI GPT-4o integration
- Client profile generation using Fusion Model
- Conversation AI with personality synthesis
- RAG (Retrieval-Augmented Generation) with Azure Cognitive Search
- Semantic search over Kaplan proprietary content
- Performance review generation
- Prompt engineering and template management

**Technology Stack:**
- Node.js + NestJS + TypeScript
- Azure OpenAI SDK
- Azure Cognitive Search SDK
- LangChain for RAG orchestration
- Redis for prompt caching

**Database Schema (ai_rag_db):**
```sql
-- Fusion Model personality components
CREATE TABLE personality_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'analyst', 'helper', 'creator'
  name TEXT NOT NULL,
  traits JSONB NOT NULL, -- Big Five personality traits
  behaviors JSONB NOT NULL, -- Conversational behaviors
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE communication_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'direct', 'diplomatic', 'analytical'
  characteristics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personality_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'optimistic', 'cautious', 'skeptical'
  intensity_range JSONB NOT NULL, -- { min: 0, max: 10 }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personality_quirks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'perfectionist', 'storyteller'
  description TEXT,
  impact JSONB, -- How it affects conversation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt templates
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  template TEXT NOT NULL, -- Jinja2 or Handlebars template
  variables JSONB NOT NULL, -- Required variables
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content chunks for RAG (metadata only, vectors in Azure Cognitive Search)
CREATE TABLE content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- NULL for shared Kaplan content
  document_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- { source, page, section, ... }
  embedding_id TEXT NOT NULL, -- Reference to Azure Cognitive Search document
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_content_chunks_tenant ON content_chunks(tenant_id);
CREATE INDEX idx_content_chunks_document ON content_chunks(document_id);
```

**Azure Cognitive Search Index Schema:**
```json
{
  "name": "kaplan-content-index",
  "fields": [
    { "name": "id", "type": "Edm.String", "key": true },
    { "name": "tenantId", "type": "Edm.String", "filterable": true },
    { "name": "content", "type": "Edm.String", "searchable": true },
    { "name": "contentVector", "type": "Collection(Edm.Single)",
      "dimensions": 1536, "vectorSearchConfiguration": "vectorConfig" },
    { "name": "documentId", "type": "Edm.String", "filterable": true },
    { "name": "chunkIndex", "type": "Edm.Int32" },
    { "name": "metadata", "type": "Edm.String" },
    { "name": "source", "type": "Edm.String", "filterable": true },
    { "name": "industry", "type": "Edm.String", "filterable": true }
  ],
  "vectorSearch": {
    "algorithms": [
      { "name": "hnsw", "kind": "hnsw", "hnswParameters": { "m": 4, "efConstruction": 400, "metric": "cosine" } }
    ],
    "profiles": [
      { "name": "vectorConfig", "algorithm": "hnsw" }
    ]
  }
}
```

**API Endpoints:**
```typescript
// Profile Generation
POST   /api/v1/ai/profiles/generate              // Generate client profile
POST   /api/v1/ai/profiles/regenerate            // Regenerate with adjustments

// Conversation
POST   /api/v1/ai/chat                           // Generate AI response
POST   /api/v1/ai/chat/stream                    // Stream AI response (SSE)

// RAG
POST   /api/v1/ai/rag/search                     // Semantic search content
POST   /api/v1/ai/rag/ingest                     // Ingest new content
GET    /api/v1/ai/rag/documents/:documentId      // Get document metadata

// Review Generation
POST   /api/v1/ai/reviews/generate               // Generate performance review

// Fusion Model Management
GET    /api/v1/ai/fusion/archetypes              // List personality archetypes
GET    /api/v1/ai/fusion/moods                   // List moods
```

**RAG Pipeline:**
```typescript
// Content Ingestion Pipeline
async ingestDocument(tenantId: string, document: File, metadata: DocumentMetadata) {
  // 1. Extract text from PDF/DOCX
  const text = await extractText(document);

  // 2. Chunk text (1000 tokens with 200 overlap)
  const chunks = chunkText(text, { size: 1000, overlap: 200 });

  // 3. Generate embeddings with Azure OpenAI
  const embeddings = await Promise.all(
    chunks.map(chunk =>
      azureOpenAI.embeddings.create({
        model: "text-embedding-ada-002",
        input: chunk
      })
    )
  );

  // 4. Index in Azure Cognitive Search
  const searchDocuments = chunks.map((chunk, i) => ({
    id: `${metadata.documentId}_${i}`,
    tenantId,
    content: chunk,
    contentVector: embeddings[i].data[0].embedding,
    documentId: metadata.documentId,
    chunkIndex: i,
    metadata: JSON.stringify(metadata),
    industry: metadata.industry
  }));

  await cognitiveSearchClient.uploadDocuments(searchDocuments);

  // 5. Store metadata in PostgreSQL
  await db.content_chunks.createMany(
    chunks.map((chunk, i) => ({
      tenant_id: tenantId,
      document_id: metadata.documentId,
      chunk_index: i,
      content: chunk,
      metadata,
      embedding_id: searchDocuments[i].id
    }))
  );
}

// Semantic Search with RAG
async searchContent(tenantId: string, query: string, industry: string) {
  // 1. Generate query embedding
  const queryEmbedding = await azureOpenAI.embeddings.create({
    model: "text-embedding-ada-002",
    input: query
  });

  // 2. Vector search with tenant + industry filtering
  const results = await cognitiveSearchClient.search(query, {
    vectorQueries: [{
      vector: queryEmbedding.data[0].embedding,
      kNearestNeighborsCount: 5,
      fields: ["contentVector"]
    }],
    filter: `tenantId eq '${tenantId}' or tenantId eq null and industry eq '${industry}'`,
    select: ["content", "metadata", "source"],
    top: 5
  });

  return results.results.map(r => ({
    content: r.document.content,
    metadata: JSON.parse(r.document.metadata),
    score: r.score
  }));
}

// AI Response with RAG Context
async generateResponse(params: ChatParams) {
  // 1. Retrieve relevant content
  const ragContext = await this.searchContent(
    params.tenantId,
    params.userMessage,
    params.industry
  );

  // 2. Build prompt with RAG context
  const systemPrompt = buildSystemPrompt({
    profile: params.clientProfile,
    ragContext: ragContext.map(c => c.content).join('\n\n'),
    objectives: params.objectives,
    difficulty: params.difficulty
  });

  // 3. Call Azure OpenAI
  const response = await azureOpenAI.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...params.conversationHistory,
      { role: "user", content: params.userMessage }
    ],
    temperature: 0.7,
    max_tokens: 500,
    functions: [objectiveTrackingFunction] // For structured objective updates
  });

  return {
    message: response.choices[0].message.content,
    objectivesUpdate: response.choices[0].message.function_call?.arguments,
    ragSources: ragContext.map(c => c.metadata.source)
  };
}
```

**Fusion Model Profile Generation:**
```typescript
async generateClientProfile(params: ProfileParams) {
  // 1. Select random archetype, mood, communication style, quirks
  const archetype = await getRandomArchetype();
  const mood = await getRandomMood();
  const commStyle = await getRandomCommunicationStyle();
  const quirks = await getRandomQuirks(2); // 1-2 quirks

  // 2. Generate demographic details with AI
  const demographicPrompt = `Generate realistic client demographics for a ${params.difficulty} level ${params.industry} simulation. Include: name, age, occupation, income, family situation, financial goals.`;

  const demographics = await azureOpenAI.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: demographicPrompt }],
    temperature: 0.9
  });

  // 3. Synthesize full profile
  const profile = {
    demographics: JSON.parse(demographics.choices[0].message.content),
    personality: {
      archetype: archetype.code,
      traits: archetype.traits,
      communicationStyle: commStyle.code,
      mood: { type: mood.code, intensity: randomInt(5, 8) },
      quirks: quirks.map(q => q.code)
    },
    financialSituation: generateFinancialSituation(params), // Based on industry
    visibilityLevel: getDifficultyVisibility(params.difficulty) // What learner sees
  };

  return profile;
}
```

---

#### 5.1.6 **LMS Integration Service**

**Responsibilities:**
- LTI 1.3 Advantage integration
- Deep linking for simulator launch from LMS
- Grade passback to LMS
- User provisioning via SCIM 2.0
- Assignment sync with LMS
- Rostering and enrollment management

**Technology Stack:**
- Node.js + NestJS + TypeScript
- LTI Advantage SDK
- PostgreSQL for LMS integration metadata

**Database Schema (lms_integration_db):**
```sql
-- LMS platforms configured per tenant
CREATE TABLE lms_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  platform_type TEXT CHECK (platform_type IN ('canvas', 'moodle', 'blackboard', 'brightspace', 'custom')),
  name TEXT NOT NULL,
  issuer_url TEXT NOT NULL, -- LTI issuer
  client_id TEXT NOT NULL, -- LTI client ID
  auth_endpoint TEXT NOT NULL,
  token_endpoint TEXT NOT NULL,
  jwks_endpoint TEXT NOT NULL,
  deployment_id TEXT,
  public_key TEXT, -- JWK public key for signature verification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, platform_type)
);

-- LTI resource links (deep links from LMS)
CREATE TABLE lti_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lms_platform_id UUID NOT NULL REFERENCES lms_platforms(id),
  resource_link_id TEXT NOT NULL, -- LTI resource link ID
  context_id TEXT NOT NULL, -- LTI context (course)
  simulator_id TEXT, -- Which simulator this links to
  assignment_id UUID, -- Internal assignment mapping
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lms_platform_id, resource_link_id)
);

-- Grade sync tracking
CREATE TABLE grade_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL,
  lms_platform_id UUID NOT NULL REFERENCES lms_platforms(id),
  resource_link_id TEXT NOT NULL,
  user_lti_id TEXT NOT NULL, -- LTI user ID
  score DECIMAL(5,2), -- 0-100
  status TEXT CHECK (status IN ('pending', 'synced', 'failed')),
  error_message TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grade_sync_status ON grade_sync_log(status);
```

**API Endpoints:**
```typescript
// LTI Endpoints (standard LTI 1.3 flow)
POST   /api/v1/lms/lti/login                    // OIDC login initiation
POST   /api/v1/lms/lti/launch                   // LTI launch (JWT validation)
POST   /api/v1/lms/lti/deep-link               // Deep linking request
POST   /api/v1/lms/lti/jwks                     // Public JWK set

// Grade Passback
POST   /api/v1/lms/grades/sync                  // Sync grade to LMS
GET    /api/v1/lms/grades/status/:simulationId  // Check sync status

// Platform Configuration (Tenant Admin)
POST   /api/v1/lms/platforms                    // Register LMS platform
GET    /api/v1/lms/platforms                    // List configured platforms
PUT    /api/v1/lms/platforms/:platformId        // Update platform config
DELETE /api/v1/lms/platforms/:platformId        // Remove platform
```

**LTI 1.3 Launch Flow:**
```typescript
// 1. OIDC Login Initiation (from LMS)
async handleLoginInitiation(req: Request) {
  const { iss, login_hint, target_link_uri } = req.body;

  // Find platform by issuer
  const platform = await db.lms_platforms.findOne({ issuer_url: iss });

  // Redirect to platform's auth endpoint with state
  const state = generateSecureState();
  const nonce = generateSecureNonce();

  await redis.set(`lti:state:${state}`, { nonce, platform_id: platform.id }, 'EX', 600);

  return redirect(platform.auth_endpoint, {
    response_type: 'id_token',
    scope: 'openid',
    client_id: platform.client_id,
    redirect_uri: `${process.env.BASE_URL}/api/v1/lms/lti/launch`,
    login_hint,
    state,
    nonce,
    prompt: 'none'
  });
}

// 2. LTI Launch (ID Token validation)
async handleLtiLaunch(req: Request) {
  const { id_token, state } = req.body;

  // Validate state
  const stateData = await redis.get(`lti:state:${state}`);
  if (!stateData) throw new Error('Invalid state');

  // Validate and decode JWT
  const platform = await db.lms_platforms.findById(stateData.platform_id);
  const jwks = await fetchJwks(platform.jwks_endpoint);
  const claims = await verifyJwt(id_token, jwks, { nonce: stateData.nonce });

  // Extract LTI claims
  const ltiClaims = {
    userId: claims.sub,
    userName: claims.name,
    userEmail: claims.email,
    contextId: claims['https://purl.imsglobal.org/spec/lti/claim/context'].id,
    resourceLinkId: claims['https://purl.imsglobal.org/spec/lti/claim/resource_link'].id,
    roles: claims['https://purl.imsglobal.org/spec/lti/claim/roles']
  };

  // Provision user if needed (link to internal user)
  const user = await provisionLtiUser(platform.tenant_id, ltiClaims);

  // Create session
  const sessionToken = await authService.createSession(user.id);

  // Check if resource link exists
  const resourceLink = await db.lti_resource_links.findOne({
    lms_platform_id: platform.id,
    resource_link_id: ltiClaims.resourceLinkId
  });

  // Redirect to simulator or deep link selection
  if (resourceLink?.simulator_id) {
    return redirect(`/simulation/setup?lti=true&simulator=${resourceLink.simulator_id}`, {
      set_cookie: `auth-token=${sessionToken}`
    });
  } else {
    return redirect('/simulation/industry-selection?lti=true');
  }
}

// 3. Grade Passback
async syncGradeToLms(simulationId: string) {
  const simulation = await db.simulations.findById(simulationId);
  const review = await db.performance_reviews.findOne({ simulation_id: simulationId });

  // Find LTI context
  const resourceLink = await db.lti_resource_links.findOne({
    assignment_id: simulation.assignment_id
  });

  if (!resourceLink) return; // Not an LTI launch

  const platform = await db.lms_platforms.findById(resourceLink.lms_platform_id);

  // Get access token for LTI AGS (Assignment and Grade Services)
  const accessToken = await getLtiAccessToken(platform);

  // Send score (0-100 scale)
  const score = (review.overall_score / 10) * 100; // Convert 0-10 to 0-100

  try {
    await axios.post(
      resourceLink.lineitem_url, // From LTI launch claims
      {
        userId: simulation.user_lti_id,
        scoreGiven: score,
        scoreMaximum: 100,
        activityProgress: 'Completed',
        gradingProgress: 'FullyGraded',
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.ims.lis.v2.score+json'
        }
      }
    );

    await db.grade_sync_log.create({
      simulation_id: simulationId,
      lms_platform_id: platform.id,
      resource_link_id: resourceLink.resource_link_id,
      user_lti_id: simulation.user_lti_id,
      score,
      status: 'synced',
      synced_at: new Date()
    });
  } catch (error) {
    await db.grade_sync_log.create({
      simulation_id: simulationId,
      status: 'failed',
      error_message: error.message
    });
  }
}
```

---

#### 5.1.7 **Analytics Service**

**Responsibilities:**
- User engagement tracking
- Simulation performance metrics
- Learning progression analytics
- Tenant usage analytics
- Dashboards and reporting
- Data export (CSV, PDF reports)

**Technology Stack:**
- Node.js + NestJS + TypeScript
- PostgreSQL for analytics data
- ClickHouse or TimescaleDB for time-series data (optional)
- Apache Superset or Metabase for dashboards

**Database Schema (analytics_db):**
```sql
-- Engagement events (time-series data)
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  session_id TEXT, -- Browser session
  simulation_id UUID,
  event_type TEXT NOT NULL, -- 'simulation_start', 'message_sent', 'objective_completed', etc.
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_engagement_tenant_time ON engagement_events(tenant_id, timestamp DESC);
CREATE INDEX idx_engagement_user_time ON engagement_events(user_id, timestamp DESC);
CREATE INDEX idx_engagement_type ON engagement_events(event_type);

-- Aggregated metrics (materialized views)
CREATE MATERIALIZED VIEW user_performance_summary AS
SELECT
  u.tenant_id,
  u.user_id,
  COUNT(DISTINCT s.id) as total_simulations,
  AVG(pr.overall_score) as avg_score,
  SUM(pr.xp_earned) as total_xp,
  SUM(s.duration_seconds) as total_time_seconds,
  MAX(s.completed_at) as last_simulation_date
FROM simulations s
JOIN performance_reviews pr ON pr.simulation_id = s.id
GROUP BY u.tenant_id, u.user_id;

-- Refresh policy
CREATE INDEX idx_user_perf_summary ON user_performance_summary(tenant_id, user_id);

-- Tenant usage metrics
CREATE TABLE tenant_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  active_users INTEGER DEFAULT 0,
  total_simulations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_ai_tokens INTEGER DEFAULT 0,
  avg_simulation_duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);

CREATE INDEX idx_tenant_usage_date ON tenant_usage_metrics(tenant_id, date DESC);
```

**API Endpoints:**
```typescript
// Event Tracking
POST   /api/v1/analytics/events                        // Track event
POST   /api/v1/analytics/events/bulk                   // Bulk event tracking

// User Analytics
GET    /api/v1/analytics/users/:userId/performance     // User performance stats
GET    /api/v1/analytics/users/:userId/progression     // Learning progression
GET    /api/v1/analytics/users/:userId/history         // Simulation history

// Tenant Analytics (Admin)
GET    /api/v1/analytics/tenants/:tenantId/overview    // Tenant dashboard metrics
GET    /api/v1/analytics/tenants/:tenantId/usage       // Usage metrics over time
GET    /api/v1/analytics/tenants/:tenantId/leaderboard // Top performers

// Reporting
GET    /api/v1/analytics/reports/user/:userId          // User report (PDF)
GET    /api/v1/analytics/reports/tenant/:tenantId      // Tenant report (CSV export)
```

---

#### 5.1.8 **Notification Service**

**Responsibilities:**
- Email notifications (transactional + marketing)
- In-app notifications
- Webhook delivery to external systems
- Notification templates
- Delivery tracking

**Technology Stack:**
- Node.js + NestJS + TypeScript
- Azure Communication Services (Email) or SendGrid
- PostgreSQL for notification logs
- Azure Service Bus for async delivery

**Database Schema (notification_db):**
```sql
-- Notification templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'simulation_completed', 'password_reset', etc.
  channel TEXT CHECK (channel IN ('email', 'in_app', 'webhook')),
  subject_template TEXT,
  body_template TEXT NOT NULL, -- HTML or text template
  variables JSONB NOT NULL, -- Required variables
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  template_code TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL, -- Email address or user ID
  subject TEXT,
  body TEXT,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

**API Endpoints:**
```typescript
POST   /api/v1/notifications/send              // Send notification
POST   /api/v1/notifications/send/bulk         // Bulk send
GET    /api/v1/notifications/:userId           // Get user notifications
PUT    /api/v1/notifications/:notificationId/read // Mark as read
```

---

### 5.2 Inter-Service Communication

**Synchronous (REST):**
- Auth Service validates tokens for all services
- Tenant Service provides tenant context
- Direct HTTP calls for request/response patterns

**Asynchronous (Azure Service Bus):**
- Event publishing for fire-and-forget operations
- Topics with subscriptions for fan-out patterns

**Events Published:**
```typescript
// User Events
- user.registered
- user.login
- user.logout

// Simulation Events
- simulation.created
- simulation.started
- simulation.message_sent
- simulation.completed
- simulation.abandoned

// Review Events
- review.generated
- review.viewed

// LMS Events
- lms.grade_synced
- lms.user_provisioned

// Tenant Events
- tenant.created
- tenant.simulator_enabled
- tenant.simulator_disabled
```

**Service Bus Topic Structure:**
```
Topic: user-events
  Subscription: analytics-service (tracks user activity)
  Subscription: notification-service (welcome emails)

Topic: simulation-events
  Subscription: analytics-service (engagement metrics)
  Subscription: lms-integration-service (grade sync)
  Subscription: notification-service (completion emails)
```

---

## 6. Frontend Architecture

### 6.1 Monorepo Structure (Turborepo or Nx)

```
/frontend
├── package.json (workspace root)
├── turbo.json (Turborepo config)
├── tsconfig.json (base TypeScript config)
├── .eslintrc.js (shared linting)
│
├── apps/
│   ├── learner-portal/          # Main learner-facing SPA
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router or React Router
│   │   │   ├── components/      # App-specific components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Utilities
│   │   │   └── styles/          # Global styles
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.js (or vite.config.ts)
│   │
│   ├── admin-portal/            # Admin/trainer dashboard
│   │   └── (similar structure)
│   │
│   └── tenant-portal/           # Tenant admin portal
│       └── (similar structure)
│
├── packages/
│   ├── ui/                      # Shared UI component library
│   │   ├── src/
│   │   │   ├── components/      # Button, Card, Input, etc.
│   │   │   ├── hooks/           # useToast, useDisclosure, etc.
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api-client/              # Generated API client (OpenAPI)
│   │   ├── src/
│   │   │   ├── clients/         # Service clients (AuthClient, SimulatorClient)
│   │   │   ├── types/           # Generated TypeScript types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── auth/                    # Authentication logic
│   │   ├── src/
│   │   │   ├── AuthProvider.tsx # React Context for auth
│   │   │   ├── useAuth.ts       # Auth hook
│   │   │   ├── oidc.ts          # OIDC client logic
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── config/                  # Shared configuration
│   │   ├── src/
│   │   │   ├── env.ts           # Environment variables
│   │   │   ├── constants.ts     # App constants
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                   # Shared utilities
│   │   ├── src/
│   │   │   ├── format.ts        # Date, currency formatting
│   │   │   ├── validation.ts    # Form validation helpers
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── types/                   # Shared TypeScript types
│       ├── src/
│       │   ├── simulation.ts    # Simulation types
│       │   ├── user.ts          # User types
│       │   └── index.ts
│       └── package.json
│
└── docs/                        # Shared documentation
    └── storybook/               # Component documentation
```

### 6.2 Learner Portal Module Breakdown

**App Structure (Next.js App Router):**
```
/apps/learner-portal/src/app
├── layout.tsx                      # Root layout with AuthProvider
├── page.tsx                        # Landing page
├── (auth)/                         # Auth group
│   ├── login/
│   ├── logout/
│   └── callback/                   # OIDC callback
├── dashboard/
│   └── page.tsx                    # User dashboard
├── simulation/
│   ├── attestation/
│   │   └── page.tsx                # Pre-simulation agreement
│   ├── select/
│   │   └── page.tsx                # Industry/difficulty selection
│   ├── setup/
│   │   └── page.tsx                # Simulation preview
│   ├── [sessionId]/
│   │   ├── page.tsx                # Main simulation session
│   │   └── review/
│   │       └── page.tsx            # Performance review
│   └── history/
│       └── page.tsx                # Past simulations
├── profile/
│   └── page.tsx                    # User profile settings
└── help/
    └── page.tsx                    # Help/support
```

**Key Components:**
```typescript
// Simulation Session Component
/apps/learner-portal/src/components/simulation/
├── SimulationSession/
│   ├── index.tsx                   # Main orchestrator
│   ├── ChatPanel.tsx               # Conversation interface
│   ├── ClientInfoPanel.tsx         # Client details sidebar
│   ├── ObjectiveTracker.tsx        # Progress tracking
│   ├── AssistantMode.tsx           # Help mode
│   └── SessionControls.tsx         # End session, pause, etc.

// Shared UI Components (from /packages/ui)
├── Button/
├── Card/
├── Input/
├── Select/
├── Dialog/
├── Toast/
└── ...
```

**State Management:**
```typescript
// Global state with Zustand or React Context

// Auth state (from @repo/auth package)
interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
}

// Simulation state
interface SimulationState {
  currentSession: SimulationSession | null;
  conversationHistory: Message[];
  objectives: Objective[];
  clientProfile: ClientProfile | null;
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  endSession: () => Promise<void>;
}
```

### 6.3 Admin Portal Module Breakdown

**App Structure:**
```
/apps/admin-portal/src/app
├── layout.tsx
├── page.tsx                        # Admin dashboard
├── users/
│   ├── page.tsx                    # User management
│   ├── [userId]/
│   │   ├── page.tsx                # User details
│   │   └── performance/
│   │       └── page.tsx            # User analytics
├── simulators/
│   ├── page.tsx                    # Simulator configuration
│   ├── industries/
│   │   └── page.tsx                # Manage industries
│   └── competencies/
│       └── page.tsx                # Manage competencies
├── fusion-model/
│   ├── archetypes/
│   ├── moods/
│   └── quirks/
├── analytics/
│   ├── engagement/
│   ├── performance/
│   └── reports/
└── settings/
    ├── lms/
    │   └── page.tsx                # LMS integration config
    ├── rag/
    │   └── page.tsx                # Content management
    └── branding/
        └── page.tsx                # Tenant branding
```

### 6.4 Technology Choices

| Category | Technology | Rationale |
|----------|------------|-----------|
| **Framework** | Next.js 15 (App Router) | SSR, API routes, file-based routing |
| **Language** | TypeScript | Type safety, better DX |
| **UI Library** | React 19 | Industry standard, large ecosystem |
| **Styling** | Tailwind CSS | Utility-first, rapid development |
| **Components** | shadcn/ui | Accessible, customizable, TypeScript |
| **State** | Zustand or React Context | Lightweight, performant |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **API Client** | React Query (TanStack Query) | Caching, optimistic updates |
| **Auth** | OIDC Client (oidc-client-ts) | Standard OIDC/OAuth implementation |
| **Monorepo** | Turborepo | Fast, incremental builds |
| **Testing** | Vitest + Testing Library | Fast, modern testing |
| **E2E Testing** | Playwright | Reliable, cross-browser |
| **Bundler** | Next.js (Turbopack) or Vite | Fast HMR |

### 6.5 API Integration Pattern

```typescript
// Generated API client from OpenAPI spec
import { SimulatorClient } from '@repo/api-client';
import { useQuery, useMutation } from '@tanstack/react-query';

// Custom hook for simulation session
export function useSimulationSession(sessionId: string) {
  const client = new SimulatorClient();

  // Fetch session data
  const { data: session, isLoading } = useQuery({
    queryKey: ['simulation', sessionId],
    queryFn: () => client.getSession(sessionId),
    refetchInterval: false // Don't auto-refresh
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      client.sendMessage(sessionId, { message }),
    onSuccess: (data) => {
      // Optimistically update conversation history
      queryClient.setQueryData(['simulation', sessionId], (old) => ({
        ...old,
        conversationHistory: [
          ...old.conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: data.response }
        ]
      }));
    }
  });

  return {
    session,
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isLoading
  };
}
```

---

## 7. Multi-Tenancy Architecture

### 7.1 Tenant Isolation Strategy

**Approach: Hybrid (Shared Database with Schema-per-Tenant + Shared Tables)**

**Rationale:**
- Cost-effective for moderate scale (hundreds of tenants)
- Strong data isolation via PostgreSQL schemas
- Shared infrastructure reduces overhead
- Easy to migrate high-value tenants to dedicated databases later

**Database Structure:**
```sql
-- Single PostgreSQL cluster with multiple databases

-- Database 1: Shared Services (auth, tenants)
CREATE DATABASE shared_services;

-- Database 2: Simulator Data (schema-per-tenant)
CREATE DATABASE simulator_data;
  -- Schema: tenant_a
  -- Schema: tenant_b
  -- Schema: shared (industries, competencies, rubrics)

-- Database 3: Analytics (time-series, can use ClickHouse instead)
CREATE DATABASE analytics;
```

**Schema Isolation in simulator_data:**
```sql
-- Shared schema for common data
CREATE SCHEMA shared;
SET search_path TO shared;

CREATE TABLE industries (...);
CREATE TABLE competencies (...);
CREATE TABLE rubrics (...);

-- Tenant-specific schema
CREATE SCHEMA tenant_a;
SET search_path TO tenant_a;

CREATE TABLE simulations (...); -- Tenant A's simulations
CREATE TABLE performance_reviews (...);
```

**Row-Level Security (RLS) as Additional Layer:**
```sql
-- Even within schema, enforce tenant_id filtering
ALTER TABLE tenant_a.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_a.simulations
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

**Application-Level Tenant Context:**
```typescript
// Middleware to set tenant context
export async function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = req.user; // From JWT
  const tenantId = user.tenant_id;

  // Set PostgreSQL session variable
  await db.query(`SET app.current_tenant_id = '${tenantId}'`);

  // Set schema search path
  const tenantSchema = `tenant_${tenantId.split('-')[0]}`; // Abbreviated
  await db.query(`SET search_path TO ${tenantSchema}, shared, public`);

  req.tenantContext = { tenantId, tenantSchema };
  next();
}
```

### 7.2 Tenant Onboarding Flow

```
1. Super Admin creates tenant via Admin Portal
   ↓
2. Tenant Service creates:
   - Tenant record in shared_services.tenants
   - Database schema tenant_<id>
   - Default configuration
   - Initial simulator licenses
   ↓
3. Provision tenant admin user
   - Create user in Azure AD B2C
   - Assign 'owner' role in tenant
   ↓
4. Tenant admin receives welcome email with:
   - Login credentials
   - Setup wizard link
   ↓
5. Tenant admin configures:
   - Branding (logo, colors)
   - LMS integration (optional)
   - Enable/disable simulators
   - Invite users (bulk CSV import or manual)
   ↓
6. Analytics Service creates:
   - Tenant usage metrics record
   - Initial dashboard
   ↓
7. Tenant is ACTIVE
```

### 7.3 Simulator Licensing Model

**License Types:**
- **Starter:** 1 simulator, 50 users, 500 simulations/month
- **Professional:** 3 simulators, 500 users, unlimited simulations
- **Enterprise:** All simulators + custom, unlimited users, dedicated support

**Dynamic Simulator Assignment:**
```typescript
// Tenant admin enables a new simulator
POST /api/v1/tenants/:tenantId/simulators
{
  "simulator_code": "wealth_management",
  "features": {
    "advanced_analytics": true,
    "custom_competencies": false
  },
  "max_concurrent_sessions": 200,
  "expires_at": null // Perpetual
}

// System automatically:
// 1. Adds record to tenant_simulator_access
// 2. Publishes event: tenant.simulator_enabled
// 3. Updates tenant feature flags in Redis cache
// 4. Notifies tenant admin
```

**Feature Flags (LaunchDarkly or custom):**
```typescript
// Check if tenant has access to simulator
export async function canAccessSimulator(tenantId: string, simulatorCode: string): Promise<boolean> {
  const access = await db.tenant_simulator_access.findOne({
    tenant_id: tenantId,
    simulator_code: simulatorCode,
    enabled: true
  });

  if (!access) return false;

  // Check expiration
  if (access.expires_at && new Date() > access.expires_at) {
    return false;
  }

  // Check concurrent sessions
  const activeSessions = await getActiveSessionCount(tenantId, simulatorCode);
  if (activeSessions >= access.max_concurrent_sessions) {
    throw new Error('Concurrent session limit reached');
  }

  return true;
}
```

### 7.4 Data Isolation Validation

**Automated Tests:**
```typescript
describe('Multi-Tenancy Isolation', () => {
  it('should not allow tenant A to access tenant B data', async () => {
    // Create simulation for tenant A
    const tenantASession = await createSimulation(tenantA.id, userA.id);

    // Attempt to access as tenant B user
    const response = await request(app)
      .get(`/api/v1/simulators/sessions/${tenantASession.id}`)
      .set('Authorization', `Bearer ${tenantBUserToken}`);

    expect(response.status).toBe(403);
  });

  it('should enforce schema isolation at database level', async () => {
    // Set tenant B context
    await db.query(`SET app.current_tenant_id = '${tenantB.id}'`);

    // Try to query tenant A schema
    const result = await db.query(`
      SELECT * FROM tenant_a.simulations
    `);

    expect(result.rows).toHaveLength(0); // RLS blocks access
  });
});
```

---

## 8. Authentication & Authorization

### 8.1 OIDC/OAuth 2.0 with Azure AD B2C

**Azure AD B2C Configuration:**

**Tenant:** `yoursimulator.b2clogin.com`

**User Flows:**
- Sign-up and sign-in (SUSI): `B2C_1_susi`
- Password reset: `B2C_1_password_reset`
- Profile editing: `B2C_1_profile_edit`

**App Registration:**
- **Name:** Financial Services Simulator - Learner Portal
- **Redirect URIs:**
  - `https://app.yourdomain.com/auth/callback`
  - `http://localhost:3000/auth/callback` (dev)
- **Token Configuration:**
  - Access Token: Include `tenant_id`, `roles` claims
  - ID Token: Include `email`, `name`, `oid`
  - Refresh Token: Enabled (30 days)

**Custom Claims (Token Enrichment):**
```json
{
  "oid": "azure-ad-user-object-id",
  "email": "user@example.com",
  "name": "John Doe",
  "tenant_id": "uuid-of-tenant",
  "roles": ["learner"],
  "tenant_slug": "acme-corp"
}
```

**Azure Function for Custom Claims:**
```javascript
// Azure Function triggered during token issuance
module.exports = async function (context, req) {
  const userId = req.body.userId; // Azure AD OID

  // Query your database for tenant_id and roles
  const user = await db.users.findOne({ azure_ad_oid: userId });

  if (!user) {
    context.res = {
      status: 404,
      body: { error: 'User not found' }
    };
    return;
  }

  const tenant = await db.tenants.findById(user.tenant_id);
  const roles = await db.tenant_user_roles.find({ user_id: user.id });

  context.res = {
    status: 200,
    body: {
      claims: {
        tenant_id: user.tenant_id,
        tenant_slug: tenant.slug,
        roles: roles.map(r => r.role)
      }
    }
  };
};
```

### 8.2 Authentication Flow

```
┌─────────────┐                                    ┌──────────────┐
│   Frontend  │                                    │ Azure AD B2C │
│   (React)   │                                    │              │
└──────┬──────┘                                    └──────┬───────┘
       │                                                  │
       │ 1. User clicks "Login"                          │
       ├─────────────────────────────────────────────────>
       │    GET /authorize?response_type=code&...        │
       │                                                  │
       │ 2. Redirect to B2C login page                   │
       <─────────────────────────────────────────────────┤
       │                                                  │
       │ 3. User enters credentials                      │
       ├─────────────────────────────────────────────────>
       │                                                  │
       │ 4. B2C validates + redirects with auth code     │
       <─────────────────────────────────────────────────┤
       │    /auth/callback?code=xxx&state=yyy            │
       │                                                  │
       │ 5. Exchange code for tokens                     │
       │                                                  │
       ▼                                                  │
┌─────────────────┐                                      │
│  Auth Service   │                                      │
│                 │ 6. POST /token (code)                │
│                 ├──────────────────────────────────────>
│                 │                                      │
│                 │ 7. Returns: access_token, id_token,  │
│                 │             refresh_token            │
│                 <──────────────────────────────────────┤
│                 │                                      │
│                 │ 8. Validate JWT signature            │
│                 │    (fetch JWKS from B2C)             │
│                 │                                      │
│                 │ 9. Enrich with custom claims         │
│                 │    (call Azure Function or DB query) │
│                 │                                      │
│                 │ 10. Create session in Redis          │
│                 │                                      │
│                 │ 11. Return session token to frontend │
└────────┬────────┘                                      │
         │                                                │
         ▼                                                │
┌─────────────┐                                          │
│   Frontend  │                                          │
│ (Stores JWT │                                          │
│  in memory, │                                          │
│  session in │                                          │
│  httpOnly   │                                          │
│  cookie)    │                                          │
└─────────────┘
```

### 8.3 Authorization (RBAC Model)

**Roles:**
- **learner**: Can take simulations, view own performance
- **trainer**: Can view learner performance within tenant, run reports
- **admin** (tenant): Can manage users, configure simulators, view all data within tenant
- **owner** (tenant): Admin + billing, LMS integration, tenant settings
- **super_admin**: Cross-tenant management, system configuration

**Permission Matrix:**
| Resource | Learner | Trainer | Admin | Owner | Super Admin |
|----------|---------|---------|-------|-------|-------------|
| Take simulation | ✓ | ✓ | ✓ | ✓ | ✓ |
| View own performance | ✓ | ✓ | ✓ | ✓ | ✓ |
| View learner performance | ✗ | ✓ | ✓ | ✓ | ✓ |
| Manage users (tenant) | ✗ | ✗ | ✓ | ✓ | ✓ |
| Configure simulators | ✗ | ✗ | ✓ | ✓ | ✓ |
| LMS integration | ✗ | ✗ | ✗ | ✓ | ✓ |
| Billing | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage tenants | ✗ | ✗ | ✗ | ✗ | ✓ |

**Middleware Enforcement:**
```typescript
// Decorator for role-based access control
export function RequireRole(roles: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0] as Request;
      const userRoles = req.user.roles;

      const hasPermission = roles.some(role => userRoles.includes(role));

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Usage
@Controller('tenants')
export class TenantsController {
  @Get(':tenantId/users')
  @RequireRole(['admin', 'owner', 'super_admin'])
  async getUsers(@Param('tenantId') tenantId: string) {
    // Only admins and above can access
  }
}
```

### 8.4 Session Management

**Session Storage: Redis**

**Session Structure:**
```json
{
  "session:uuid": {
    "user_id": "uuid",
    "tenant_id": "uuid",
    "roles": ["learner"],
    "email": "user@example.com",
    "name": "John Doe",
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_at": "2025-12-19T10:00:00Z",
    "created_at": "2025-12-18T10:00:00Z",
    "last_activity": "2025-12-18T12:30:00Z"
  }
}
```

**Session Lifecycle:**
- **TTL:** 8 hours (access token) with sliding expiration on activity
- **Refresh:** 30 days (refresh token) stored securely
- **Logout:** Delete from Redis + blacklist token

**Token Refresh:**
```typescript
export async function refreshAccessToken(refreshToken: string): Promise<Session> {
  // Validate refresh token with Azure AD B2C
  const response = await axios.post('https://yourtenant.b2clogin.com/token', {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.AZURE_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET
  });

  const { access_token, refresh_token: newRefreshToken } = response.data;

  // Update session in Redis
  const session = await redis.get(`session:${sessionId}`);
  session.access_token = access_token;
  session.refresh_token = newRefreshToken;
  session.expires_at = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

  await redis.set(`session:${sessionId}`, session, 'EX', 8 * 60 * 60);

  return session;
}
```

---

## 9. Database Architecture

### 9.1 Database Topology

**PostgreSQL Instances:**

**Option 1: Azure Database for PostgreSQL - Flexible Server (Recommended for start)**
- Single cluster with multiple databases
- Schema-per-tenant for data isolation
- Cost-effective, managed service
- Built-in backup, HA, scaling

**Option 2: Multi-Database (For larger scale)**
- Shared Services DB: Auth, tenants, LMS metadata
- Simulator DB per tenant (for high-value customers)
- Analytics DB: ClickHouse or TimescaleDB for time-series

**Current Recommendation: Option 1 (Flexible Server)**

**Databases:**
```
PostgreSQL Cluster: simulator-prod.postgres.database.azure.com

├── shared_services (authentication, tenant management)
│   ├── Schema: public
│   │   ├── users
│   │   ├── sessions
│   │   ├── tenants
│   │   ├── tenant_configs
│   │   ├── tenant_simulator_access
│   │   └── tenant_user_roles
│
├── simulator_data (multi-tenant simulation data)
│   ├── Schema: shared
│   │   ├── industries
│   │   ├── competencies
│   │   ├── rubrics
│   │   └── industry_competencies
│   ├── Schema: tenant_a
│   │   ├── simulations
│   │   └── performance_reviews
│   ├── Schema: tenant_b
│   │   ├── simulations
│   │   └── performance_reviews
│
├── ai_rag (AI and RAG data)
│   ├── Schema: public
│   │   ├── personality_archetypes
│   │   ├── personality_moods
│   │   ├── communication_styles
│   │   ├── personality_quirks
│   │   ├── prompt_templates
│   │   └── content_chunks
│
├── lms_integration (LMS integration metadata)
│   ├── Schema: public
│   │   ├── lms_platforms
│   │   ├── lti_resource_links
│   │   └── grade_sync_log
│
└── analytics (engagement and performance analytics)
    ├── Schema: public
    │   ├── engagement_events
    │   ├── tenant_usage_metrics
    │   └── user_performance_summary (materialized view)
```

### 9.2 Data Migration Strategy

**Tool: Flyway or Prisma Migrate**

**Migration Versioning:**
```
/backend/migrations/
├── V1__init_schema.sql
├── V2__add_tenant_simulator_access.sql
├── V3__add_fusion_model_tables.sql
├── V4__add_lms_integration.sql
└── R__refresh_user_performance_summary.sql (repeatable)
```

**Schema Per Tenant Creation:**
```sql
-- Template schema
CREATE SCHEMA tenant_template;

CREATE TABLE tenant_template.simulations (...);
CREATE TABLE tenant_template.performance_reviews (...);
-- ... all tenant-specific tables

-- Function to create new tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  schema_name TEXT := 'tenant_' || REPLACE(tenant_id::TEXT, '-', '_');
BEGIN
  -- Clone template schema
  EXECUTE format('CREATE SCHEMA %I', schema_name);

  -- Copy table structures (not data)
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'tenant_template'
  LOOP
    EXECUTE format('CREATE TABLE %I.%I (LIKE tenant_template.%I INCLUDING ALL)',
                   schema_name, r.tablename, r.tablename);
  END LOOP;

  -- Enable RLS on all tables
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = schema_name
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', schema_name, r.tablename);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I.%I USING (tenant_id = %L)',
                   schema_name, r.tablename, tenant_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 9.3 Backup and Disaster Recovery

**Backup Strategy:**
- **Automated Backups:** Azure PostgreSQL automatic backups (7-35 days retention)
- **Point-in-Time Restore:** Up to retention period
- **Geo-Redundant Backup:** For disaster recovery (Azure Backup Vault)
- **Logical Backups:** Weekly pg_dump for long-term archival

**Recovery Objectives:**
- **RPO (Recovery Point Objective):** < 1 hour (continuous WAL archiving)
- **RTO (Recovery Time Objective):** < 4 hours (PITR + schema restore)

**DR Procedure:**
```bash
# 1. Restore from Azure backup
az postgres flexible-server restore \
  --resource-group simulator-rg \
  --name simulator-prod \
  --source-server simulator-prod \
  --restore-point-in-time "2025-12-18T10:00:00Z"

# 2. Update DNS/connection strings
# 3. Verify data integrity
# 4. Resume traffic
```

### 9.4 Database Performance Optimization

**Indexing Strategy:**
```sql
-- Tenant isolation index (most queries filter by tenant_id)
CREATE INDEX idx_simulations_tenant ON simulations(tenant_id);
CREATE INDEX idx_simulations_user_tenant ON simulations(user_id, tenant_id);

-- Composite index for common queries
CREATE INDEX idx_simulations_tenant_status_date
  ON simulations(tenant_id, current_state, completed_at DESC);

-- Partial index for active sessions (smaller, faster)
CREATE INDEX idx_simulations_active
  ON simulations(tenant_id, user_id)
  WHERE current_state = 'in_progress';

-- GIN index for JSONB queries
CREATE INDEX idx_simulations_profile_gin
  ON simulations USING GIN(client_profile);
```

**Connection Pooling (PgBouncer):**
```ini
[databases]
shared_services = host=simulator-prod.postgres.database.azure.com dbname=shared_services
simulator_data = host=simulator-prod.postgres.database.azure.com dbname=simulator_data

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 10
```

**Read Replicas:**
- Analytics queries → Read replica (reduce load on primary)
- Reporting → Read replica
- Primary → Write operations only

---

## 10. RAG Implementation

### 10.1 Architecture Overview

**Components:**
1. **Content Ingestion Pipeline:** Process Kaplan PDFs/documents
2. **Embedding Generation:** Azure OpenAI text-embedding-ada-002
3. **Vector Store:** Azure Cognitive Search with vector search
4. **Retrieval Layer:** Semantic search at query time
5. **Context Injection:** Augment AI prompts with retrieved content

### 10.2 Content Ingestion Pipeline

**Process:**
```
Kaplan Content (PDFs, DOCX)
  ↓
1. Upload to Azure Blob Storage (raw-content container)
  ↓
2. Azure Function triggered on blob upload
  ↓
3. Text Extraction (Azure Form Recognizer or PyPDF2)
  ↓
4. Text Chunking (LangChain RecursiveCharacterTextSplitter)
   - Chunk size: 1000 tokens
   - Overlap: 200 tokens
  ↓
5. Metadata Enrichment
   - Source document
   - Industry (insurance, wealth_management, securities)
   - Content type (regulation, product guide, case study)
   - Page number, section
  ↓
6. Embedding Generation (Azure OpenAI)
   - Model: text-embedding-ada-002
   - Dimensions: 1536
  ↓
7. Index in Azure Cognitive Search
   - Store: content, metadata, vector
  ↓
8. Store metadata in PostgreSQL (content_chunks table)
  ↓
9. Update tenant access (if tenant-specific content)
```

**Azure Function (Content Processor):**
```typescript
// Triggered by blob upload
export async function contentProcessor(
  context: Context,
  blob: Buffer,
  metadata: BlobMetadata
) {
  const { tenantId, documentId, industry, contentType } = metadata;

  // 1. Extract text
  const text = await extractText(blob, metadata.mimeType);

  // 2. Chunk text
  const chunks = await chunkText(text, {
    chunkSize: 1000,
    chunkOverlap: 200,
    separator: '\n\n'
  });

  // 3. Generate embeddings (batch)
  const embeddings = await batchGenerateEmbeddings(chunks);

  // 4. Prepare search documents
  const searchDocuments = chunks.map((chunk, i) => ({
    id: `${documentId}_${i}`,
    tenantId: tenantId || null, // null = shared Kaplan content
    content: chunk,
    contentVector: embeddings[i],
    documentId,
    chunkIndex: i,
    metadata: JSON.stringify({
      source: metadata.filename,
      industry,
      contentType,
      page: extractPageNumber(chunk),
      section: extractSectionTitle(chunk)
    }),
    industry
  }));

  // 5. Upload to Cognitive Search
  await cognitiveSearchClient.uploadDocuments(searchDocuments);

  // 6. Store metadata in PostgreSQL
  await db.content_chunks.createMany(
    searchDocuments.map(doc => ({
      tenant_id: tenantId,
      document_id: documentId,
      chunk_index: doc.chunkIndex,
      content: doc.content,
      metadata: JSON.parse(doc.metadata),
      embedding_id: doc.id
    }))
  );

  context.log(`Processed ${chunks.length} chunks for ${documentId}`);
}
```

### 10.3 Vector Search Configuration

**Azure Cognitive Search Index:**
```json
{
  "name": "kaplan-content-index",
  "fields": [
    {
      "name": "id",
      "type": "Edm.String",
      "key": true,
      "searchable": false
    },
    {
      "name": "tenantId",
      "type": "Edm.String",
      "filterable": true,
      "searchable": false
    },
    {
      "name": "content",
      "type": "Edm.String",
      "searchable": true,
      "analyzer": "en.microsoft"
    },
    {
      "name": "contentVector",
      "type": "Collection(Edm.Single)",
      "searchable": true,
      "dimensions": 1536,
      "vectorSearchConfiguration": "vectorConfig"
    },
    {
      "name": "documentId",
      "type": "Edm.String",
      "filterable": true
    },
    {
      "name": "chunkIndex",
      "type": "Edm.Int32"
    },
    {
      "name": "metadata",
      "type": "Edm.String",
      "searchable": false
    },
    {
      "name": "industry",
      "type": "Edm.String",
      "filterable": true,
      "facetable": true
    },
    {
      "name": "contentType",
      "type": "Edm.String",
      "filterable": true,
      "facetable": true
    }
  ],
  "vectorSearch": {
    "algorithms": [
      {
        "name": "hnsw-algorithm",
        "kind": "hnsw",
        "hnswParameters": {
          "m": 4,
          "efConstruction": 400,
          "efSearch": 500,
          "metric": "cosine"
        }
      }
    ],
    "profiles": [
      {
        "name": "vectorConfig",
        "algorithm": "hnsw-algorithm"
      }
    ]
  },
  "semantic": {
    "configurations": [
      {
        "name": "semantic-config",
        "prioritizedFields": {
          "titleField": {
            "fieldName": "documentId"
          },
          "contentFields": [
            {
              "fieldName": "content"
            }
          ]
        }
      }
    ]
  }
}
```

### 10.4 Retrieval at Query Time

**Semantic Search:**
```typescript
export async function searchRelevantContent(
  tenantId: string,
  query: string,
  industry: string,
  topK: number = 5
): Promise<SearchResult[]> {
  // 1. Generate query embedding
  const queryEmbedding = await azureOpenAI.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  // 2. Hybrid search (vector + keyword)
  const searchResults = await cognitiveSearchClient.search(query, {
    // Vector search
    vectorQueries: [{
      kind: 'vector',
      vector: queryEmbedding.data[0].embedding,
      fields: 'contentVector',
      kNearestNeighborsCount: topK * 2 // Overquery for reranking
    }],

    // Tenant + industry filtering
    filter: `(tenantId eq '${tenantId}' or tenantId eq null) and industry eq '${industry}'`,

    // Keyword search for hybrid
    searchMode: 'all',
    queryType: 'semantic',
    semanticConfiguration: 'semantic-config',

    // Return fields
    select: ['content', 'metadata', 'documentId', 'chunkIndex'],

    // Top K results
    top: topK
  });

  // 3. Rerank with semantic ranker (Azure Cognitive Search built-in)
  // Already applied via queryType: 'semantic'

  return searchResults.results.map(r => ({
    content: r.document.content,
    metadata: JSON.parse(r.document.metadata),
    score: r.score,
    rerankerScore: r.rerankerScore
  }));
}
```

### 10.5 Context Injection into AI Prompts

**Augmented Generation:**
```typescript
export async function generateAIResponseWithRAG(params: {
  tenantId: string;
  industry: string;
  userMessage: string;
  conversationHistory: Message[];
  clientProfile: ClientProfile;
  objectives: Objective[];
}) {
  // 1. Retrieve relevant content
  const ragResults = await searchRelevantContent(
    params.tenantId,
    params.userMessage,
    params.industry,
    3 // Top 3 chunks
  );

  // 2. Build RAG context
  const ragContext = ragResults
    .map((r, i) => `[Source ${i + 1}: ${r.metadata.source}, Page ${r.metadata.page}]\n${r.content}`)
    .join('\n\n---\n\n');

  // 3. Build system prompt with RAG context
  const systemPrompt = `
You are roleplaying as a client in a financial services simulation.

**Your Personality:**
${JSON.stringify(params.clientProfile.personality, null, 2)}

**Your Financial Situation:**
${JSON.stringify(params.clientProfile.financialSituation, null, 2)}

**Knowledge Base (Use this proprietary Kaplan content to inform your responses):**
${ragContext}

**Conversation Objectives:**
${params.objectives.map(o => `- ${o.name}: ${o.completed ? 'COMPLETED' : 'Not yet completed'}`).join('\n')}

**Instructions:**
1. Stay in character based on your personality traits
2. Use information from the Knowledge Base when relevant
3. Respond naturally to the financial advisor's questions
4. If they ask about regulations or products, reference the Knowledge Base
5. Don't explicitly say "According to the Knowledge Base" - just use the info naturally
6. Track objectives and update them via function calling

Respond to the advisor's message as this client.
`;

  // 4. Call Azure OpenAI with augmented prompt
  const response = await azureOpenAI.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...params.conversationHistory,
      { role: 'user', content: params.userMessage }
    ],
    temperature: 0.7,
    max_tokens: 500,
    functions: [
      {
        name: 'update_objectives',
        description: 'Update the conversation objectives based on what was accomplished',
        parameters: {
          type: 'object',
          properties: {
            objectives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  completed: { type: 'boolean' },
                  progress: { type: 'number', minimum: 0, maximum: 100 }
                }
              }
            }
          }
        }
      }
    ],
    function_call: 'auto'
  });

  return {
    message: response.choices[0].message.content,
    objectivesUpdate: response.choices[0].message.function_call?.arguments,
    ragSources: ragResults.map(r => r.metadata.source)
  };
}
```

### 10.6 Content Management Admin UI

**Features:**
- Upload PDFs/DOCX
- Tag with industry, content type
- Mark as tenant-specific or shared
- View indexed chunks
- Search test interface
- Delete documents

**API:**
```typescript
POST   /api/v1/ai/rag/upload              // Upload document
GET    /api/v1/ai/rag/documents           // List documents
DELETE /api/v1/ai/rag/documents/:documentId // Delete document
POST   /api/v1/ai/rag/search-test         // Test search query
```

---

## 11. LMS Integration

### 11.1 Integration Patterns

**Supported LMS Platforms:**
- Canvas LMS
- Moodle
- Blackboard Learn
- Brightspace (D2L)
- Custom (via LTI 1.3 standard)

**Integration Methods:**
1. **LTI 1.3 Advantage:** Deep linking, grade passback, rostering (primary)
2. **SCIM 2.0:** User provisioning and sync
3. **REST API:** Custom integrations for advanced features
4. **Webhooks:** Real-time event notifications to LMS

### 11.2 LTI 1.3 Implementation

**LTI Advantage Features:**
- **Core LTI 1.3:** Secure launch and authentication
- **Deep Linking (LTI-DL):** Instructors select specific simulators
- **Assignment and Grade Services (LTI-AGS):** Grade passback
- **Names and Role Provisioning Services (LTI-NRPS):** Roster sync

**Registration Flow:**
```
1. Tenant Admin initiates LMS integration in Admin Portal
   ↓
2. System generates:
   - LTI Registration URL: https://api.yourdomain.com/lti/registration
   - Client ID: auto-generated
   - Public JWK Set URL: https://api.yourdomain.com/lti/jwks
   ↓
3. Admin registers in LMS with:
   - Tool URL: https://app.yourdomain.com/lti/launch
   - OIDC Login URL: https://api.yourdomain.com/lti/login
   - JWK Set URL: https://api.yourdomain.com/lti/jwks
   - Redirect URIs: https://app.yourdomain.com/lti/callback
   ↓
4. LMS provides:
   - Issuer: https://canvas.instructure.com
   - Authorization Endpoint: https://canvas.instructure.com/api/lti/authorize_redirect
   - Token Endpoint: https://canvas.instructure.com/login/oauth2/token
   - JWK Set URL: https://canvas.instructure.com/api/lti/security/jwks
   - Deployment ID: deployment-xyz
   ↓
5. Admin enters LMS details in Admin Portal
   ↓
6. System validates configuration (test launch)
   ↓
7. Integration ACTIVE
```

**Deep Linking (Instructor selects simulator):**
```typescript
// Instructor clicks "Select Content" in LMS
// LMS sends Deep Linking Request

export async function handleDeepLinkingRequest(req: Request) {
  const { id_token } = req.body;

  // Validate JWT (same as launch)
  const claims = await validateLtiToken(id_token);

  // Extract deep linking settings
  const deepLinkSettings = claims['https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'];

  // Show instructor UI to select simulator
  // (Frontend dialog with simulator list)

  return {
    returnUrl: deepLinkSettings.deep_link_return_url,
    availableSimulators: await getAvailableSimulators(claims.tenantId)
  };
}

// Instructor selects "Insurance Simulator - Beginner"
export async function createDeepLink(simulatorId: string, settings: DeepLinkSettings) {
  // Create LTI Resource Link
  const resourceLink = {
    type: 'ltiResourceLink',
    title: 'Insurance Simulator - Beginner',
    url: `https://app.yourdomain.com/lti/launch?simulator=${simulatorId}`,
    custom: {
      simulator_id: simulatorId,
      difficulty: 'beginner',
      industry: 'insurance'
    }
  };

  // Create JWT with deep link response
  const jwt = await createJwt({
    iss: process.env.LTI_CLIENT_ID,
    aud: settings.issuer,
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 600,
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingResponse',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': settings.deploymentId,
    'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': [resourceLink]
  });

  // Redirect back to LMS
  return redirect(settings.deep_link_return_url, {
    JWT: jwt
  });
}
```

**Grade Passback (LTI-AGS):**
```typescript
// Already covered in section 5.1.6, here's the flow summary:

1. Student completes simulation via LTI launch
2. System generates performance review with score
3. Trigger grade sync (automatic or manual)
4. Get LMS access token (OAuth 2.0 client credentials)
5. POST score to lineitem URL (from LTI launch claims)
6. LMS updates gradebook
7. Log sync status in grade_sync_log table
```

### 11.3 SCIM 2.0 User Provisioning

**SCIM Endpoints:**
```typescript
// SCIM 2.0 API (for LMS to provision users)
GET    /scim/v2/Users              // List users
GET    /scim/v2/Users/:id          // Get user
POST   /scim/v2/Users              // Create user
PUT    /scim/v2/Users/:id          // Update user (full replace)
PATCH  /scim/v2/Users/:id          // Partial update
DELETE /scim/v2/Users/:id          // Deactivate user

GET    /scim/v2/Groups             // List groups (courses/cohorts)
POST   /scim/v2/Groups             // Create group
PATCH  /scim/v2/Groups/:id         // Add/remove members
```

**SCIM User Schema:**
```json
{
  "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
  "id": "user-uuid",
  "userName": "student@university.edu",
  "name": {
    "givenName": "John",
    "familyName": "Doe"
  },
  "emails": [
    {
      "value": "student@university.edu",
      "primary": true
    }
  ],
  "active": true,
  "externalId": "lms-user-id-123",
  "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
    "organization": "University of Example"
  }
}
```

**SCIM Implementation:**
```typescript
@Controller('scim/v2')
export class ScimController {
  @Post('Users')
  async createUser(@Body() scimUser: ScimUser) {
    // 1. Validate SCIM schema
    const validated = validateScimUser(scimUser);

    // 2. Check if user exists (by externalId)
    let user = await db.users.findOne({ lms_external_id: scimUser.externalId });

    if (user) {
      // User already exists, update instead
      return this.updateUser(user.id, scimUser);
    }

    // 3. Create user in database
    user = await db.users.create({
      email: scimUser.userName,
      name: `${scimUser.name.givenName} ${scimUser.name.familyName}`,
      tenant_id: getTenantIdFromAuth(req), // From Bearer token
      lms_external_id: scimUser.externalId,
      active: scimUser.active
    });

    // 4. Provision in Azure AD B2C (optional, or use JIT provisioning)
    // await azureAd.createUser(user);

    // 5. Return SCIM response
    return {
      schemas: scimUser.schemas,
      id: user.id,
      externalId: scimUser.externalId,
      userName: user.email,
      name: {
        givenName: scimUser.name.givenName,
        familyName: scimUser.name.familyName
      },
      active: user.active,
      meta: {
        resourceType: 'User',
        created: user.created_at,
        lastModified: user.updated_at,
        location: `/scim/v2/Users/${user.id}`
      }
    };
  }
}
```

### 11.4 Custom API Integration

**For LMS platforms without LTI 1.3:**

**API Endpoints:**
```typescript
// Launch simulator from LMS
POST   /api/v1/lms/launch
{
  "lms_user_id": "lms-user-123",
  "lms_course_id": "course-456",
  "simulator_code": "insurance",
  "difficulty": "beginner",
  "return_url": "https://lms.example.com/courses/123/assignments/456"
}

// Get simulation results
GET    /api/v1/lms/simulations/:simulationId/result
Response: {
  "score": 85,
  "completed_at": "2025-12-18T14:30:00Z",
  "duration_seconds": 1200,
  "competency_scores": {...}
}

// Webhook for grade updates
POST   /api/v1/lms/webhooks/grade-updated
(LMS receives notification when simulation is completed)
```

---

## 12. Infrastructure Architecture

### 12.1 Azure Kubernetes Service (AKS) Configuration

**Cluster Specification:**
- **Node Pool:**
  - **System Pool:** 2-3 nodes (Standard_D4s_v3) for Kubernetes system components
  - **Application Pool:** 3-10 nodes (Standard_D8s_v3) for microservices (auto-scaling)
  - **AI/RAG Pool:** 2-5 nodes (Standard_F8s_v2 - compute optimized) for AI workloads
- **Network:** Azure CNI with Network Policies
- **Ingress:** NGINX Ingress Controller with cert-manager (Let's Encrypt)
- **Service Mesh:** Linkerd (optional, for advanced traffic management)
- **Storage:** Azure Disk (Premium SSD) for PostgreSQL, Azure Files for shared storage

**Cluster Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Kubernetes Service (AKS)              │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Ingress Controller (NGINX)              │  │
│  │  - TLS Termination (cert-manager)                         │  │
│  │  - Rate Limiting                                          │  │
│  │  - WAF Rules                                              │  │
│  └────────────┬──────────────────────────────────────────────┘  │
│               │                                                  │
│  ┌────────────▼──────────────────────────────────────────────┐  │
│  │                      Namespaces                           │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐         │  │
│  │  │  Namespace: production                       │         │  │
│  │  │                                               │         │  │
│  │  │  Deployments:                                │         │  │
│  │  │  - api-gateway (3 replicas)                  │         │  │
│  │  │  - auth-service (3 replicas)                 │         │  │
│  │  │  - tenant-service (2 replicas)               │         │  │
│  │  │  - simulator-service (5 replicas)            │         │  │
│  │  │  - ai-rag-service (3 replicas)               │         │  │
│  │  │  - lms-integration-service (2 replicas)      │         │  │
│  │  │  - analytics-service (2 replicas)            │         │  │
│  │  │  - notification-service (2 replicas)         │         │  │
│  │  │  - frontend (3 replicas)                     │         │  │
│  │  │                                               │         │  │
│  │  │  Services (ClusterIP):                       │         │  │
│  │  │  - Each deployment has a ClusterIP service   │         │  │
│  │  └──────────────────────────────────────────────┘         │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐         │  │
│  │  │  Namespace: staging (similar structure)      │         │  │
│  │  └──────────────────────────────────────────────┘         │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────┐         │  │
│  │  │  Namespace: monitoring                       │         │  │
│  │  │  - Prometheus                                │         │  │
│  │  │  - Grafana                                   │         │  │
│  │  │  - Loki (log aggregation)                    │         │  │
│  │  └──────────────────────────────────────────────┘         │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Deployment Manifest Example (Simulator Service):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simulator-service
  namespace: production
  labels:
    app: simulator-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: simulator-service
  template:
    metadata:
      labels:
        app: simulator-service
        version: v1.2.3
    spec:
      containers:
      - name: simulator-service
        image: simulatoracr.azurecr.io/simulator-service:v1.2.3
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secrets
              key: simulator-db-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secrets
              key: redis-url
        - name: SERVICE_BUS_CONNECTION_STRING
          valueFrom:
            secretKeyRef:
              name: azure-secrets
              key: service-bus-connection
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
      imagePullSecrets:
      - name: acr-secret
---
apiVersion: v1
kind: Service
metadata:
  name: simulator-service
  namespace: production
spec:
  selector:
    app: simulator-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: simulator-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: simulator-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 12.2 Networking and Security

**Virtual Network (VNet):**
```
VNet: simulator-vnet (10.0.0.0/16)
  ├── Subnet: aks-subnet (10.0.1.0/24)
  │   └── AKS cluster nodes
  ├── Subnet: database-subnet (10.0.2.0/24)
  │   └── Azure Database for PostgreSQL
  ├── Subnet: redis-subnet (10.0.3.0/24)
  │   └── Azure Cache for Redis
  └── Subnet: private-endpoints-subnet (10.0.4.0/24)
      └── Private endpoints for Azure services
```

**Network Security Groups (NSG):**
- **AKS Subnet:**
  - Allow: HTTPS (443) from Azure Front Door
  - Allow: Internal cluster communication
  - Deny: All other inbound
- **Database Subnet:**
  - Allow: PostgreSQL (5432) from AKS subnet only
  - Deny: All other inbound
- **Redis Subnet:**
  - Allow: Redis (6379) from AKS subnet only
  - Deny: All other inbound

**Private Endpoints:**
- Azure Database for PostgreSQL: No public IP, accessed via private endpoint
- Azure Storage: Blob storage for content accessible only from AKS
- Azure Key Vault: Secrets accessed via private endpoint
- Azure Cognitive Search: Accessible via private endpoint

**Azure Front Door:**
- Global CDN and WAF
- DDoS protection
- SSL/TLS termination
- Caching for static assets
- Backend: AKS NGINX Ingress

### 12.3 Secrets Management

**Azure Key Vault Integration:**
- **Secrets Stored:**
  - Database connection strings
  - Azure OpenAI API keys
  - Azure AD B2C client secrets
  - Service Bus connection strings
  - Encryption keys

**AKS Integration (CSI Driver):**
```yaml
# Install Azure Key Vault CSI Driver
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-secrets
  namespace: production
spec:
  provider: azure
  parameters:
    usePodIdentity: "true"
    keyvaultName: "simulator-keyvault"
    tenantId: "your-tenant-id"
    objects: |
      array:
        - |
          objectName: database-url
          objectType: secret
          objectVersion: ""
        - |
          objectName: azure-openai-key
          objectType: secret
          objectVersion: ""
  secretObjects:
  - secretName: database-secrets
    type: Opaque
    data:
    - objectName: database-url
      key: DATABASE_URL
  - secretName: azure-secrets
    type: Opaque
    data:
    - objectName: azure-openai-key
      key: OPENAI_API_KEY
---
# Pod using secrets
apiVersion: v1
kind: Pod
metadata:
  name: simulator-service-pod
spec:
  containers:
  - name: simulator-service
    image: simulator-service:latest
    volumeMounts:
    - name: secrets-store
      mountPath: "/mnt/secrets-store"
      readOnly: true
    env:
    - name: DATABASE_URL
      valueFrom:
        secretKeyRef:
          name: database-secrets
          key: DATABASE_URL
  volumes:
  - name: secrets-store
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: "azure-keyvault-secrets"
```

### 12.4 Auto-Scaling

**Horizontal Pod Autoscaler (HPA):**
- CPU-based: Scale at 70% CPU utilization
- Memory-based: Scale at 80% memory utilization
- Custom metrics: Queue length (Azure Service Bus)

**Cluster Autoscaler:**
- Automatically add/remove nodes based on pod resource requests
- Min nodes: 3 (HA)
- Max nodes: 20

**Azure Front Door Auto-Scaling:**
- Automatically scales to handle traffic spikes
- No manual configuration needed

---

## 13. DevOps & CI/CD

### 13.1 GitOps with ArgoCD

**Repository Structure:**
```
/github-repo
├── /apps
│   ├── /frontend
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   ├── /api-gateway
│   ├── /auth-service
│   ├── /tenant-service
│   └── ... (all microservices)
│
├── /infrastructure
│   ├── /terraform
│   │   ├── main.tf
│   │   ├── aks.tf
│   │   ├── database.tf
│   │   └── variables.tf
│   └── /helm
│       └── /simulator-platform
│           ├── Chart.yaml
│           ├── values.yaml
│           ├── values-staging.yaml
│           ├── values-production.yaml
│           └── templates/
│               ├── deployment.yaml
│               ├── service.yaml
│               ├── ingress.yaml
│               └── hpa.yaml
│
├── /k8s
│   ├── /base (Kustomize base)
│   │   ├── kustomization.yaml
│   │   └── namespace.yaml
│   ├── /staging (Kustomize overlay)
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── /production (Kustomize overlay)
│       ├── kustomization.yaml
│       └── patches/
│
├── /argocd
│   ├── application-staging.yaml
│   └── application-production.yaml
│
└── .github/workflows
    ├── build-and-push.yml
    ├── deploy-staging.yml
    └── deploy-production.yml
```

**ArgoCD Application Manifest:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: simulator-platform-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourorg/simulator-platform
    targetRevision: main
    path: k8s/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  health:
    status: Healthy
```

**GitOps Workflow:**
```
Developer commits code
  ↓
GitHub Actions triggered
  ↓
1. Run tests (unit, integration)
2. Build Docker image
3. Push to Azure Container Registry
4. Update k8s manifests with new image tag
5. Commit manifest changes to Git
  ↓
ArgoCD detects manifest change
  ↓
ArgoCD syncs to AKS cluster
  ↓
Rolling deployment (zero downtime)
  ↓
Health checks pass
  ↓
Deployment complete
```

### 13.2 CI Pipeline (GitHub Actions)

**Build and Push Workflow:**
```yaml
name: Build and Push

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    strategy:
      matrix:
        service:
          - frontend
          - api-gateway
          - auth-service
          - tenant-service
          - simulator-service
          - ai-rag-service
          - lms-integration-service
          - analytics-service
          - notification-service

    steps:
      - uses: actions/checkout@v3

      - name: Azure Container Registry login
        uses: azure/docker-login@v1
        with:
          login-server: simulatoracr.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build Docker image
        working-directory: ./apps/${{ matrix.service }}
        run: |
          docker build \
            -t simulatoracr.azurecr.io/${{ matrix.service }}:${{ github.sha }} \
            -t simulatoracr.azurecr.io/${{ matrix.service }}:latest \
            .

      - name: Push Docker image
        run: |
          docker push simulatoracr.azurecr.io/${{ matrix.service }}:${{ github.sha }}
          docker push simulatoracr.azurecr.io/${{ matrix.service }}:latest

      - name: Update k8s manifest
        run: |
          cd k8s/staging
          kustomize edit set image ${{ matrix.service }}=simulatoracr.azurecr.io/${{ matrix.service }}:${{ github.sha }}
          git config user.name "github-actions"
          git config user.email "github-actions@github.com"
          git add .
          git commit -m "Update ${{ matrix.service }} to ${{ github.sha }}"
          git push
```

### 13.3 Deployment Strategy

**Rolling Deployment (Default):**
- Update pods incrementally
- Zero downtime
- Automatic rollback on health check failure

**Blue-Green Deployment (for major releases):**
```yaml
# Temporarily run both versions
# Switch traffic via Ingress update
# Decommission old version after validation
```

**Canary Deployment (for risky changes):**
```yaml
# Route 10% traffic to new version
# Monitor metrics
# Gradually increase to 100%
```

---

## 14. Security Architecture

### 14.1 Security Layers

**1. Network Security:**
- Azure Front Door WAF (OWASP Top 10 protection)
- NSG rules (whitelisting)
- Private endpoints for Azure services
- No public IPs on databases

**2. Identity & Access:**
- Azure AD B2C for end users
- Azure AD (RBAC) for infrastructure access
- Managed identities for service-to-service auth
- Principle of least privilege

**3. Data Security:**
- Encryption at rest (Azure Storage, PostgreSQL)
- Encryption in transit (TLS 1.3)
- Row-level security in PostgreSQL
- Data masking for PII in logs

**4. Application Security:**
- OWASP secure coding practices
- Input validation (Zod schemas)
- CSRF protection
- Content Security Policy (CSP) headers
- Rate limiting per tenant

**5. Secrets Management:**
- Azure Key Vault for all secrets
- No secrets in code or Git
- Automated secret rotation

**6. Compliance:**
- SOC2 Type II readiness
- GDPR compliance (data export, right to deletion)
- WCAG 2.1 AA accessibility

### 14.2 Security Hardening Checklist

**Pre-Production:**
- [ ] Enable Azure DDoS Protection
- [ ] Configure WAF rules (SQL injection, XSS)
- [ ] Implement rate limiting (per tenant, per user)
- [ ] Enable database audit logging
- [ ] Set up vulnerability scanning (Snyk, Trivy)
- [ ] Penetration testing
- [ ] Enable Azure Security Center
- [ ] Implement secret rotation policy
- [ ] Configure CORS policies
- [ ] Enable Content Security Policy headers
- [ ] Implement CSRF tokens
- [ ] Password hashing (bcrypt with cost factor 12)
- [ ] Implement MFA for admin users
- [ ] Set up intrusion detection (Azure Sentinel)

### 14.3 Incident Response Plan

**Severity Levels:**
- **P0 (Critical):** System down, data breach
- **P1 (High):** Major feature broken, performance degradation
- **P2 (Medium):** Minor feature issue
- **P3 (Low):** Cosmetic issue

**Response SLA:**
- P0: Acknowledge in 15 minutes, resolve in 4 hours
- P1: Acknowledge in 1 hour, resolve in 24 hours
- P2: Acknowledge in 4 hours, resolve in 1 week
- P3: Acknowledge in 1 day, resolve in 2 weeks

**Data Breach Response:**
1. Isolate affected systems
2. Assess scope of breach
3. Notify affected tenants within 72 hours (GDPR)
4. Forensic analysis
5. Remediation
6. Post-mortem report

---

## 15. Observability & Monitoring

### 15.1 Monitoring Stack

**Logs: Azure Monitor + Loki**
- Structured logging (JSON format)
- Centralized aggregation in Azure Monitor Logs
- Query with KQL (Kusto Query Language)
- Retention: 90 days

**Metrics: Prometheus + Grafana**
- Application metrics (request rate, latency, errors)
- Infrastructure metrics (CPU, memory, disk)
- Custom business metrics (simulations per hour, AI tokens used)
- Dashboards in Grafana

**Tracing: Azure Application Insights**
- Distributed tracing across microservices
- OpenTelemetry instrumentation
- Visualize request flows
- Identify bottlenecks

**Alerting: Azure Monitor Alerts + PagerDuty**
- On-call rotation
- Escalation policies
- Alert rules:
  - API error rate > 5%
  - Response time p95 > 1s
  - Database connection pool exhausted
  - Disk usage > 80%
  - Pod restarts > 5 in 10 minutes

### 15.2 Key Metrics Dashboards

**Platform Health Dashboard:**
- Request rate (RPS) per service
- Error rate (4xx, 5xx)
- Response time percentiles (p50, p95, p99)
- Active user count
- Database query latency
- Cache hit rate

**Business Metrics Dashboard:**
- Active tenants
- Simulations per day
- Average simulation duration
- Completion rate
- AI tokens consumed
- LMS grade sync success rate

**Cost Dashboard:**
- Azure OpenAI spend per tenant
- Compute costs (AKS nodes)
- Database costs
- Storage costs
- Bandwidth costs

### 15.3 Log Aggregation

**Log Format (JSON):**
```json
{
  "timestamp": "2025-12-18T14:30:00.123Z",
  "level": "info",
  "service": "simulator-service",
  "trace_id": "abc123",
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "message": "Simulation completed",
  "metadata": {
    "simulation_id": "sim-uuid",
    "industry": "insurance",
    "duration_seconds": 1200,
    "score": 85
  }
}
```

**Sensitive Data Redaction:**
```typescript
// Automatically redact PII from logs
export function sanitizeLog(data: any) {
  const sensitiveFields = ['password', 'ssn', 'credit_card', 'access_token'];

  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (sensitiveFields.includes(key.toLowerCase())) {
      return '[REDACTED]';
    }
    return value;
  }));
}
```

---

## 16. Migration Strategy

### 16.1 Migration Phases

**Phase 1: Infrastructure Setup (Weeks 1-2)**
- Provision Azure resources (AKS, PostgreSQL, Redis, etc.)
- Set up CI/CD pipelines
- Configure ArgoCD
- Deploy monitoring stack

**Phase 2: Backend Migration (Weeks 3-6)**
- Migrate Auth Service (integrate Azure AD B2C)
- Migrate Tenant Service (set up multi-tenancy)
- Migrate Simulator Service (refactor from Next.js API routes)
- Migrate AI/RAG Service (implement RAG with Azure Cognitive Search)
- Migrate Analytics Service
- Migrate LMS Integration Service

**Phase 3: Database Migration (Weeks 5-7)**
- Export data from Neon PostgreSQL
- Set up Azure PostgreSQL with schema-per-tenant
- Migrate data (tenant by tenant)
- Validate data integrity
- Switch connection strings

**Phase 4: Frontend Migration (Weeks 7-9)**
- Refactor Next.js app to React SPA (or keep Next.js SSR)
- Update API calls to use new backend
- Implement OIDC authentication
- Deploy to AKS

**Phase 5: LMS Integration (Weeks 10-12)**
- Implement LTI 1.3 integration
- Test with Canvas/Moodle sandbox
- Pilot with 1-2 tenants

**Phase 6: RAG Content Ingestion (Weeks 11-13)**
- Ingest Kaplan content
- Generate embeddings
- Index in Azure Cognitive Search
- Test RAG quality

**Phase 7: Testing & Optimization (Weeks 14-16)**
- Performance testing (load testing with 10,000 concurrent users)
- Security testing (penetration testing)
- UAT with pilot tenants
- Optimization based on findings

**Phase 8: Production Cutover (Week 17)**
- Blue-green deployment
- DNS cutover
- Monitor closely for 48 hours
- Decommission old infrastructure

### 16.2 Data Migration Plan

**Strategy: Tenant-by-Tenant Migration**

**Steps:**
1. **Export:** `pg_dump` from Neon for each tenant
2. **Transform:** Convert to schema-per-tenant structure
3. **Load:** Import into Azure PostgreSQL
4. **Validate:** Row count, sample data checks
5. **Cutover:** Update application to use new DB
6. **Monitor:** Watch for errors

**Rollback Plan:**
- Keep old database active for 30 days
- Switch connection strings back if critical issues arise

### 16.3 Zero-Downtime Deployment

**Approach:**
1. Deploy new infrastructure in parallel
2. Run dual-write mode (write to both old and new systems)
3. Migrate data in background
4. Switch read traffic to new system gradually (10% → 50% → 100%)
5. Stop dual-write mode
6. Decommission old system

---

## 17. Technology Stack

### 17.1 Backend Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Runtime** | Node.js | 20 LTS |
| **Framework** | NestJS | 10.x |
| **Language** | TypeScript | 5.x |
| **API Gateway** | Kong Gateway | 3.x |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis | 7.x |
| **Message Bus** | Azure Service Bus | - |
| **AI** | Azure OpenAI | gpt-4o, text-embedding-ada-002 |
| **Vector Search** | Azure Cognitive Search | - |
| **ORM** | Prisma or Drizzle | 5.x |
| **Validation** | Zod | 3.x |
| **Testing** | Jest + Supertest | 29.x |

### 17.2 Frontend Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Next.js (App Router) | 15.x |
| **Language** | TypeScript | 5.x |
| **UI Library** | React | 19.x |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | shadcn/ui | Latest |
| **State** | Zustand or React Context | 4.x |
| **Forms** | React Hook Form + Zod | 7.x |
| **API Client** | TanStack Query (React Query) | 5.x |
| **Auth** | oidc-client-ts | 3.x |
| **Testing** | Vitest + Testing Library | 1.x |
| **E2E** | Playwright | 1.x |

### 17.3 Infrastructure Stack

| Component | Technology |
|-----------|------------|
| **Container Orchestration** | Azure Kubernetes Service (AKS) |
| **Container Registry** | Azure Container Registry |
| **Database** | Azure Database for PostgreSQL - Flexible Server |
| **Cache** | Azure Cache for Redis |
| **Storage** | Azure Blob Storage |
| **CDN/WAF** | Azure Front Door |
| **Secret Management** | Azure Key Vault |
| **Identity Provider** | Azure AD B2C |
| **Monitoring** | Azure Monitor + Prometheus + Grafana |
| **Logging** | Azure Monitor Logs + Loki |
| **Tracing** | Azure Application Insights |
| **GitOps** | ArgoCD |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions |

---

## 18. Appendices

### Appendix A: API Versioning Strategy

**Approach: URL Versioning**
- `/api/v1/simulators`
- `/api/v2/simulators` (when breaking changes needed)

**Deprecation Policy:**
- Announce deprecation 6 months in advance
- Support N-1 versions for 12 months
- Provide migration guide

### Appendix B: Capacity Planning

**Assumptions:**
- 100 tenants
- 10,000 total users
- 1,000 concurrent simulations (peak)
- Average simulation: 20 minutes, 40 messages

**Resource Estimates:**
- **AKS Nodes:** 15-20 nodes (auto-scaling)
- **Database:** 1 TB storage, 32 vCores
- **Redis:** 13 GB cache (P2 tier)
- **AI Tokens:** ~50M tokens/month (@ $0.005/1K = $250/month)
- **Total Azure Cost:** ~$8,000-12,000/month

### Appendix C: Future Enhancements

**Phase 2 (6-12 months post-launch):**
- Voice-based simulation (Azure Speech Services)
- Video role-play (Azure Video Indexer)
- Advanced analytics (ML-based performance predictions)
- Mobile app (React Native)
- Gamification (badges, leaderboards)
- Custom simulator builder (low-code)

**Phase 3 (12-24 months):**
- Multi-language support (i18n)
- Advanced compliance modules
- Integration with CRM systems (Salesforce)
- White-label solution for enterprise customers

### Appendix D: Glossary

- **AKS:** Azure Kubernetes Service
- **B2C:** Business-to-Consumer (Azure AD B2C for customer identity)
- **CSP:** Content Security Policy
- **HPA:** Horizontal Pod Autoscaler
- **JWK:** JSON Web Key
- **LTI:** Learning Tools Interoperability
- **OIDC:** OpenID Connect
- **RAG:** Retrieval-Augmented Generation
- **RBAC:** Role-Based Access Control
- **RLS:** Row-Level Security
- **SCIM:** System for Cross-domain Identity Management
- **SSO:** Single Sign-On
- **TLS:** Transport Layer Security

---

## Conclusion

This system design provides a comprehensive blueprint for transforming the financial services simulator MVP into a production-ready, multi-tenant SaaS platform. The architecture prioritizes:

1. **Scalability:** Microservices + Kubernetes + auto-scaling
2. **Security:** OIDC/OAuth, Azure AD B2C, encryption, multi-tenant isolation
3. **Extensibility:** Plugin-based simulators, dynamic licensing
4. **Integration:** LTI 1.3 for LMS, SCIM for user provisioning
5. **AI-Powered:** Azure OpenAI + RAG for intelligent simulations
6. **Observability:** Comprehensive logging, metrics, tracing

**Next Steps:**
1. Review and approval from stakeholders
2. Finalize technology choices (e.g., Prisma vs Drizzle)
3. Create detailed task breakdown for each phase
4. Assign development teams to microservices
5. Set up Azure environment and infrastructure
6. Begin Phase 1: Infrastructure Setup

**Estimated Timeline:** 17 weeks for full migration
**Estimated Team Size:** 8-10 engineers (2 frontend, 5 backend, 1 DevOps, 1 QA, 1 architect)

---

**Document Version:** 1.0
**Last Updated:** December 18, 2025
**Prepared by:** Principal Engineer
**Status:** Ready for Review
