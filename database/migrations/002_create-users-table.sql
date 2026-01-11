-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('learner', 'trainer', 'company_admin', 'super_admin')) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Insert test users with plain text passwords (for demo purposes only)
INSERT INTO users (email, name, password, role)
VALUES 
  ('brittany.jones+learner@kaplan.com', 'Brittany Learner', 'admin123', 'learner'),
  ('brittany.jones+trainer@kaplan.com', 'Brittany Trainer', 'admin123', 'trainer'),
  ('brittany.jones+companyadmin@kaplan.com', 'Brittany Admin', 'admin123', 'company_admin'),
  ('brittany.jones+superadmin@kaplan.com', 'Brittany SuperAdmin', 'admin123', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
