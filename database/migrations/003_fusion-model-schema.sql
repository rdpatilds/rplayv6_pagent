-- Create tables for fusion model components

-- Core traits table
CREATE TABLE IF NOT EXISTS fusion_model_core_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  weight INTEGER NOT NULL DEFAULT 50,
  influence INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Archetypes table
CREATE TABLE IF NOT EXISTS fusion_model_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  traits JSONB NOT NULL DEFAULT '[]',
  behaviors JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Communication styles table
CREATE TABLE IF NOT EXISTS fusion_model_communication_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  characteristics JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Moods table
CREATE TABLE IF NOT EXISTS fusion_model_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  intensity INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quirks table
CREATE TABLE IF NOT EXISTS fusion_model_quirks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  impact TEXT NOT NULL,
  fusion_links JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add some initial data for core traits
INSERT INTO fusion_model_core_traits (name, description, category, weight, influence) VALUES
  ('Openness', 'The tendency to be open to new experiences and ideas', 'Personality', 50, 50),
  ('Conscientiousness', 'The tendency to be organized and responsible', 'Personality', 50, 50),
  ('Extraversion', 'The tendency to be outgoing and social', 'Personality', 50, 50),
  ('Agreeableness', 'The tendency to be cooperative and compassionate', 'Personality', 50, 50),
  ('Neuroticism', 'The tendency to experience negative emotions', 'Personality', 50, 50),
  ('Assertiveness', 'The tendency to be confident and direct', 'Behavior', 50, 50),
  ('Honesty-Humility', 'The tendency to be honest and humble', 'Values', 50, 50);

-- Add some initial data for archetypes
INSERT INTO fusion_model_archetypes (name, description, traits, behaviors) VALUES
  ('Analyst', 'A logical and systematic thinker', 
   '["openness", "conscientiousness"]',
   '["research", "analysis", "planning"]'),
  ('Creator', 'An innovative and imaginative individual',
   '["openness", "extraversion"]',
   '["ideation", "experimentation", "expression"]'),
  ('Helper', 'A supportive and caring person',
   '["agreeableness", "extraversion"]',
   '["listening", "support", "guidance"]');

-- Add some initial data for communication styles
INSERT INTO fusion_model_communication_styles (name, description, characteristics) VALUES
  ('Direct', 'Clear and straightforward communication',
   '["clarity", "conciseness", "assertiveness"]'),
  ('Diplomatic', 'Tactful and considerate communication',
   '["empathy", "tact", "patience"]'),
  ('Analytical', 'Logical and structured communication',
   '["precision", "detail", "objectivity"]');

-- Add some initial data for moods
INSERT INTO fusion_model_moods (name, description, intensity) VALUES
  ('Optimistic', 'A positive and hopeful outlook', 50),
  ('Cautious', 'A careful and thoughtful approach', 50),
  ('Enthusiastic', 'An energetic and excited state', 50);

-- Add some initial data for quirks
INSERT INTO fusion_model_quirks (name, description, impact, fusion_links) VALUES
  ('Perfectionist', 'A strong desire for perfection',
   'May take longer to complete tasks but produces high-quality work',
   '["conscientiousness", "analyst"]'),
  ('Storyteller', 'A natural tendency to share stories',
   'Makes communication more engaging but may go off-topic',
   '["extraversion", "creator"]'),
  ('Detail-Oriented', 'A focus on small details',
   'Ensures accuracy but may miss the big picture',
   '["conscientiousness", "analyst"]'); 