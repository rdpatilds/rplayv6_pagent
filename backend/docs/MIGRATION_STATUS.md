# Frontend/Backend Migration Status

## Overview

Refactoring monolithic Next.js application into separated frontend/backend architecture with shared types/utilities.

## Progress Summary

**Overall: 62/83 tasks complete (75%)**

### Phase 1: Setup & Configuration ✅ (7/7)
- Directory structure created
- Package.json files for frontend, backend, and shared modules
- TypeScript configuration for all three modules

### Phase 2: Shared Module ✅ (4/4)
- API types in `/shared/types/api.types.ts`
- Shared constants (roles, difficulty levels, industries)
- Shared utilities (validation, formatters)

### Phase 3: Backend Infrastructure ✅ (36/36)
- Database connection (Neon serverless PostgreSQL)
- 8 Repositories (user, session, parameter, competency, simulation, rubric, feedback, engagement)
- 12 Services (auth, user, simulation, ai, profile-generation, parameter, competency, rubric, fusion-model, engagement, feedback, email)
- 3 Middleware (auth, error-handler, validation)
- Backend configuration

### Phase 4: API Route Migration ✅ (8/8)
All API routes migrated to `/simulator/backend/api/`:
- Auth routes (login, register, logout, check, change-password)
- User routes (GET all, GET/PUT/DELETE by ID, bulk-import)
- Simulation routes (GET all, GET/PUT/DELETE by ID, complete)
- Parameter routes (GET all, GET/PATCH/DELETE by ID, reset)
- Competency routes (GET all, GET by industry, GET/PUT/DELETE by ID)
- Feedback routes (GET filtered, GET NPS stats, POST create)
- Engagement routes (GET stats, GET history, POST track)
- Admin routes (seed database)

### Phase 5: Frontend API Client ✅ (7/7)
- Base ApiClient class (`/simulator/frontend/lib/api-client.ts`)
- Auth API wrapper (login, register, logout, checkAuth, changePassword)
- Users API wrapper (CRUD operations, bulk import)
- Simulation API wrapper (CRUD, start, complete)
- Parameters API wrapper (CRUD, filter, reset)
- Competencies API wrapper (CRUD, filter by industry/category)
- Feedback API wrapper (CRUD, NPS stats, engagement tracking)

### Phase 6: Frontend Code Migration (In Progress: 63/66)

#### Completed:
- ✅ Next.js configuration (`next.config.mjs`) with API proxy
- ✅ Tailwind configuration (`tailwind.config.ts`)
- ✅ Global styles copied to `/simulator/frontend/app/globals.css`
- ✅ Public assets copied to `/simulator/frontend/public/`
- ✅ Environment setup (`.env.local.example`)
- ✅ All pages copied (36 pages)
- ✅ All components copied (98 components)
- ✅ All hooks copied (4 hooks)
- ✅ All contexts copied (1 context)
- ✅ All stores copied (1 store)
- ✅ Frontend utilities copied (`utils.ts`, `simulation-utils.ts`)
- ✅ Import paths updated (`@/types` → `@/shared/types`, `@/constants` → `@/shared/constants`)
- ✅ Removed API routes from frontend/app directory

#### In Progress - API Client Integration (3/28 files updated):
**✅ Updated files:**
1. `/simulator/frontend/components/login-form.tsx` - Uses `authApi.login()`
2. `/simulator/frontend/components/signup-form.tsx` - Uses `authApi.register()`
3. `/simulator/frontend/components/bulk-import-dialog.tsx` - Uses `usersApi.bulkImport()`

**🔄 Remaining files to update (25):**

