# Financial Services Simulator - System Design V2 (Refactored Architecture)

**Version:** 2.0
**Date:** December 18, 2025
**Purpose:** Refactoring Design - Frontend/Backend Separation
**Status:** Architecture Design Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Refactoring Objectives](#2-refactoring-objectives)
3. [Current Architecture Analysis](#3-current-architecture-analysis)
4. [Proposed Architecture](#4-proposed-architecture)
5. [Frontend Module Organization](#5-frontend-module-organization)
6. [Backend Module Organization](#6-backend-module-organization)
7. [Shared Module Organization](#7-shared-module-organization)
8. [Refactoring Requirements](#8-refactoring-requirements)
9. [Module Dependencies](#9-module-dependencies)
10. [Migration Strategy](#10-migration-strategy)
11. [Technical Stack](#11-technical-stack)

---

## 1. Executive Summary

### 1.1 Purpose

This document outlines the **refactoring architecture** for separating the existing monolithic Next.js application into distinct **frontend** and **backend** modules within a monorepo structure. The refactoring maintains all existing functionality while establishing clear architectural boundaries.

### 1.2 Current State

The application currently exists as a Next.js 15 application with:
- Mixed frontend and backend code in the `app/` directory
- API routes co-located with UI pages
- Shared utilities scattered across multiple directories
- No clear separation between client and server concerns

### 1.3 Target State

Post-refactoring:
```
/simulator
  /frontend          # Client-side application
  /backend           # Server-side API and services
/shared              # Common types and utilities
```

### 1.4 Key Principles

- **Zero Feature Addition**: Refactor existing code only, no new features
- **Minimal Additional Code**: Only add infrastructure code necessary for separation
- **Preserve Functionality**: All existing features remain operational
- **Clear Boundaries**: Explicit separation between frontend, backend, and shared code
- **Type Safety**: Maintain TypeScript throughout

---

## 2. Refactoring Objectives

### 2.1 Primary Goals

1. **Architectural Clarity**: Clear separation of concerns between UI and business logic
2. **Independent Development**: Frontend and backend can be developed independently
3. **Scalability**: Prepare for future microservices extraction
4. **Maintainability**: Easier to locate and modify code
5. **Testing**: Enable independent testing of frontend and backend

### 2.2 Non-Goals (What We're NOT Doing)

- ❌ Adding new features or functionality
- ❌ Changing database schema
- ❌ Modifying authentication mechanisms
- ❌ Altering AI/ML models or integrations
- ❌ Adding deployment infrastructure
- ❌ Performance optimizations beyond separation
- ❌ UI/UX changes
- ❌ Adding logging, monitoring, or observability features

### 2.3 Success Criteria

- ✅ All frontend code resides in `/simulator/frontend`
- ✅ All backend code resides in `/simulator/backend`
- ✅ Shared types exist in `/shared/types`
- ✅ No circular dependencies between frontend and backend
- ✅ All existing API endpoints remain functional
- ✅ All existing UI pages render correctly
- ✅ Authentication and authorization work unchanged
- ✅ Database operations continue as before

---

## 3. Current Architecture Analysis

### 3.1 Current Directory Structure

```
/app                           # Next.js App Router (mixed frontend/backend)
  /account                     # User account pages
  /admin                       # Admin pages
  /api                         # API routes (backend)
  /components                  # Page-specific components
  /dashboard                   # Dashboard pages
  /login, /signup              # Auth pages
  /parameters                  # Parameter management pages
  /profile-generator           # Profile generation pages
  /simulation                  # Simulation pages
  /student-dashboard           # Student pages
  /trainer                     # Trainer pages
  /users                       # User pages
/components                    # Shared React components
  /dashboard                   # Dashboard components
  /debug                       # Debug components
  /parameter-catalog           # Parameter catalog components
  /ui                          # UI library components
/hooks                         # React custom hooks
/context                       # React context providers
/store                         # Client-side state (Zustand)
/lib                           # Mixed utilities (client + server)
  /store                       # Additional stores
/types                         # TypeScript type definitions
/utils                         # Utility functions
/scripts                       # Database scripts
/data                          # Static configuration JSON files
/public                        # Static assets
```

### 3.2 Current Code Distribution

| Category | Files/Modules | Location |
|----------|---------------|----------|
| **Frontend Pages** | 40+ pages | `/app/**/page.tsx` |
| **API Routes** | 60+ endpoints | `/app/api/**` |
| **React Components** | 100+ components | `/components/**` |
| **Custom Hooks** | 4 hooks | `/hooks/**` |
| **Context Providers** | 2 contexts | `/context/**` |
| **State Stores** | 2 stores | `/store/**`, `/lib/store/**` |
| **Type Definitions** | 20+ types | `/types/**` |
| **Utilities** | 15+ utility modules | `/utils/**`, `/lib/**` |
| **Database Functions** | 10+ modules | `/lib/*-db.ts`, `/lib/*-service.ts` |
| **AI Integration** | 5+ modules | `/app/profile-generator/**`, `/app/api/simulation/**` |

### 3.3 Key Dependencies

```
Frontend Dependencies:
- React 19
- Next.js 15.2.4 (App Router)
- Radix-UI components
- TailwindCSS
- React Hook Form
- Zustand
- SWR
- Recharts

Backend Dependencies:
- Next.js API Routes
- @neondatabase/serverless (PostgreSQL)
- @vercel/postgres
- next-auth (authentication)
- bcryptjs (password hashing)
- openai (GPT-4o integration)
- nodemailer
- zod (validation)

Shared Dependencies:
- TypeScript 5
- date-fns
- uuid
- csv-parse
```

---

## 4. Proposed Architecture

### 4.1 New Directory Structure

```
/simulator
  /frontend
    /app                              # Next.js pages (UI only)
    /components                       # All React components
    /hooks                            # React hooks
    /context                          # Context providers
    /store                            # Client state management
    /lib                              # Frontend utilities
    /styles                           # Stylesheets
    /public                           # Static assets
    package.json                      # Frontend dependencies
    next.config.js                    # Next.js configuration
    tsconfig.json                     # TypeScript config

  /backend
    /api                              # API route handlers
      /auth                           # Authentication endpoints
      /users                          # User management
      /simulation                     # Simulation APIs
      /parameters                     # Parameter management
      /competencies                   # Competency APIs
      /fusion-model                   # AI model config
      /admin                          # Admin APIs
      /personality                    # Personality APIs
      /feedback                       # Feedback collection
      /engagement                     # Engagement tracking
    /services                         # Business logic layer
      /auth-service.ts                # Authentication logic
      /user-service.ts                # User operations
      /simulation-service.ts          # Simulation engine
      /ai-service.ts                  # OpenAI integration
      /profile-generation-service.ts  # Profile generation
      /engagement-service.ts          # Engagement tracking
      /feedback-service.ts            # Feedback processing
    /db                               # Database access layer
      /connection.ts                  # Database connection
      /repositories                   # Data access repositories
        /user-repository.ts
        /parameter-repository.ts
        /competency-repository.ts
        /simulation-repository.ts
        /rubric-repository.ts
        /session-repository.ts
    /models                           # Data models & schemas
      /user.model.ts
      /simulation.model.ts
      /competency.model.ts
      /parameter.model.ts
    /middleware                       # Express-style middleware
      /auth-middleware.ts
      /error-handler.ts
      /validation-middleware.ts
    /lib                              # Server utilities
      /auth-utils.ts
      /simulation-utils.ts
      /email-utils.ts
      /logger.ts
    /config                           # Configuration
      /database.config.ts
      /openai.config.ts
      /auth.config.ts
    /scripts                          # Admin/seed scripts
    package.json                      # Backend dependencies
    tsconfig.json                     # TypeScript config

/shared
  /types                              # Shared TypeScript types
    /user.types.ts
    /simulation.types.ts
    /competency.types.ts
    /parameter.types.ts
    /api.types.ts                     # API request/response types
    /common.types.ts
  /constants                          # Shared constants
    /roles.ts
    /difficulty-levels.ts
    /industries.ts
  /utils                              # Shared utilities
    /validation.ts
    /formatters.ts
  package.json                        # Shared dependencies

/data                                 # Static JSON configuration
  /competencies.json
  /rubrics.json
  /industry-competencies.json
  /industry-metadata.json
  /difficulty-settings.json
  /difficulty-metadata.json

/docs                                 # Documentation
  /api                                # API documentation
  /architecture                       # Architecture docs
```

### 4.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (/simulator/frontend)            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Hooks      │      │
│  │   (Next.js)  │  │  (React UI)  │  │  (Custom)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Context    │  │   Stores     │  │   Client     │      │
│  │  (Providers) │  │  (Zustand)   │  │   Utils      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│                     API Client Layer                         │
│                  (HTTP requests to backend)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (/simulator/backend)              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Route Handlers                      │   │
│  │  /auth  /users  /simulation  /parameters  /admin    │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Business Logic Services                 │   │
│  │  AuthService  SimulationService  AIService  etc.     │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Database Access Layer (Repositories)      │   │
│  │  UserRepo  ParameterRepo  CompetencyRepo  etc.       │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   PostgreSQL DB   │
                    │   (Neon/Vercel)   │
                    └──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   OpenAI API     │
                    │   (GPT-4o)       │
                    └──────────────────┘
```

### 4.3 Communication Pattern

```
Frontend → Backend: HTTP REST API calls
Backend → Database: SQL queries via Neon/Vercel Postgres SDK
Backend → OpenAI: HTTPS API calls
Backend → Frontend: JSON responses

Shared Types: Imported from /shared/types by both frontend and backend
```

---

## 5. Frontend Module Organization

### 5.1 Frontend Directory Structure

```
/simulator/frontend
├── /app                              # Next.js App Router pages
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page (redirects to login)
│   ├── /account                      # Account management pages
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── /edit
│   │   ├── /change-password
│   │   └── /settings
│   ├── /admin                        # Admin dashboard pages
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── /user-management
│   │   ├── /global-settings
│   │   ├── /api-settings
│   │   ├── /parameter-catalog
│   │   ├── /industry-settings
│   │   ├── /competencies
│   │   ├── /diagnostics
│   │   ├── /feedback
│   │   ├── /engagement
│   │   ├── /seed-data
│   │   ├── /fusion-model
│   │   └── /tooltip-test
│   ├── /dashboard                    # User dashboard
│   │   └── page.tsx
│   ├── /login                        # Authentication pages
│   │   └── page.tsx
│   ├── /signup
│   │   └── page.tsx
│   ├── /logout
│   │   └── page.tsx
│   ├── /parameters                   # Parameter reference page
│   │   └── page.tsx
│   ├── /profile-generator            # Profile generation tool
│   │   └── page.tsx
│   ├── /simulation                   # Simulation journey pages
│   │   ├── layout.tsx
│   │   ├── /industry-selection
│   │   ├── /setup
│   │   ├── /session
│   │   ├── /review
│   │   ├── /history
│   │   │   └── /[id]
│   │   └── /attestation
│   └── /student-dashboard            # Student-specific dashboard
│       └── page.tsx
│
├── /components                       # React components
│   ├── /auth                         # Authentication components
│   │   ├── auth-provider.tsx
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── protected-page.tsx
│   │   ├── protected-route.tsx
│   │   └── logout-button.tsx
│   ├── /layout                       # Layout components
│   │   ├── nav-bar.tsx
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── /user                         # User components
│   │   ├── user-account-menu.tsx
│   │   ├── user-info.tsx
│   │   └── user-table.tsx
│   ├── /dashboard                    # Dashboard components
│   │   ├── nps-participation-card.tsx
│   │   ├── nps-trend-chart.tsx
│   │   ├── detractor-reasons-chart.tsx
│   │   ├── insights-summary.tsx
│   │   ├── insight-alerts.tsx
│   │   ├── feedback-submissions.tsx
│   │   ├── simulation-type-breakdown.tsx
│   │   ├── time-to-submit-card.tsx
│   │   └── export-data-button.tsx
│   ├── /parameter-catalog            # Parameter management
│   │   ├── parameter-catalog.tsx
│   │   ├── parameter-form.tsx
│   │   ├── parameter-table.tsx
│   │   ├── parameter-card.tsx
│   │   ├── category-manager.tsx
│   │   ├── add-parameter.tsx
│   │   ├── structured-parameters.tsx
│   │   ├── structured-parameters-manager.tsx
│   │   ├── narrative-parameters.tsx
│   │   ├── narrative-parameters-manager.tsx
│   │   ├── guardrails-parameters.tsx
│   │   ├── guardrails-parameters-manager.tsx
│   │   └── reset-parameter-catalog.tsx
│   ├── /simulation                   # Simulation components
│   │   ├── competency-card.tsx
│   │   ├── conversation-tab.tsx
│   │   ├── review-tab.tsx
│   │   └── conversation-analysis.tsx
│   ├── /admin                        # Admin components
│   │   ├── bulk-import-dialog.tsx
│   │   ├── csv-template-download.tsx
│   │   └── /competencies
│   │       ├── AddCompetencyModal.tsx
│   │       └── EditCompetencyModal.tsx
│   ├── /common                       # Common components
│   │   ├── data-table.tsx
│   │   ├── mode-toggle.tsx
│   │   ├── theme-provider.tsx
│   │   ├── student-dashboard.tsx
│   │   ├── consent-manager-ui.tsx
│   │   ├── nps-feedback.tsx
│   │   ├── dev-role-switcher.tsx
│   │   └── draggable-controls.tsx
│   ├── /debug                        # Debug components
│   │   ├── performance-monitor-panel.tsx
│   │   └── emotional-state-panel.tsx
│   └── /ui                           # UI library (Radix-based)
│       ├── button.tsx
│       ├── input.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── toast.tsx
│       ├── accordion.tsx
│       ├── tabs.tsx
│       ├── dropdown-menu.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── slider.tsx
│       ├── progress.tsx
│       ├── badge.tsx
│       ├── alert.tsx
│       ├── card.tsx
│       ├── separator.tsx
│       ├── checkbox.tsx
│       ├── radio-group.tsx
│       ├── toggle.tsx
│       ├── switch.tsx
│       ├── textarea.tsx
│       ├── calendar.tsx
│       ├── date-picker.tsx
│       ├── breadcrumb.tsx
│       ├── carousel.tsx
│       ├── pagination.tsx
│       ├── sheet.tsx
│       ├── navigation-menu.tsx
│       ├── context-menu.tsx
│       ├── menubar.tsx
│       ├── collapsible.tsx
│       ├── tooltip.tsx
│       ├── hover-card.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       └── scroll-area.tsx
│
├── /hooks                            # Custom React hooks
│   ├── use-parameters.ts
│   ├── use-parameter-categories.ts
│   ├── use-toast.ts
│   └── use-mobile.tsx
│
├── /context                          # React Context providers
│   └── interface-mode-context.tsx
│
├── /store                            # Client-side state management
│   └── parameter-catalog-store.ts
│
├── /lib                              # Frontend utilities
│   ├── api-client.ts                 # NEW: API client for backend calls
│   ├── utils.ts                      # cn() helper, general utils
│   └── /api                          # NEW: API endpoint wrappers
│       ├── auth-api.ts
│       ├── users-api.ts
│       ├── simulation-api.ts
│       ├── parameters-api.ts
│       ├── competencies-api.ts
│       ├── fusion-model-api.ts
│       └── feedback-api.ts
│
├── /styles                           # Stylesheets
│   └── globals.css
│
├── /public                           # Static assets
│   └── images/
│
├── package.json                      # Frontend dependencies
├── next.config.js                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind configuration
├── postcss.config.mjs                # PostCSS configuration
└── components.json                   # shadcn/ui configuration
```

### 5.2 Frontend Modules

#### 5.2.1 Pages Module
**Location:** `/simulator/frontend/app`
**Purpose:** Next.js App Router pages and layouts
**Files:** All `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` files
**Responsibilities:**
- Render UI pages
- Handle client-side routing
- Fetch data from backend via API client
- Manage page-level state
- Handle user interactions

#### 5.2.2 Components Module
**Location:** `/simulator/frontend/components`
**Purpose:** Reusable React components
**Submodules:**
- **Auth Components**: Login, signup, authentication UI
- **Layout Components**: Navigation, headers, sidebars
- **User Components**: User-related UI elements
- **Dashboard Components**: Analytics and metrics visualization
- **Parameter Catalog**: Parameter management UI
- **Simulation Components**: Simulation-specific UI
- **Admin Components**: Admin panel components
- **Common Components**: Shared UI elements
- **Debug Components**: Development/debugging tools
- **UI Library**: Low-level Radix-UI wrapped components

#### 5.2.3 Hooks Module
**Location:** `/simulator/frontend/hooks`
**Purpose:** Custom React hooks
**Files:**
- `use-parameters.ts` - Fetch and cache parameters
- `use-parameter-categories.ts` - Category management
- `use-toast.ts` - Toast notifications
- `use-mobile.tsx` - Responsive design helper

#### 5.2.4 Context Module
**Location:** `/simulator/frontend/context`
**Purpose:** React Context providers for global state
**Files:**
- `interface-mode-context.tsx` - User interface mode (student/admin/advisor)

#### 5.2.5 Store Module
**Location:** `/simulator/frontend/store`
**Purpose:** Client-side state management (Zustand)
**Files:**
- `parameter-catalog-store.ts` - Parameter catalog state

#### 5.2.6 API Client Module (NEW)
**Location:** `/simulator/frontend/lib/api-client.ts`
**Purpose:** HTTP client for backend API calls
**Responsibilities:**
- Make HTTP requests to backend
- Handle authentication tokens
- Handle response parsing and errors
- Provide typed API methods

**Example Structure:**
```typescript
// /simulator/frontend/lib/api-client.ts
import type { ApiResponse } from '@/shared/types/api.types';

class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  async get<T>(endpoint: string): Promise<ApiResponse<T>> { }
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> { }
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> { }
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> { }
}

export const apiClient = new ApiClient();
```

#### 5.2.7 API Wrapper Module (NEW)
**Location:** `/simulator/frontend/lib/api/`
**Purpose:** Typed API endpoint wrappers
**Files:**
- `auth-api.ts` - Authentication endpoints
- `users-api.ts` - User management endpoints
- `simulation-api.ts` - Simulation endpoints
- `parameters-api.ts` - Parameter management endpoints
- `competencies-api.ts` - Competency endpoints
- `fusion-model-api.ts` - Fusion model endpoints
- `feedback-api.ts` - Feedback endpoints

**Example:**
```typescript
// /simulator/frontend/lib/api/auth-api.ts
import { apiClient } from '../api-client';
import type { LoginRequest, LoginResponse } from '@/shared/types/api.types';

export const authApi = {
  login: (credentials: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', credentials),

  logout: () =>
    apiClient.post('/auth/logout', {}),

  checkSession: () =>
    apiClient.get('/auth/check-session'),
};
```

### 5.3 Frontend Dependencies

**Package.json highlights:**
- Next.js 15.2.4
- React 19
- React DOM 19
- Radix-UI components
- Tailwind CSS
- React Hook Form
- Zustand
- SWR
- Recharts
- Lucide React
- date-fns
- zod

---

## 6. Backend Module Organization

### 6.1 Backend Directory Structure

```
/simulator/backend
├── /api                              # API route handlers (controllers)
│   ├── /auth
│   │   ├── login.ts                  # POST /api/auth/login
│   │   ├── register.ts               # POST /api/auth/register
│   │   ├── logout.ts                 # POST /api/auth/logout
│   │   ├── check-session.ts          # GET /api/auth/check-session
│   │   ├── check-auth.ts             # GET /api/auth/check-auth
│   │   └── change-password.ts        # POST /api/auth/change-password
│   ├── /users
│   │   ├── index.ts                  # GET /api/users (list), POST /api/users (create)
│   │   ├── [id].ts                   # GET/PUT/DELETE /api/users/:id
│   │   ├── bulk.ts                   # POST /api/users/bulk
│   │   └── bulk-import.ts            # POST /api/users/bulk-import
│   ├── /simulation
│   │   ├── generate-review.ts        # POST /api/simulation/generate-review
│   │   ├── data-store.ts             # GET/POST /api/simulation/data-store
│   │   ├── actions.ts                # Simulation actions
│   │   └── profile-connector.ts      # Profile management
│   ├── /parameters
│   │   ├── index.ts                  # GET/POST /api/parameters
│   │   ├── [id].ts                   # GET /api/parameters/:id
│   │   ├── reset.ts                  # POST /api/parameters/reset
│   │   └── /categories
│   │       ├── index.ts              # GET/POST /api/parameters/categories
│   │       └── [id].ts               # GET /api/parameters/categories/:id
│   ├── /parameter-catalog
│   │   └── reset.ts                  # POST /api/parameter-catalog/reset
│   ├── /competencies
│   │   ├── index.ts                  # GET /api/competencies
│   │   └── industry.ts               # GET /api/competencies/industry
│   ├── /rubric-entry
│   │   └── index.ts                  # POST /api/rubric-entry
│   ├── /personality
│   │   ├── [type].ts                 # GET /api/personality/:type
│   │   ├── [type]/[id].ts            # GET /api/personality/:type/:id
│   │   └── /core-traits
│   │       ├── index.ts              # GET /api/personality/core-traits
│   │       └── [id].ts               # POST /api/personality/core-traits/:id
│   ├── /profile-pregeneration
│   │   └── index.ts                  # POST /api/profile-pregeneration
│   ├── /fusion-model
│   │   ├── /core-traits
│   │   ├── /archetypes
│   │   ├── /moods
│   │   ├── /communication-styles
│   │   ├── /quirks
│   │   └── /configs
│   │       ├── index.ts              # GET/POST /api/fusion-model/configs
│   │       └── [id].ts               # GET/POST /api/fusion-model/configs/:id
│   ├── /feedback
│   │   └── nps.ts                    # POST /api/feedback/nps
│   ├── /engagement
│   │   ├── log.ts                    # GET /api/engagement/log
│   │   └── score.ts                  # POST /api/engagement/score
│   ├── /admin
│   │   ├── seed-data.ts              # POST /api/admin/seed-data
│   │   └── test-difficulty.ts        # POST /api/test-difficulty
│   ├── /industry-settings
│   │   └── index.ts                  # GET /api/industry-settings
│   ├── /difficulty
│   │   └── actions.ts                # POST /api/difficulty/actions
│   └── /test-db
│       └── index.ts                  # GET /api/test-db
│
├── /services                         # Business logic layer
│   ├── auth-service.ts               # Authentication business logic
│   ├── user-service.ts               # User management logic
│   ├── simulation-service.ts         # Simulation engine logic
│   ├── ai-service.ts                 # OpenAI integration service
│   ├── profile-generation-service.ts # Client profile generation
│   ├── parameter-service.ts          # Parameter management
│   ├── competency-service.ts         # Competency management
│   ├── rubric-service.ts             # Rubric application
│   ├── fusion-model-service.ts       # Fusion model logic
│   ├── engagement-service.ts         # Engagement tracking
│   ├── feedback-service.ts           # Feedback processing
│   └── email-service.ts              # Email notifications
│
├── /db                               # Database access layer
│   ├── connection.ts                 # Database connection setup
│   └── /repositories                 # Data access patterns
│       ├── user-repository.ts
│       ├── session-repository.ts
│       ├── parameter-repository.ts
│       ├── competency-repository.ts
│       ├── simulation-repository.ts
│       ├── rubric-repository.ts
│       ├── feedback-repository.ts
│       └── engagement-repository.ts
│
├── /models                           # Data models & validation schemas
│   ├── user.model.ts
│   ├── simulation.model.ts
│   ├── competency.model.ts
│   ├── parameter.model.ts
│   ├── fusion-model.model.ts
│   └── feedback.model.ts
│
├── /middleware                       # Middleware functions
│   ├── auth-middleware.ts            # Authentication check
│   ├── error-handler.ts              # Error handling
│   └── validation-middleware.ts      # Request validation
│
├── /lib                              # Server utilities
│   ├── auth-utils.ts                 # Auth helpers
│   ├── simulation-utils.ts           # Simulation helpers
│   ├── difficulty-utils.ts           # Difficulty level helpers
│   ├── email-utils.ts                # Email helpers
│   ├── logger.ts                     # Logging utility
│   ├── performance-monitor.ts        # Performance monitoring
│   ├── pii-detector.ts               # PII detection
│   ├── consent-manager.ts            # Consent management
│   ├── engagement-scorer.ts          # Engagement scoring
│   └── engagement-tracker.ts         # Engagement tracking
│
├── /config                           # Configuration
│   ├── database.config.ts            # Database configuration
│   ├── openai.config.ts              # OpenAI API configuration
│   ├── auth.config.ts                # Auth configuration
│   └── environment.ts                # Environment variables
│
├── /scripts                          # Database and admin scripts
│   ├── seed-db.ts                    # Database seeding
│   ├── run-seed-parameter-catalog.ts # Parameter catalog seeding
│   └── seed-parameter-catalog.ts     # Parameter catalog data
│
├── /profile-generator                # AI profile generation system
│   ├── emotional-state-model.ts      # Emotional state tracking
│   ├── emotional-state-store.ts      # Emotional state persistence
│   ├── emotional-memory-engine.ts    # Memory tracking
│   ├── conversation-state-tracker.ts # Conversation context
│   ├── dynamic-prompt-injector.ts    # Prompt injection
│   ├── trait-behavior-mapping.ts     # Trait-to-behavior mapping
│   ├── fusion-prompt-builder.ts      # AI prompt construction
│   ├── quirks-taxonomy.ts            # Quirk system
│   └── chat-actions.ts               # Chat handlers
│
├── package.json                      # Backend dependencies
├── tsconfig.json                     # TypeScript configuration
└── .env                              # Environment variables (not committed)
```

### 6.2 Backend Modules

#### 6.2.1 API Routes Module
**Location:** `/simulator/backend/api`
**Purpose:** HTTP endpoint handlers (controllers)
**Responsibilities:**
- Receive HTTP requests
- Validate request data (using middleware)
- Call appropriate service methods
- Return HTTP responses
- Handle errors

**Pattern:**
```typescript
// /simulator/backend/api/users/index.ts
import { userService } from '../../services/user-service';
import { authMiddleware } from '../../middleware/auth-middleware';

export async function GET(request: Request) {
  // Apply auth middleware
  const user = await authMiddleware(request);

  // Call service layer
  const users = await userService.getAllUsers();

  // Return response
  return Response.json({ success: true, data: users });
}
```

#### 6.2.2 Services Module
**Location:** `/simulator/backend/services`
**Purpose:** Business logic layer
**Responsibilities:**
- Implement business rules
- Coordinate between repositories
- Call external APIs (OpenAI, email, etc.)
- Handle complex workflows
- Transform data

**Files:**
- `auth-service.ts` - Login, logout, token management
- `user-service.ts` - User CRUD, bulk operations
- `simulation-service.ts` - Simulation execution, review generation
- `ai-service.ts` - OpenAI API calls, prompt management
- `profile-generation-service.ts` - Client profile generation
- `parameter-service.ts` - Parameter management
- `competency-service.ts` - Competency management
- `rubric-service.ts` - Rubric scoring logic
- `fusion-model-service.ts` - AI model configuration
- `engagement-service.ts` - Engagement tracking and scoring
- `feedback-service.ts` - Feedback collection and analysis
- `email-service.ts` - Email sending (nodemailer)

#### 6.2.3 Database Repositories Module
**Location:** `/simulator/backend/db/repositories`
**Purpose:** Data access layer
**Responsibilities:**
- Execute SQL queries
- Map database rows to models
- Handle database transactions
- Provide CRUD operations

**Files:**
- `user-repository.ts` - User table operations
- `session-repository.ts` - Session management
- `parameter-repository.ts` - Parameter CRUD
- `competency-repository.ts` - Competency data access
- `simulation-repository.ts` - Simulation session storage
- `rubric-repository.ts` - Rubric data access
- `feedback-repository.ts` - Feedback storage
- `engagement-repository.ts` - Engagement event logging

**Pattern:**
```typescript
// /simulator/backend/db/repositories/user-repository.ts
import { sql } from '../connection';
import type { User } from '@/shared/types/user.types';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`;
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    return result.rows[0] || null;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const result = await sql`
      INSERT INTO users (email, name, password, role)
      VALUES (${user.email}, ${user.name}, ${user.password}, ${user.role})
      RETURNING *
    `;
    return result.rows[0];
  }

  async findAll(): Promise<User[]> {
    const result = await sql`SELECT * FROM users`;
    return result.rows;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // Update logic
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM users WHERE id = ${id}`;
  }
}

export const userRepository = new UserRepository();
```

#### 6.2.4 Models Module
**Location:** `/simulator/backend/models`
**Purpose:** Data models and Zod validation schemas
**Responsibilities:**
- Define data structures
- Provide validation schemas
- Type definitions for database entities

**Files:**
- `user.model.ts` - User entity model
- `simulation.model.ts` - Simulation session model
- `competency.model.ts` - Competency model
- `parameter.model.ts` - Parameter model
- `fusion-model.model.ts` - Fusion model config
- `feedback.model.ts` - Feedback model

#### 6.2.5 Middleware Module
**Location:** `/simulator/backend/middleware`
**Purpose:** Request/response middleware
**Files:**
- `auth-middleware.ts` - Authentication verification
- `error-handler.ts` - Global error handling
- `validation-middleware.ts` - Request validation

#### 6.2.6 Utilities Module
**Location:** `/simulator/backend/lib`
**Purpose:** Server-side utility functions
**Files:**
- `auth-utils.ts` - Token generation, password hashing
- `simulation-utils.ts` - Simulation helpers
- `difficulty-utils.ts` - Difficulty calculations
- `email-utils.ts` - Email formatting
- `logger.ts` - Logging functionality
- `performance-monitor.ts` - Performance tracking
- `pii-detector.ts` - PII detection
- `consent-manager.ts` - Consent handling
- `engagement-scorer.ts` - Engagement score calculation
- `engagement-tracker.ts` - Event tracking

#### 6.2.7 Configuration Module
**Location:** `/simulator/backend/config`
**Purpose:** Configuration management
**Files:**
- `database.config.ts` - Database connection config
- `openai.config.ts` - OpenAI API configuration
- `auth.config.ts` - Authentication configuration
- `environment.ts` - Environment variable management

#### 6.2.8 Profile Generator Module
**Location:** `/simulator/backend/profile-generator`
**Purpose:** AI-powered client profile generation
**Files:**
- `emotional-state-model.ts` - Track AI emotional states
- `emotional-state-store.ts` - Persist emotional data
- `emotional-memory-engine.ts` - Memory system
- `conversation-state-tracker.ts` - Track conversation
- `dynamic-prompt-injector.ts` - Inject context into prompts
- `trait-behavior-mapping.ts` - Map personality traits to behaviors
- `fusion-prompt-builder.ts` - Build AI instruction prompts
- `quirks-taxonomy.ts` - Client quirk system
- `chat-actions.ts` - Chat interaction handlers

#### 6.2.9 Scripts Module
**Location:** `/simulator/backend/scripts`
**Purpose:** Database seeding and admin scripts
**Files:**
- `seed-db.ts` - Main database seeding script
- `run-seed-parameter-catalog.ts` - Run parameter catalog seed
- `seed-parameter-catalog.ts` - Parameter catalog seed data

### 6.3 Backend Dependencies

**Package.json highlights:**
- @neondatabase/serverless
- @vercel/postgres
- next-auth
- bcryptjs
- openai
- nodemailer
- zod
- uuid
- csv-parse

---

## 7. Shared Module Organization

### 7.1 Shared Directory Structure

```
/shared
├── /types                            # Shared TypeScript types
│   ├── user.types.ts                 # User-related types
│   ├── simulation.types.ts           # Simulation types
│   ├── competency.types.ts           # Competency types
│   ├── parameter.types.ts            # Parameter types
│   ├── fusion-model.types.ts         # Fusion model types
│   ├── feedback.types.ts             # Feedback types
│   ├── engagement.types.ts           # Engagement types
│   ├── personality.types.ts          # Personality types
│   ├── api.types.ts                  # API request/response types
│   ├── common.types.ts               # Common utility types
│   └── index.ts                      # Re-export all types
│
├── /constants                        # Shared constants
│   ├── roles.ts                      # User roles
│   ├── difficulty-levels.ts          # Difficulty constants
│   ├── industries.ts                 # Industry constants
│   ├── competency-categories.ts      # Competency categories
│   └── index.ts                      # Re-export all constants
│
├── /utils                            # Shared utility functions
│   ├── validation.ts                 # Validation helpers
│   ├── formatters.ts                 # Data formatters
│   └── index.ts                      # Re-export all utils
│
├── package.json                      # Shared dependencies (minimal)
└── tsconfig.json                     # TypeScript configuration
```

### 7.2 Shared Modules

#### 7.2.1 Types Module
**Location:** `/shared/types`
**Purpose:** Shared TypeScript type definitions
**Migrated From:** `/types/**`

**Files:**

**user.types.ts**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  job_role?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type UserRole = 'admin' | 'user' | 'advisor';

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  job_role?: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  role?: UserRole;
  job_role?: string;
}
```

**simulation.types.ts**
```typescript
export interface ClientProfile {
  personalInfo: PersonalInfo;
  financialInfo: FinancialInfo;
  goals: string[];
  concerns: string[];
  riskTolerance: RiskTolerance;
  background: string;
}

export interface SimulationSession {
  id: string;
  user_id: string;
  client_profile: ClientProfile;
  difficulty_level: DifficultyLevel;
  industry: string;
  started_at: Date;
  completed_at?: Date;
  score?: number;
  review?: SimulationReview;
}

export interface SimulationObjective {
  id: string;
  description: string;
  achieved: boolean;
  timestamp?: Date;
}

export interface PersonalitySettings {
  archetypes: string[];
  moods: string[];
  communicationStyles: string[];
  coreTraits: Record<string, number>;
  quirks: QuirkSettings;
}

// ... more simulation types
```

**competency.types.ts**
```typescript
export interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number;
}

export interface CompetencyWithRubrics extends Competency {
  rubrics: RubricEntry[];
}

export interface RubricEntry {
  id: string;
  competency_id: string;
  difficulty_level: DifficultyLevel;
  score_range: string;
  criteria: string;
  examples: string[];
}
```

**parameter.types.ts**
```typescript
export interface Parameter {
  id: string;
  name: string;
  type: ParameterType;
  category_id: string;
  value: any;
  description?: string;
  metadata?: Record<string, any>;
}

export type ParameterType = 'structured' | 'narrative' | 'guardrails';

export interface ParameterCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
}
```

**api.types.ts** (NEW)
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// User API types
export interface GetUsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

// ... more API types
```

**common.types.ts**
```typescript
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}
```

#### 7.2.2 Constants Module
**Location:** `/shared/constants`
**Purpose:** Shared constant values

**roles.ts**
```typescript
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  ADVISOR: 'advisor',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['all'],
  [USER_ROLES.USER]: ['read', 'create'],
  [USER_ROLES.ADVISOR]: ['read', 'create', 'update'],
} as const;
```

**difficulty-levels.ts**
```typescript
export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

export const DIFFICULTY_LABELS = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Master',
} as const;
```

**industries.ts**
```typescript
export const INDUSTRIES = [
  'wealth-management',
  'banking',
  'insurance',
  'financial-planning',
] as const;

export const INDUSTRY_LABELS = {
  'wealth-management': 'Wealth Management',
  'banking': 'Banking',
  'insurance': 'Insurance',
  'financial-planning': 'Financial Planning',
} as const;
```

#### 7.2.3 Utils Module
**Location:** `/shared/utils`
**Purpose:** Shared utility functions

**validation.ts**
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
```

**formatters.ts**
```typescript
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
```

### 7.3 Shared Dependencies

**Package.json:**
```json
{
  "name": "@simulator/shared",
  "version": "1.0.0",
  "dependencies": {
    "zod": "latest"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

---

## 8. Refactoring Requirements

### 8.1 Additional Code Required

The following NEW code must be created for the refactoring:

#### 8.1.1 API Client (Frontend)
**File:** `/simulator/frontend/lib/api-client.ts`
**Purpose:** HTTP client for backend communication
**Lines of Code:** ~150 lines

**Required functionality:**
- HTTP methods (GET, POST, PUT, DELETE)
- Request/response interceptors
- Error handling
- Authentication token management
- Base URL configuration

#### 8.1.2 API Wrapper Functions (Frontend)
**Files:** `/simulator/frontend/lib/api/*.ts`
**Purpose:** Typed API endpoint wrappers
**Lines of Code:** ~500 lines total (across all files)

**Required files:**
- `auth-api.ts`
- `users-api.ts`
- `simulation-api.ts`
- `parameters-api.ts`
- `competencies-api.ts`
- `fusion-model-api.ts`
- `feedback-api.ts`

#### 8.1.3 Database Connection (Backend)
**File:** `/simulator/backend/db/connection.ts`
**Purpose:** Centralized database connection
**Lines of Code:** ~50 lines

**Required functionality:**
- Export configured `sql` client from @neondatabase/serverless
- Environment variable management

#### 8.1.4 Repository Classes (Backend)
**Files:** `/simulator/backend/db/repositories/*.ts`
**Purpose:** Data access layer abstraction
**Lines of Code:** ~1000 lines total (across all repositories)

**Required files:**
- `user-repository.ts`
- `session-repository.ts`
- `parameter-repository.ts`
- `competency-repository.ts`
- `simulation-repository.ts`
- `rubric-repository.ts`
- `feedback-repository.ts`
- `engagement-repository.ts`

#### 8.1.5 Service Classes (Backend)
**Files:** `/simulator/backend/services/*.ts`
**Purpose:** Business logic extraction
**Lines of Code:** ~2000 lines total (extracted from existing API routes)

**Required files:**
- `auth-service.ts`
- `user-service.ts`
- `simulation-service.ts`
- `ai-service.ts`
- `profile-generation-service.ts`
- `parameter-service.ts`
- `competency-service.ts`
- `rubric-service.ts`
- `fusion-model-service.ts`
- `engagement-service.ts`
- `feedback-service.ts`
- `email-service.ts`

#### 8.1.6 Middleware Functions (Backend)
**Files:** `/simulator/backend/middleware/*.ts`
**Purpose:** Request processing middleware
**Lines of Code:** ~200 lines total

**Required files:**
- `auth-middleware.ts` - Extract from existing auth checks
- `error-handler.ts` - Centralized error handling
- `validation-middleware.ts` - Request validation

#### 8.1.7 Configuration Files (Backend)
**Files:** `/simulator/backend/config/*.ts`
**Purpose:** Configuration management
**Lines of Code:** ~150 lines total

**Required files:**
- `database.config.ts`
- `openai.config.ts`
- `auth.config.ts`
- `environment.ts`

#### 8.1.8 Shared Type Definitions
**Files:** `/shared/types/*.ts`
**Purpose:** Shared types between frontend and backend
**Lines of Code:** ~500 lines (mostly migration from existing `/types`)

**New file required:**
- `api.types.ts` - API request/response types (~200 lines)

#### 8.1.9 Package Configuration Files
**Files:**
- `/simulator/frontend/package.json`
- `/simulator/backend/package.json`
- `/shared/package.json`

**Purpose:** Dependency management for each module

### 8.2 Total Additional Code Estimate

| Module | New Code | Migrated Code | Total |
|--------|----------|---------------|-------|
| API Client (Frontend) | 150 lines | 0 | 150 lines |
| API Wrappers (Frontend) | 500 lines | 0 | 500 lines |
| Database Connection (Backend) | 50 lines | 0 | 50 lines |
| Repositories (Backend) | 1000 lines | 0 | 1000 lines |
| Services (Backend) | 500 lines | 1500 lines | 2000 lines |
| Middleware (Backend) | 200 lines | 0 | 200 lines |
| Config (Backend) | 150 lines | 0 | 150 lines |
| Shared Types | 200 lines | 300 lines | 500 lines |
| Package configs | 100 lines | 0 | 100 lines |
| **TOTAL** | **2850 lines** | **1800 lines** | **4650 lines** |

**Analysis:**
- ~61% is new infrastructure code (2850 lines)
- ~39% is refactored/migrated code (1800 lines)
- Total additional code: ~4650 lines
- This represents ~15% of the existing codebase (estimated at ~30,000 lines)

### 8.3 Code Movement Summary

| Current Location | Files | New Location |
|------------------|-------|--------------|
| `/app/**/page.tsx` | 40+ pages | `/simulator/frontend/app/**/page.tsx` |
| `/app/api/**` | 60+ API routes | `/simulator/backend/api/**` |
| `/components/**` | 100+ components | `/simulator/frontend/components/**` |
| `/hooks/**` | 4 hooks | `/simulator/frontend/hooks/**` |
| `/context/**` | 2 contexts | `/simulator/frontend/context/**` |
| `/store/**` | 2 stores | `/simulator/frontend/store/**` |
| `/types/**` | 20+ type files | `/shared/types/**` |
| `/lib/db.ts` | 1 file | `/simulator/backend/db/connection.ts` |
| `/lib/*-db.ts` | 5 files | `/simulator/backend/db/repositories/**` |
| `/lib/*-service.ts` | 3 files | `/simulator/backend/services/**` |
| `/lib/*-utils.ts` | 10 files | `/simulator/backend/lib/**` (server) or `/simulator/frontend/lib/**` (client) |
| `/utils/**` | 8 files | `/simulator/frontend/lib/**` or `/shared/utils/**` |
| `/scripts/**` | 3 files | `/simulator/backend/scripts/**` |
| `/app/profile-generator/**` (logic) | 10 files | `/simulator/backend/profile-generator/**` |
| `/data/**` | JSON files | `/data/**` (stays at root) |

---

## 9. Module Dependencies

### 9.1 Dependency Graph

```
┌─────────────────┐
│   Data Files    │
│  (JSON configs) │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Shared    │   │   Backend   │   │  Frontend   │
│   Types     │◄──┤   Models    │   │   Pages     │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       │                 ▼                 │
       │          ┌─────────────┐          │
       └─────────►│  Backend    │◄─────────┘
                  │ Repositories│
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Backend    │
                  │  Services   │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Backend    │
                  │ API Routes  │
                  └──────┬──────┘
                         │
                         │ HTTP/REST
                         │
                         ▼
                  ┌─────────────┐
                  │  Frontend   │
                  │ API Client  │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Frontend   │
                  │ Components  │
                  └─────────────┘
```

### 9.2 Module Import Rules

#### Frontend Modules Can Import:
- ✅ `/shared/types/**`
- ✅ `/shared/constants/**`
- ✅ `/shared/utils/**`
- ✅ Other frontend modules
- ✅ `/data/**` (JSON files)
- ❌ **NEVER** backend modules

#### Backend Modules Can Import:
- ✅ `/shared/types/**`
- ✅ `/shared/constants/**`
- ✅ `/shared/utils/**`
- ✅ Other backend modules
- ✅ `/data/**` (JSON files)
- ❌ **NEVER** frontend modules

#### Shared Modules Can Import:
- ✅ Other shared modules
- ❌ **NEVER** frontend modules
- ❌ **NEVER** backend modules
- ❌ **NEVER** data files

### 9.3 Import Path Aliases

**Frontend tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/store/*": ["./store/*"],
      "@/context/*": ["./context/*"],
      "@/shared/*": ["../../shared/*"],
      "@/data/*": ["../../data/*"]
    }
  }
}
```

**Backend tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/api/*": ["./api/*"],
      "@/services/*": ["./services/*"],
      "@/db/*": ["./db/*"],
      "@/models/*": ["./models/*"],
      "@/lib/*": ["./lib/*"],
      "@/config/*": ["./config/*"],
      "@/shared/*": ["../../shared/*"],
      "@/data/*": ["../../data/*"]
    }
  }
}
```

### 9.4 Circular Dependency Prevention

**Rules:**
1. API routes can call services, but services cannot call API routes
2. Services can call repositories, but repositories cannot call services
3. Repositories can call models, but models cannot call repositories
4. Frontend can call API client, but API client cannot import frontend components
5. Shared modules cannot import frontend or backend modules

---

## 10. Migration Strategy

### 10.1 Migration Phases

#### Phase 1: Preparation
**Duration:** Planning phase
**Tasks:**
1. Create new directory structure (`/simulator/frontend`, `/simulator/backend`, `/shared`)
2. Set up package.json files for each module
3. Configure TypeScript for each module
4. Create empty placeholder files

#### Phase 2: Shared Module Migration
**Duration:** Low effort
**Tasks:**
1. Copy `/types/**` to `/shared/types/**`
2. Create `/shared/types/api.types.ts` for API contracts
3. Create `/shared/constants/**` for shared constants
4. Extract shared utilities to `/shared/utils/**`
5. Update import paths

**Validation:**
- All shared types are accessible from both frontend and backend
- No circular dependencies

#### Phase 3: Backend Infrastructure Setup
**Duration:** Medium effort
**Tasks:**
1. Create `/simulator/backend/db/connection.ts`
2. Create repository classes in `/simulator/backend/db/repositories/**`
3. Create service classes in `/simulator/backend/services/**`
4. Create middleware in `/simulator/backend/middleware/**`
5. Create config files in `/simulator/backend/config/**`

**Validation:**
- Database connection works
- Repository methods can execute queries
- Services can call repositories

#### Phase 4: Backend API Migration
**Duration:** High effort
**Tasks:**
1. Migrate API routes from `/app/api/**` to `/simulator/backend/api/**`
2. Extract business logic from API routes into services
3. Extract database queries into repositories
4. Update API routes to use new service layer
5. Move profile-generator logic to backend
6. Move scripts to backend

**Validation:**
- All API endpoints respond correctly
- Authentication works
- Database operations succeed

#### Phase 5: Frontend Infrastructure Setup
**Duration:** Medium effort
**Tasks:**
1. Create API client in `/simulator/frontend/lib/api-client.ts`
2. Create API wrapper functions in `/simulator/frontend/lib/api/**`
3. Update frontend dependencies

**Validation:**
- API client can make requests to backend
- API wrappers provide typed interfaces

#### Phase 6: Frontend Migration
**Duration:** High effort
**Tasks:**
1. Copy all pages from `/app/**` to `/simulator/frontend/app/**`
2. Copy all components from `/components/**` to `/simulator/frontend/components/**`
3. Copy hooks from `/hooks/**` to `/simulator/frontend/hooks/**`
4. Copy contexts from `/context/**` to `/simulator/frontend/context/**`
5. Copy stores from `/store/**` to `/simulator/frontend/store/**`
6. Update all imports to use new paths
7. Replace direct API route calls with API client calls

**Validation:**
- All pages render correctly
- All components work
- All API calls succeed
- Authentication flows work

#### Phase 7: Testing & Validation
**Duration:** Medium effort
**Tasks:**
1. Test all user flows (login, signup, simulation, admin)
2. Test all API endpoints
3. Test authentication and authorization
4. Test database operations
5. Verify no broken imports
6. Check for circular dependencies

**Validation:**
- All features work as before
- No console errors
- No broken links
- All API calls succeed

#### Phase 8: Cleanup
**Duration:** Low effort
**Tasks:**
1. Remove old code from root `/app` directory
2. Remove old `/components`, `/hooks`, `/context`, `/store` directories
3. Update documentation
4. Remove unused dependencies

**Validation:**
- Only new structure remains
- Application still works

### 10.2 Migration Checklist

```
[ ] Phase 1: Preparation
    [ ] Create /simulator/frontend directory
    [ ] Create /simulator/backend directory
    [ ] Create /shared directory
    [ ] Set up package.json files
    [ ] Configure TypeScript for each module

[ ] Phase 2: Shared Module Migration
    [ ] Migrate /types to /shared/types
    [ ] Create API types (/shared/types/api.types.ts)
    [ ] Create shared constants
    [ ] Extract shared utilities
    [ ] Validate imports work

[ ] Phase 3: Backend Infrastructure Setup
    [ ] Create database connection
    [ ] Create repository classes
    [ ] Create service classes
    [ ] Create middleware
    [ ] Create config files
    [ ] Validate database connectivity

[ ] Phase 4: Backend API Migration
    [ ] Migrate auth API routes
    [ ] Migrate user API routes
    [ ] Migrate simulation API routes
    [ ] Migrate parameter API routes
    [ ] Migrate competency API routes
    [ ] Migrate fusion-model API routes
    [ ] Migrate admin API routes
    [ ] Migrate feedback API routes
    [ ] Migrate engagement API routes
    [ ] Move profile-generator logic
    [ ] Move scripts
    [ ] Validate all API endpoints

[ ] Phase 5: Frontend Infrastructure Setup
    [ ] Create API client
    [ ] Create auth API wrapper
    [ ] Create users API wrapper
    [ ] Create simulation API wrapper
    [ ] Create parameters API wrapper
    [ ] Create competencies API wrapper
    [ ] Create fusion-model API wrapper
    [ ] Create feedback API wrapper
    [ ] Validate API client works

[ ] Phase 6: Frontend Migration
    [ ] Migrate all pages
    [ ] Migrate all components
    [ ] Migrate hooks
    [ ] Migrate contexts
    [ ] Migrate stores
    [ ] Update imports to use API client
    [ ] Validate all pages render

[ ] Phase 7: Testing & Validation
    [ ] Test login flow
    [ ] Test signup flow
    [ ] Test user dashboard
    [ ] Test admin dashboard
    [ ] Test simulation flow
    [ ] Test parameter management
    [ ] Test competency management
    [ ] Test all API endpoints manually
    [ ] Check for console errors
    [ ] Verify no broken imports

[ ] Phase 8: Cleanup
    [ ] Remove old /app directory
    [ ] Remove old /components directory
    [ ] Remove old /hooks directory
    [ ] Remove old /context directory
    [ ] Remove old /store directory
    [ ] Remove old /lib files (migrated ones)
    [ ] Remove old /utils files (migrated ones)
    [ ] Update documentation
    [ ] Remove unused dependencies
```

### 10.3 Rollback Strategy

If issues arise during migration:

1. **Git Branching Strategy:**
   - Work on a feature branch: `feature/refactor-frontend-backend`
   - Keep main branch stable
   - Regular commits at each phase completion
   - Can revert to any phase if needed

2. **Rollback Points:**
   - End of Phase 2: Shared modules migrated
   - End of Phase 4: Backend fully migrated
   - End of Phase 6: Frontend fully migrated

3. **Testing Gates:**
   - Don't proceed to next phase until current phase validation passes
   - Maintain existing functionality at every phase

---

## 11. Technical Stack

### 11.1 Frontend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 15.2.4 | React framework with App Router |
| **UI Library** | React | 19 | Component library |
| **Language** | TypeScript | 5 | Type-safe JavaScript |
| **Styling** | Tailwind CSS | 3.4.17 | Utility-first CSS |
| **UI Components** | Radix UI | Various | Accessible component primitives |
| **State Management** | Zustand | Latest | Client state |
| **Data Fetching** | SWR | Latest | Remote data caching |
| **Form Handling** | React Hook Form | Latest | Form management |
| **Validation** | Zod | Latest | Schema validation |
| **Charts** | Recharts | Latest | Data visualization |
| **Icons** | Lucide React | 0.454.0 | Icon library |
| **Date Handling** | date-fns | 4.1.0 | Date utilities |

### 11.2 Backend Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 22+ | JavaScript runtime |
| **Framework** | Next.js API Routes | 15.2.4 | API framework |
| **Language** | TypeScript | 5 | Type-safe JavaScript |
| **Database Driver** | @neondatabase/serverless | Latest | PostgreSQL client |
| **Database (Alt)** | @vercel/postgres | 0.10.0 | PostgreSQL SDK |
| **Authentication** | next-auth | Latest | Auth library |
| **Password Hashing** | bcryptjs | Latest | Password encryption |
| **AI Integration** | openai | Latest | GPT-4o API client |
| **Email** | nodemailer | Latest | Email sending |
| **Validation** | Zod | Latest | Schema validation |
| **CSV Parsing** | csv-parse | Latest | CSV file parsing |
| **UUID Generation** | uuid | Latest | Unique IDs |

### 11.3 Shared Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Language** | TypeScript | 5 | Type definitions |
| **Validation** | Zod | Latest | Shared validation schemas |

### 11.4 Development Tools

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Package Manager** | npm | Dependency management |
| **Linting** | ESLint | Code linting |
| **Formatting** | Prettier | Code formatting |
| **Git** | Git | Version control |

### 11.5 Database

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Database** | PostgreSQL | Relational database |
| **Hosting** | Neon / Vercel Postgres | Serverless PostgreSQL |

### 11.6 External Services

| Service | Purpose |
|---------|---------|
| OpenAI GPT-4o | AI client simulation |
| Vercel | Hosting (optional) |
| Azure OpenAI | Alternative AI provider |
| Azure Cognitive Search | RAG integration (future) |

---

## 12. Appendix

### 12.1 Key Architectural Decisions

#### Decision 1: Monorepo vs Multi-Repo
**Decision:** Monorepo
**Rationale:**
- Easier to maintain shared types
- Atomic commits across frontend and backend
- Simpler dependency management
- Single CI/CD pipeline

#### Decision 2: Repository Pattern
**Decision:** Use Repository pattern for data access
**Rationale:**
- Separate data access from business logic
- Easier to test
- Prepare for future database migrations
- Clear abstraction layer

#### Decision 3: Service Layer
**Decision:** Extract business logic into services
**Rationale:**
- API routes become thin controllers
- Business logic reusable across endpoints
- Easier to test complex logic
- Clear separation of concerns

#### Decision 4: API Client Layer
**Decision:** Create typed API client wrapper
**Rationale:**
- Type-safe API calls from frontend
- Centralized request/response handling
- Easier to add interceptors (auth, logging)
- Better error handling

#### Decision 5: Shared Types Location
**Decision:** Place shared types in `/shared/types`
**Rationale:**
- Single source of truth for data contracts
- Ensure frontend and backend stay in sync
- Easy to import from both sides
- Clear ownership

### 12.2 Comparison: Before vs After

| Aspect | Before (Current) | After (Refactored) |
|--------|------------------|-------------------|
| **Structure** | Monolithic Next.js app | Separated frontend/backend |
| **Code Location** | Mixed in `/app` directory | Clear `/simulator/frontend` and `/backend` |
| **API Logic** | Inline in API routes | Extracted to services |
| **Data Access** | Direct SQL in API routes | Repository pattern |
| **Type Sharing** | Scattered in `/types` | Centralized in `/shared/types` |
| **API Calls (Frontend)** | Direct fetch to API routes | Typed API client |
| **Business Logic** | Mixed with API handlers | Extracted to service layer |
| **Testing** | Hard to test in isolation | Easy to test layers independently |
| **Dependencies** | Single package.json | Separate per module |
| **Scalability** | Difficult to extract services | Easy to split into microservices |

### 12.3 File Count Estimate

| Location | Current | After Refactor |
|----------|---------|----------------|
| **Root** | ~200 files | ~20 files (configs only) |
| **Frontend** | N/A | ~200 files |
| **Backend** | N/A | ~150 files |
| **Shared** | N/A | ~30 files |
| **Data** | ~6 JSON files | ~6 JSON files (unchanged) |
| **Total** | ~200 files | ~406 files |

**Note:** File count increases due to separation, but each file has clearer responsibility.

### 12.4 Code Volume Estimate

| Module | Lines of Code (Approx) |
|--------|------------------------|
| **Current Codebase** | ~30,000 lines |
| **New Infrastructure Code** | ~2,850 lines |
| **Refactored/Moved Code** | ~1,800 lines |
| **Total After Refactor** | ~34,650 lines |

**Increase:** ~15% (due to additional infrastructure layers)

---

## 13. Conclusion

### 13.1 Summary

This refactoring design document outlines a comprehensive plan to separate the existing monolithic Next.js application into distinct **frontend** and **backend** modules within a monorepo structure. The refactoring maintains all existing functionality while establishing clear architectural boundaries.

### 13.2 Benefits

1. **Architectural Clarity:** Clear separation between UI and business logic
2. **Maintainability:** Easier to locate and modify code
3. **Testability:** Independent testing of frontend and backend layers
4. **Scalability:** Prepared for future microservices extraction
5. **Developer Experience:** Faster onboarding, clear ownership
6. **Type Safety:** Shared types ensure API contract consistency

### 13.3 Minimal Additional Code

The refactoring requires approximately **2,850 lines of new infrastructure code** and **1,800 lines of refactored code**, representing a **15% increase** over the existing codebase. This is minimal considering the architectural benefits gained.

### 13.4 Next Steps

1. Review and approve this design document
2. Begin Phase 1: Preparation (create directory structure)
3. Execute phases sequentially with validation at each step
4. Regular check-ins after each phase completion
5. Final validation and cleanup

---

**Document Version:** 2.0
**Last Updated:** December 18, 2025
**Status:** Ready for Review

