-- Comprehensive Database Initialization Script for Skill Simulator
-- Run this script in your Neon database console

-- ============================================
-- 1. CREATE COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- ============================================
-- 2. CREATE USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('learner', 'trainer', 'company_admin', 'super_admin')) NOT NULL DEFAULT 'learner',
  job_role TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

-- ============================================
-- 3. CREATE SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ============================================
-- 4. CREATE PARAMETER CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parameter_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('narrative', 'structured', 'guardrail')) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. CREATE PARAMETERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES parameter_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  value_type TEXT CHECK (value_type IN ('text', 'number', 'boolean', 'array')) NOT NULL,
  default_value TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  options TEXT[],
  industry TEXT,
  subcategory TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parameters_category ON parameters(category_id);
CREATE INDEX IF NOT EXISTS idx_parameters_industry ON parameters(industry);

-- ============================================
-- 6. CREATE SIMULATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  industry TEXT NOT NULL,
  subcategory TEXT,
  difficulty TEXT NOT NULL,
  client_profile JSONB NOT NULL,
  conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  objectives_completed JSONB DEFAULT '[]'::jsonb,
  performance_review JSONB,
  total_xp INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_simulations_user ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_simulation_id ON simulations(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulations_completed ON simulations(completed_at);

-- ============================================
-- 7. CREATE ENGAGEMENT EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  simulation_id TEXT,
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_session ON engagement_events(session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_simulation ON engagement_events(simulation_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_type ON engagement_events(event_type);

-- ============================================
-- 8. CREATE NPS FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nps_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback_type TEXT CHECK (feedback_type IN ('promoter', 'passive', 'detractor')) NOT NULL,
  reasons TEXT[],
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nps_simulation ON nps_feedback(simulation_id);
CREATE INDEX IF NOT EXISTS idx_nps_user ON nps_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_score ON nps_feedback(score);

-- ============================================
-- 9. INSERT DEFAULT TEST USERS
-- ============================================
INSERT INTO users (email, name, password, role)
VALUES
  ('brittany.jones+learner@kaplan.com', 'Brittany Learner', 'admin123', 'learner'),
  ('brittany.jones+trainer@kaplan.com', 'Brittany Trainer', 'admin123', 'trainer'),
  ('brittany.jones+companyadmin@kaplan.com', 'Brittany Admin', 'admin123', 'company_admin'),
  ('brittany.jones+superadmin@kaplan.com', 'Brittany SuperAdmin', 'admin123', 'super_admin'),
  ('demo@example.com', 'Demo User', 'demo123', 'learner')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Uncomment to verify the setup:

-- SELECT 'Companies' as table_name, COUNT(*) as count FROM companies
-- UNION ALL
-- SELECT 'Users', COUNT(*) FROM users
-- UNION ALL
-- SELECT 'Sessions', COUNT(*) FROM sessions
-- UNION ALL
-- SELECT 'Parameters', COUNT(*) FROM parameters
-- UNION ALL
-- SELECT 'Parameter Categories', COUNT(*) FROM parameter_categories
-- UNION ALL
-- SELECT 'Simulations', COUNT(*) FROM simulations
-- UNION ALL
-- SELECT 'Engagement Events', COUNT(*) FROM engagement_events
-- UNION ALL
-- SELECT 'NPS Feedback', COUNT(*) FROM nps_feedback;