**Pages:**
1. `/simulator/frontend/app/account/change-password/page.tsx` - Use `authApi.changePassword()`
2. `/simulator/frontend/app/account/edit/page.tsx` - Use `usersApi.update()`
3. `/simulator/frontend/app/admin/api-settings/page.tsx` - Use `parametersApi`
4. `/simulator/frontend/app/admin/competencies/page.tsx` - Use `competenciesApi`
5. `/simulator/frontend/app/admin/engagement/session/[sessionId]/page.tsx` - Use `feedbackApi.getEngagementHistory()`
6. `/simulator/frontend/app/admin/feedback/consolidated-dashboard.tsx` - Use `feedbackApi`
7. `/simulator/frontend/app/admin/fusion-model/components/FusionDatabaseEditor.tsx` - Use `parametersApi`
8. `/simulator/frontend/app/admin/seed-data/page.tsx` - Use admin seed endpoint
9. `/simulator/frontend/app/admin/user-management/page.tsx` - Use `usersApi`
10. `/simulator/frontend/app/profile-generator/actions.ts` - Server actions (may need refactor)
11. `/simulator/frontend/app/profile-generator/page.tsx` - Use profile generation API
12. `/simulator/frontend/app/profile-generator/sentiment-analyzer.ts` - Utility (may not need changes)
13. `/simulator/frontend/app/simulation/industry-selection/client.tsx` - Use `simulationApi`
14. `/simulator/frontend/app/simulation/review/page.tsx` - Use `simulationApi.complete()`
15. `/simulator/frontend/app/simulation/session/page.tsx` - Use `simulationApi` and AI streaming
16. `/simulator/frontend/app/simulation/setup/page.tsx` - Use `simulationApi.start()`
17. `/simulator/frontend/app/test-cookies/page.tsx` - Test page (may remove)

**Components:**
18. `/simulator/frontend/components/nps-feedback.tsx` - Use `feedbackApi.create()`
19. `/simulator/frontend/components/parameter-catalog/category-manager.tsx` - Use `parametersApi`
20. `/simulator/frontend/components/parameter-catalog/guardrails-parameters-manager.tsx` - Use `parametersApi`
21. `/simulator/frontend/components/parameter-catalog/parameter-table.tsx` - Use `parametersApi`
22. `/simulator/frontend/components/parameter-catalog/reset-parameter-catalog.tsx` - Use `parametersApi.resetToDefaults()`
23. `/simulator/frontend/components/parameter-catalog/structured-parameters-manager.tsx` - Use `parametersApi`

**Hooks:**
24. `/simulator/frontend/hooks/use-parameter-categories.ts` - Use `parametersApi`
25. `/simulator/frontend/hooks/use-parameters.ts` - Use `parametersApi`

### Phase 7: Testing ⏳ (0/11)
- Login flow end-to-end
- Signup flow end-to-end
- User dashboard functionality
- Admin dashboard functionality
- Complete simulation flow
- Parameter management features
- Competency management features
- All API endpoints
- Console errors and warnings
- Imports and circular dependencies
- Database operations and data persistence

### Phase 8: Cleanup ⏳ (0/9)
- Remove old /app directory code
- Remove old /components directory
- Remove old /hooks, /context, /store directories
- Remove migrated /lib and /utils files
- Remove old /types directory
- Update documentation and README files
- Remove unused dependencies from package.json
- Final validation

## API Client Usage Patterns

### Authentication
```typescript
import { authApi } from "@/lib/api"

// Login
const { token, user } = await authApi.login(email, password)

// Register
const { token, user } = await authApi.register({ name, email, password, jobRole, company })

// Logout
await authApi.logout()

// Change password
await authApi.changePassword(oldPassword, newPassword)

// Check auth status
const isAuth = authApi.isAuthenticated()
```

### Users
```typescript
import { usersApi } from "@/lib/api"

// Get all users
const { data: users } = await usersApi.getAll()

// Get user by ID
const { data: user } = await usersApi.getById(userId)

// Create user
const { data: user } = await usersApi.create({ name, email, password, role })

// Update user
const { data: user } = await usersApi.update(userId, { name, email })

// Delete user
await usersApi.delete(userId)

// Bulk import
const { results } = await usersApi.bulkImport({ file, importMethod: "csv" })
```

### Simulation
```typescript
import { simulationApi } from "@/lib/api"

// Start simulation
const { data: simulation } = await simulationApi.start({ industry, difficultyLevel, clientProfile })

// Get all simulations
const { data: simulations } = await simulationApi.getAll()

// Update simulation
await simulationApi.update(simulationId, { conversationHistory })

// Complete simulation
const { data: result } = await simulationApi.complete(simulationId, { finalTranscript })
```

### Parameters
```typescript
import { parametersApi } from "@/lib/api"

// Get all parameters (with optional filters)
const { data: params } = await parametersApi.getAll({ categoryId, type: "structured" })

// Create parameter
const { data: param } = await parametersApi.create({ name, type, categoryId, value })

// Update parameter
const { data: param } = await parametersApi.update(paramId, { value })

// Reset to defaults
await parametersApi.resetToDefaults()
```

