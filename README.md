# AI Simulation Platform

A full-stack monorepo application for AI-powered business simulation training. Built with Next.js, Express, and TypeScript.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Available Scripts](#available-scripts)
- [Database](#database)
- [Troubleshooting](#troubleshooting)
- [Tech Stack](#tech-stack)

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js v20.x** (Required - Node 22 is NOT compatible)
- **npm v10.x** (comes with Node 20)
- **nvm** (Node Version Manager) - Recommended for managing Node versions
- **Git**
- **PostgreSQL** (Neon database connection)

### Installing Node 20 with NVM

```bash
# Install NVM (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell configuration
source ~/.bashrc  # or ~/.zshrc for zsh

# Install Node 20
nvm install 20

# Set Node 20 as default
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone git@github.com:rdpatilds/rplayv6.git
cd rplayv6
```

### 2. Switch to Node 20

**IMPORTANT:** Always use Node 20 for this project!

```bash
nvm use 20
```

### 3. Install Dependencies

```bash
npm install
```

This will install all dependencies for the entire monorepo (frontend, backend, and shared packages).

### 4. Set Up Environment Variables

#### Backend Environment

Create or update `backend/.env`:

```bash
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Node Environment
NODE_ENV=development

# Database Configuration
# Get your Neon database URL from: https://console.neon.tech/
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

#### Frontend Environment

Create or update `frontend/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Application Configuration
NEXT_PUBLIC_APP_NAME=AI Simulation Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI API Key (same as backend)
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (same as backend)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Node Environment
NODE_ENV=development
```

### 5. Start the Application

```bash
# Start both frontend and backend servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Backend Health Check**: http://localhost:3001/health

## 📁 Project Structure

```
rplayv6/
├── frontend/                 # Next.js application (port 3000)
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── lib/                 # Frontend utilities and API clients
│   ├── public/              # Static assets
│   ├── next.config.mjs      # Next.js configuration
│   ├── tailwind.config.ts   # Tailwind CSS configuration
│   ├── postcss.config.mjs   # PostCSS configuration (required!)
│   └── package.json         # Frontend dependencies
│
├── backend/                  # Express API server (port 3001)
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   ├── db/                  # Database connection and repositories
│   ├── config/              # Configuration files
│   ├── index.ts             # Server entry point
│   └── package.json         # Backend dependencies
│
├── shared/                   # Shared code between frontend and backend
│   ├── types/               # TypeScript type definitions
│   ├── constants/           # Shared constants
│   ├── data/                # Shared data files
│   └── utils/               # Shared utility functions
│
├── database/                 # Database assets
│   ├── migrations/          # SQL migration files (numbered)
│   │   ├── 001_init-database.sql
│   │   ├── 002_create-users-table.sql
│   │   ├── 003_fusion-model-schema.sql
│   │   └── ...
│   └── scripts/             # Database utility scripts
│       ├── check-database-operations.sql
│       └── verify-users-table.sql
│
├── docs/                     # Documentation
├── tests/                    # End-to-end tests
├── package.json             # Root workspace configuration
└── README.md                # This file
```

## 🔧 Environment Setup

### Required Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Both | OpenAI API key for AI features |
| `DATABASE_URL` | Both | PostgreSQL connection string (Neon) |
| `NODE_ENV` | Both | Environment: `development` or `production` |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API URL (default: `http://localhost:3001`) |
| `NEXT_PUBLIC_APP_NAME` | Frontend | Application name |
| `NEXT_PUBLIC_APP_URL` | Frontend | Frontend URL (default: `http://localhost:3000`) |

### Getting API Keys

**OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and paste it into both `.env` files

**Neon Database:**
1. Go to https://console.neon.tech/
2. Create a new project
3. Copy the connection string
4. Paste it as `DATABASE_URL` in both `.env` files

## 💻 Development

### Starting the Servers

**Option 1: Start Both Servers Together**
```bash
npm run dev
```

**Option 2: Start Separately (in different terminals)**

Terminal 1 - Backend:
```bash
nvm use 20
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
nvm use 20
npm run dev:frontend
```

### Development Workflow

1. **Always switch to Node 20 first**:
   ```bash
   nvm use 20
   ```

2. **Make your changes** in the appropriate workspace:
   - Frontend: `frontend/`
   - Backend: `backend/`
   - Shared: `shared/`

3. **Servers auto-reload** on file changes (hot reload enabled)

4. **Clear browser cache** if styles don't update:
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Press `Cmd + Shift + R` (Mac)

## 🏗️ Building for Production

### Build All Packages

```bash
npm run build
```

### Build Individual Packages

```bash
# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend
```

### Start Production Servers

```bash
# Start frontend (after building)
npm run start:frontend

# Start backend (after building)
npm run start:backend
```

## 📜 Available Scripts

### Root Level Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend servers |
| `npm run dev:frontend` | Start only frontend dev server |
| `npm run dev:backend` | Start only backend dev server |
| `npm run build` | Build all packages |
| `npm run build:frontend` | Build frontend only |
| `npm run build:backend` | Build backend only |
| `npm run start:frontend` | Start production frontend |
| `npm run start:backend` | Start production backend |
| `npm run clean` | Remove all node_modules and build artifacts |
| `npm install` | Install all dependencies |

### Frontend Scripts (run from `frontend/` directory)

```bash
cd frontend

npm run dev      # Start Next.js dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend Scripts (run from `backend/` directory)

```bash
cd backend

npm run dev      # Start Express dev server with tsx
npm run build    # Build TypeScript to JavaScript
npm run start    # Start production server
```

## 🗄️ Database

### Database Migrations

Migration files are located in `database/migrations/` with numbered prefixes:

```
database/migrations/
├── 001_init-database.sql
├── 002_create-users-table.sql
├── 003_fusion-model-schema.sql
├── 004_alter-sessions-table.sql
├── 005_update-sessions-table.sql
└── 006_data-store-schema.sql
```

### Running Migrations

Migrations need to be run manually against your Neon database. Use a PostgreSQL client or the Neon console.

### Database Utility Scripts

Diagnostic scripts are in `database/scripts/`:
- `check-database-operations.sql` - Verify database operations
- `check-parameters-data.sql` - Check parameters data
- `verify-users-table.sql` - Verify users table structure

## 🐛 Troubleshooting

### Node Version Issues

**Error**: `TypeError: (0 , _utils.getParsedNodeOptions) is not a function`

**Solution**: You're using Node 22 instead of Node 20
```bash
nvm use 20
rm -rf node_modules frontend/node_modules backend/node_modules
npm install
npm run dev
```

### Styling Issues (No CSS)

**Problem**: Page loads but has no styling

**Solutions**:

1. **Verify PostCSS config exists**:
   ```bash
   ls -la frontend/postcss.config.mjs
   ```
   If missing, create `frontend/postcss.config.mjs`:
   ```javascript
   const config = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   export default config
   ```

2. **Clear all caches**:
   ```bash
   npm run clean
   npm install
   npm run dev
   ```

3. **Clear browser cache**:
   - Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Or open in incognito mode

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Kill process on port 3001
lsof -ti :3001 | xargs kill -9

# Restart servers
npm run dev
```

### Database Connection Issues

**Error**: `Database connection failed`

**Solutions**:
1. Verify `DATABASE_URL` in both `.env` files
2. Check Neon database is active at https://console.neon.tech/
3. Ensure connection string includes `?sslmode=require`
4. Test connection with:
   ```bash
   cd backend
   npm run dev
   # Check console for "✓ Database connected"
   ```

### Import Path Errors

**Error**: `Module not found: Can't resolve '@/shared/...'`

**Solution**: Imports from `shared/` should use `@shared/`:
```typescript
// ❌ Wrong
import { User } from "@/shared/types/user.types"

// ✅ Correct
import { User } from "@shared/types/user.types"
```

### Missing Dependencies

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Reinstall all dependencies
npm install

# Or clean install
npm run clean
npm install
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 (React 19)
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand, React Context
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Custom API client with fetch

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Direct SQL queries with @neondatabase/serverless
- **AI**: OpenAI API (GPT models)
- **Validation**: Zod

### Shared
- **TypeScript**: Shared types and interfaces
- **Utilities**: Common utility functions
- **Constants**: Application-wide constants
- **Data**: Shared JSON data files

### Development Tools
- **Package Manager**: npm workspaces
- **TypeScript Compiler**: tsx (for backend dev server)
- **Code Quality**: ESLint
- **Testing**: Playwright (E2E tests)

## 🔐 Security Notes

- Never commit `.env` or `.env.local` files (they're in `.gitignore`)
- Keep your OpenAI API key secure
- Use environment-specific database credentials
- Rotate API keys regularly

## 📝 License

Private repository - All rights reserved

## 🤝 Contributing

This is a private project. For team members:

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Commit: `git commit -m "Description of changes"`
4. Push: `git push origin feature/your-feature-name`
5. Create a Pull Request

## 📞 Support

For issues or questions, please contact the development team or create an issue in the GitHub repository.

---

**Remember**: Always use Node 20! Run `nvm use 20` before any npm commands.
