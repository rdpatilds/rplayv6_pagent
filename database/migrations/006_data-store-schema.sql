-- Competency Rubrics
CREATE TABLE competency_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id UUID NOT NULL,
    industry_id UUID,  -- NULL for defaults, specific ID for overrides
    rubric_json JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_competency_industry_version UNIQUE (competency_id, industry_id, version)
);

-- Narrative Parameter Examples
CREATE TABLE narrative_parameter_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_key TEXT NOT NULL,
    industry_id UUID,  -- NULL for defaults, specific ID for overrides
    example_json JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_parameter_industry_version UNIQUE (parameter_key, industry_id, version)
);

-- Guardrail Examples
CREATE TABLE guardrail_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardrail_key TEXT NOT NULL,
    industry_id UUID,  -- NULL for defaults, specific ID for overrides
    examples_json JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_guardrail_industry_version UNIQUE (guardrail_key, industry_id, version)
);

-- Add indexes for performance
CREATE INDEX idx_competency_rubrics_industry ON competency_rubrics(industry_id);
CREATE INDEX idx_narrative_parameter_examples_industry ON narrative_parameter_examples(industry_id);
CREATE INDEX idx_guardrail_examples_industry ON guardrail_examples(industry_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_competency_rubrics_updated_at
    BEFORE UPDATE ON competency_rubrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_narrative_parameter_examples_updated_at
    BEFORE UPDATE ON narrative_parameter_examples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guardrail_examples_updated_at
    BEFORE UPDATE ON guardrail_examples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 