### Competencies
```typescript
import { competenciesApi } from "@/lib/api"

// Get all competencies (with optional filters)
const { data: competencies } = await competenciesApi.getAll({ industry, category })

// Get by industry (grouped)
const { data: grouped } = await competenciesApi.getByIndustry(industry)

// CRUD operations
const { data: competency } = await competenciesApi.create({ name, description, category, weight })
await competenciesApi.update(compId, { weight })
await competenciesApi.delete(compId)
```

### Feedback & Engagement
```typescript
import { feedbackApi } from "@/lib/api"

// Get feedback (with filters)
const { data: feedback } = await feedbackApi.getAll({ simulationId, userId })

// Create feedback
const { data: newFeedback } = await feedbackApi.create({ simulationId, rating, comments })

// Get NPS stats
const { data: stats } = await feedbackApi.getNpsStats()

// Track engagement
await feedbackApi.trackEngagement({ eventType: "page_view", simulationId })

// Get engagement stats
const { data: stats } = await feedbackApi.getEngagementStats(userId)
```

## Common Migration Patterns

### Replace fetch with API client

**Before:**
```typescript
const response = await fetch("/api/auth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const data = await response.json()
if (!response.ok) throw new Error(data.message)
```

**After:**
```typescript
const data = await authApi.login(email, password)
```

### Form Data / File Upload

**Before:**
```typescript
const formData = new FormData()
formData.append("file", file)
const response = await fetch("/api/users/bulk-import", {
  method: "POST",
  body: formData,
})
```

**After:**
```typescript
const data = await usersApi.bulkImport({ file, importMethod: "csv" })
```

## Next Steps

1. **Complete API Client Integration:** Update remaining 25 files to use API client
2. **Test Core Flows:** Login, signup, simulation, parameter management
3. **Fix Import Issues:** Resolve any remaining import path issues
4. **Remove Old Code:** Clean up old /app, /components, /lib directories
5. **Documentation:** Update README with new architecture

## Known Issues

- Server Actions in `/app/profile-generator/actions.ts` may need refactoring to use API client
- Some files may have complex fetch patterns that need careful migration
- Need to verify all API endpoints are accessible from frontend

## File Structure

```
/simulator
  /frontend
    /app                 # Next.js pages (migrated)
    /components          # React components (migrated)
    /hooks               # Custom hooks (migrated)
    /context             # React contexts (migrated)
    /store               # Zustand stores (migrated)
    /lib
      /api               # API wrappers ✅
      api-client.ts      # Base client ✅
      utils.ts           # Utilities ✅
    /public              # Static assets (migrated)
    next.config.mjs      # Next.js config ✅
    tailwind.config.ts   # Tailwind config ✅
    tsconfig.json        # TypeScript config ✅
    package.json         # Dependencies ✅

  /backend
    /api                 # API routes ✅
    /services            # Business logic ✅
    /db
      /repositories      # Data access ✅
      connection.ts      # DB connection ✅
    /middleware          # Express middleware ✅
    /config              # Configuration ✅
    tsconfig.json        # TypeScript config ✅
    package.json         # Dependencies ✅

/shared
  /types                 # Shared TypeScript types ✅
  /constants             # Shared constants ✅
  /utils                 # Shared utilities ✅
  tsconfig.json          # TypeScript config ✅
  package.json           # Dependencies ✅
```

## Migration Commands

### Install dependencies
```bash
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/frontend
npm install

cd ../backend
npm install

cd ../../shared
npm install
```

### Run development servers
```bash
# Backend (terminal 1)
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/backend
npm run dev

# Frontend (terminal 2)
cd /home/user/projects/smulation1/v0-simulation-end-user-and-admin-main/simulator/frontend
npm run dev
```

### Environment Setup
1. Copy `.env.local.example` to `.env.local` in frontend directory
2. Set up backend environment variables (DATABASE_URL, OPENAI_API_KEY, etc.)

## Completion Checklist

- [x] Phase 1: Setup & Configuration
- [x] Phase 2: Shared Module
- [x] Phase 3: Backend Infrastructure
- [x] Phase 4: API Route Migration
- [x] Phase 5: Frontend API Client
- [ ] Phase 6: Frontend Code Migration (63/66 complete)
  - [x] Configuration & Setup
  - [x] File Migration
  - [x] Import Path Updates
  - [ ] API Client Integration (3/28 complete)
- [ ] Phase 7: Testing
- [ ] Phase 8: Cleanup

---

Last Updated: 2025-12-18
Session: Continued from previous context
