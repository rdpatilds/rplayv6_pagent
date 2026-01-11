# MVP Requirements vs. Implementation & RAG Strategy Analysis

> **Document Version**: 1.0
> **Date**: January 10, 2026
> **Purpose**: Gap analysis between Project Charter requirements and current implementation, with detailed RAG strategies for each agent

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Charter MVP Requirements vs. Current Implementation](#part-1-charter-mvp-requirements-vs-current-implementation)
3. [RAG Architecture Strategy](#part-2-rag-architecture-strategy)
4. [Detailed RAG Strategy by Agent](#part-3-detailed-rag-strategy-by-agent)
5. [Implementation Strategies](#part-4-implementation-strategies)
6. [Agent Improvement Strategies](#part-5-agent-improvement-strategies)
7. [Implementation Priorities](#part-6-summary---rag-implementation-priorities)
8. [Sources](#sources)

---

## Executive Summary

The Project Charter specifies a **Knowledge Grounding Architecture** as a core technical component of the Interpersonal Skills Simulator. This document analyzes the gap between charter requirements and current implementation, then provides detailed RAG (Retrieval-Augmented Generation) strategies for each of the four agents in the system.

### Key Findings

| Area | Status | Priority |
|------|--------|----------|
| RAG System with per-tenant document repositories | **NOT IMPLEMENTED** | Critical |
| Tagged content categorization (Persona Context, Guardrail, Learner Resource) | **NOT IMPLEMENTED** | Critical |
| Citation transparency | **NOT IMPLEMENTED** | High |
| Configurable grounding policies | Partially implemented (hardcoded) | High |
| Agent-specific knowledge retrieval | **NOT IMPLEMENTED** | Critical |

---

## Part 1: Charter MVP Requirements vs. Current Implementation

### Knowledge Grounding Architecture (CRITICAL GAP)

The charter explicitly requires a "Knowledge Grounding Architecture" with the following components:

| Charter Requirement | Current Implementation | Status |
|---------------------|----------------------|--------|
| RAG system with per-tenant document repositories | **NOT IMPLEMENTED** - No vector DB, no document storage | :x: Missing |
| Tagged content categorization (Persona Context, Guardrail, Learner Resource) | **NOT IMPLEMENTED** | :x: Missing |
| Citation transparency showing retrieved KB content | **NOT IMPLEMENTED** | :x: Missing |
| Configurable grounding policies per simulation type | Hardcoded in agent files (e.g., `profile-generation-agent.ts:184-228`) | :warning: Partial |
| Per-tenant document upload with tagging | **NOT IMPLEMENTED** | :x: Missing |

### Agent Capabilities Comparison

| Charter Requirement | Current State | Gap Analysis |
|---------------------|--------------|--------------|
| **Profile Generation Agent** | Implemented with basic diversity params | Missing: Industry-specific KB, compliance-aware generation, demographic grounding |
| **Simulation Client Agent** | Implemented with emotional state tracking | Missing: RAG for product knowledge, objection patterns, persona grounding |
| **Evaluation Agent** | Implemented with hardcoded rubrics | Missing: RAG for dynamic rubrics, compliance criteria, industry standards |
| **Expert Guidance Agent** | Implemented with tiered responses | Missing: RAG for factual product info, regulatory guidance, best practices |

### Core Platform Features Status

| Feature | Charter Requirement | Current Status |
|---------|---------------------|----------------|
| Tenant isolation | Required for B2B | :warning: Basic structure exists |
| Competency-based rubrics | Required | :white_check_mark: Hardcoded defaults |
| Difficulty-aware evaluation | Required | :white_check_mark: Implemented |
| Expert Mode (In-Session Coach) | Required with KB citation | :warning: Implemented but no KB |
| Template Management (Kaplan-maintained) | Required | :x: Missing |
| Guardrail configuration | Required | :warning: Basic hardcoded rules |

### Charter Quote - Knowledge Grounding Architecture

> "Retrieval-augmented generation (RAG) system supporting per-tenant document repositories. Tagged content categorization (Persona Context, Guardrail, Learner Resource). Citation transparency showing when and what knowledge base content was retrieved. Configurable grounding policies mapped to simulation types."

---

## Part 2: RAG Architecture Strategy

### Overall Multi-Agent RAG System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MULTI-AGENT RAG SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐           │
│  │   Profile     │    │  Simulation   │    │  Evaluation   │           │
│  │  Generation   │    │    Client     │    │    Agent      │           │
│  │    Agent      │    │    Agent      │    │               │           │
│  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘           │
│          │                    │                    │                    │
│          │    ┌───────────────┴───────────────┐    │                    │
│          │    │      Expert Guidance          │    │                    │
│          │    │          Agent                │    │                    │
│          │    └───────────────┬───────────────┘    │                    │
│          │                    │                    │                    │
│          ▼                    ▼                    ▼                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    RETRIEVAL ROUTER                              │   │
│  │   (Determines which KB collections to query based on context)   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│          ┌───────────────────┼───────────────────┐                     │
│          ▼                   ▼                   ▼                      │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐            │
│  │  PERSONA      │   │  GUARDRAILS   │   │   LEARNER     │            │
│  │  CONTEXT      │   │  COLLECTION   │   │   RESOURCES   │            │
│  │  COLLECTION   │   │               │   │   COLLECTION  │            │
│  └───────────────┘   └───────────────┘   └───────────────┘            │
│                              │                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    VECTOR DATABASE                               │   │
│  │         (Azure Cognitive Search / Pinecone / Weaviate)          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Knowledge Base Collections (Per Charter Requirements)

#### Collection 1: **Persona Context** (Tag: `persona_context`)

Purpose: Ground client personas in realistic, domain-specific attributes

```
Documents to Include:
├── Industry Demographics
│   ├── insurance/life-health/client-demographics.json
│   ├── insurance/property-casualty/client-demographics.json
│   ├── wealth-management/hnw-client-profiles.json
│   ├── securities/investor-profiles.json
│   └── real-estate/buyer-seller-profiles.json
│
├── Financial Situation Templates
│   ├── income-brackets-by-occupation.json
│   ├── debt-to-income-ratios.json
│   ├── asset-allocation-patterns.json
│   └── life-stage-financial-needs.json
│
├── Behavioral Archetypes
│   ├── investor-personality-types.json
│   ├── risk-tolerance-profiles.json
│   ├── communication-style-preferences.json
│   └── objection-patterns-by-archetype.json
│
└── Cultural/Regional Considerations
    ├── regional-financial-priorities.json
    └── cultural-communication-norms.json
```

#### Collection 2: **Guardrails** (Tag: `guardrail`)

Purpose: Ensure compliance and prevent harmful/inaccurate information

```
Documents to Include:
├── Regulatory Compliance
│   ├── finra-advertising-rules.md
│   ├── state-insurance-regulations/[state].md
│   ├── sec-investment-advisor-rules.md
│   └── cfpb-consumer-protection.md
│
├── Product Accuracy
│   ├── life-insurance/term-vs-whole-life-facts.md
│   ├── annuities/fixed-vs-variable-facts.md
│   ├── securities/mutual-fund-disclosures.md
│   └── prohibited-claims-list.json
│
├── Ethical Guidelines
│   ├── suitability-requirements.md
│   ├── fiduciary-duty-guidelines.md
│   └── conflict-of-interest-policies.md
│
└── Risk Mitigation
    ├── pii-detection-rules.json
    ├── hallucination-prevention-prompts.md
    └── citation-requirements.md
```

#### Collection 3: **Learner Resources** (Tag: `learner_resource`)

Purpose: Support advisor learning with accurate product/industry knowledge

```
Documents to Include:
├── Product Knowledge
│   ├── insurance/
│   │   ├── life-insurance-fundamentals.md
│   │   ├── health-insurance-types.md
│   │   ├── disability-insurance-guide.md
│   │   └── long-term-care-planning.md
│   ├── wealth-management/
│   │   ├── portfolio-management-basics.md
│   │   ├── retirement-planning-strategies.md
│   │   ├── estate-planning-fundamentals.md
│   │   └── tax-optimization-strategies.md
│   └── securities/
│       ├── investment-vehicles-overview.md
│       ├── risk-assessment-methods.md
│       └── market-analysis-basics.md
│
├── Sales Techniques
│   ├── needs-assessment-frameworks.md
│   ├── objection-handling-strategies.md
│   ├── rapport-building-techniques.md
│   └── closing-strategies-ethical.md
│
├── Competency Rubrics
│   ├── communication-rubric-by-difficulty.json
│   ├── needs-assessment-rubric.json
│   ├── rapport-building-rubric.json
│   └── solution-recommendation-rubric.json
│
└── Best Practices
    ├── discovery-question-bank.json
    ├── client-objection-response-bank.json
    └── compliance-conversation-examples.md
```

---

## Part 3: Detailed RAG Strategy by Agent

### 3.1 Profile Generation Agent

**Current State**: Hardcoded industry settings (`profile-generation-agent.ts:184-228`), basic diversity generation

**File Location**: `backend/agents/profile-generation-agent.ts`

#### RAG Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│               PROFILE GENERATION AGENT - RAG FLOW                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUT: { industry, subcategory, difficulty, focusAreas }               │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 1: QUERY PERSONA CONTEXT COLLECTION                          │ │
│  │                                                                    │ │
│  │ Query: "client demographics for {industry}/{subcategory}"         │ │
│  │ Filter: tenant_id = current_tenant                                │ │
│  │                                                                    │ │
│  │ Retrieved Documents:                                              │ │
│  │ • Industry-specific income ranges                                 │ │
│  │ • Typical client occupations                                      │ │
│  │ • Common financial situations                                     │ │
│  │ • Life-stage appropriate goals                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 2: QUERY BEHAVIORAL ARCHETYPES                               │ │
│  │                                                                    │ │
│  │ Query: "client behavioral archetypes {difficulty} level"          │ │
│  │                                                                    │ │
│  │ Retrieved Documents:                                              │ │
│  │ • Difficulty-appropriate personality traits                       │ │
│  │ • Communication style preferences                                 │ │
│  │ • Objection patterns for difficulty level                         │ │
│  │ • Trust-building requirements                                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 3: QUERY GUARDRAILS COLLECTION                               │ │
│  │                                                                    │ │
│  │ Query: "profile generation constraints {industry}"                │ │
│  │                                                                    │ │
│  │ Retrieved Documents:                                              │ │
│  │ • Prohibited stereotypes                                          │ │
│  │ • Realistic financial ranges                                      │ │
│  │ • Compliance-safe scenarios                                       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 4: GENERATE GROUNDED PROFILE                                 │ │
│  │                                                                    │ │
│  │ LLM Prompt includes:                                              │ │
│  │ • Retrieved demographic constraints                               │ │
│  │ • Behavioral archetype templates                                  │ │
│  │ • Guardrail restrictions                                          │ │
│  │ • Citation requirements for generated attributes                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  OUTPUT: { profile, citations[], groundingSources[] }                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Sources

| Data Category | Source | Update Frequency | Purpose |
|---------------|--------|------------------|---------|
| Occupation-Income Mapping | Bureau of Labor Statistics, industry surveys | Quarterly | Realistic income ranges by occupation |
| Asset Allocation Patterns | Federal Reserve Survey of Consumer Finances | Annually | Age-appropriate asset distributions |
| Debt Patterns | Consumer Financial Protection Bureau data | Annually | Realistic debt scenarios |
| Life Insurance Needs | LIMRA research studies | Annually | Coverage gap calculations |
| Retirement Readiness | CFP Board research | Annually | Retirement goal realism |
| Regional Financial Behavior | State insurance commission data | Annually | Regional customization |

#### When the Agent Queries RAG

| Event | RAG Query | Collections | Purpose |
|-------|-----------|-------------|---------|
| Profile Request | Demographics for industry/subcategory | PERSONA_CONTEXT | Realistic client attributes |
| Diversity Check | Recent profiles for tenant | PERSONA_CONTEXT | Ensure variety |
| Personality Generation | Archetypes for difficulty | PERSONA_CONTEXT | Difficulty-appropriate behavior |
| Goal Generation | Financial goals for life stage | PERSONA_CONTEXT + LEARNER_RESOURCES | Realistic objectives |
| Validation | Guardrails for industry | GUARDRAILS | Compliance check |

#### New Tool Handlers Required

```typescript
// New tools to add to ProfileGenerationAgent
this.toolHandlers.set('query_demographics', this.handleQueryDemographics.bind(this));
this.toolHandlers.set('query_archetypes', this.handleQueryArchetypes.bind(this));
this.toolHandlers.set('query_profile_guardrails', this.handleQueryProfileGuardrails.bind(this));
```

---

### 3.2 Simulation Client Agent

**Current State**: In-memory context store, hardcoded difficulty guidelines, no product knowledge

**File Location**: `backend/agents/simulation-client-agent.ts`

#### RAG Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│               SIMULATION CLIENT AGENT - RAG FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ REAL-TIME RAG QUERIES DURING CONVERSATION                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  TRIGGER 1: Advisor Mentions a Product                                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Query PERSONA_CONTEXT: "client questions about {product_type}"    │ │
│  │                                                                    │ │
│  │ Retrieved: Realistic client questions/concerns about product      │ │
│  │ • "What's the difference between term and whole life?"            │ │
│  │ • "Why would I need disability insurance?"                        │ │
│  │ • Based on persona's financial literacy level                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  TRIGGER 2: Advisor Makes a Recommendation                              │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Query PERSONA_CONTEXT: "objection patterns {archetype} {product}" │ │
│  │                                                                    │ │
│  │ Retrieved: Archetype-specific objections                          │ │
│  │ • Skeptical archetype: "How do I know this company is reliable?"  │ │
│  │ • Cost-conscious: "That seems expensive for my budget"            │ │
│  │ • Past bad experience: "My father bought insurance and..."        │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  TRIGGER 3: Advisor Asks Discovery Questions                            │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Query PERSONA_CONTEXT: "information disclosure {difficulty}"      │ │
│  │                                                                    │ │
│  │ Retrieved: What client reveals at this difficulty level           │ │
│  │ • Beginner: Full disclosure on first ask                          │ │
│  │ • Intermediate: Partial disclosure, follow-up needed              │ │
│  │ • Advanced: Guarded, requires trust-building first                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  TRIGGER 4: Advisor Uses Technical Jargon                               │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Query GUARDRAILS: "client confusion triggers {jargon_term}"       │ │
│  │                                                                    │ │
│  │ Retrieved: Realistic client confusion responses                   │ │
│  │ • "What do you mean by 'beneficiary designation'?"                │ │
│  │ • "I don't understand what a 'rider' is"                          │ │
│  │ Client asks for clarification based on knowledge level            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Sources

| Data Category | Source | Purpose |
|---------------|--------|---------|
| **Objection Libraries** | Sales training organizations (LIMRA, NAIFA) | Realistic client pushback scenarios |
| **Question Banks** | Client surveys, focus groups | Authentic client questions |
| **Emotional Response Patterns** | Behavioral finance research | Realistic emotional reactions |
| **Information Disclosure Rules** | Negotiation psychology research | Difficulty-calibrated information sharing |
| **Product Misconceptions** | Consumer research studies | Common client misunderstandings |
| **Trust-Building Triggers** | Relationship selling research | What builds/damages client trust |

#### When the Agent Queries RAG

| Event | RAG Query | Purpose |
|-------|-----------|---------|
| Conversation Start | Client greeting patterns for archetype | Natural conversation opener |
| Advisor asks about goals | Goal articulation templates for life stage | Realistic goal description |
| Advisor mentions product | Product-specific question/objection bank | Authentic client response |
| Advisor explains concept | Confusion indicators by knowledge level | Appropriate follow-up questions |
| Advisor builds rapport | Trust indicator thresholds | When to "warm up" to advisor |
| Advisor makes assumption | Defensive response patterns | Realistic pushback |

#### New Tool Handlers Required

```typescript
// New tools to add to SimulationClientAgent
this.toolHandlers.set('query_objection_patterns', this.handleQueryObjectionPatterns.bind(this));
this.toolHandlers.set('query_client_questions', this.handleQueryClientQuestions.bind(this));
this.toolHandlers.set('query_disclosure_rules', this.handleQueryDisclosureRules.bind(this));
this.toolHandlers.set('query_confusion_triggers', this.handleQueryConfusionTriggers.bind(this));
```

---

### 3.3 Evaluation Agent

**Current State**: Hardcoded rubrics (`evaluation-agent.ts:59-99`), static competency definitions

**File Location**: `backend/agents/evaluation-agent.ts`

#### RAG Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│               EVALUATION AGENT - RAG FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUT: { messages[], competencies[], difficulty, industry }            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 1: RETRIEVE INDUSTRY-SPECIFIC RUBRICS                        │ │
│  │                                                                    │ │
│  │ Query LEARNER_RESOURCES:                                          │ │
│  │   "evaluation rubric {competency} {industry} {difficulty}"        │ │
│  │                                                                    │ │
│  │ Retrieved:                                                        │ │
│  │ • Industry-specific scoring criteria                              │ │
│  │ • Difficulty-adjusted expectations                                │ │
│  │ • Behavioral indicators for each score level                      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 2: RETRIEVE COMPLIANCE CRITERIA                              │ │
│  │                                                                    │ │
│  │ Query GUARDRAILS:                                                 │ │
│  │   "compliance evaluation criteria {industry}"                     │ │
│  │                                                                    │ │
│  │ Retrieved:                                                        │ │
│  │ • Required disclosures that should have been made                 │ │
│  │ • Prohibited claims to check for                                  │ │
│  │ • Suitability assessment requirements                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 3: RETRIEVE EXAMPLE RESPONSES                                │ │
│  │                                                                    │ │
│  │ Query LEARNER_RESOURCES:                                          │ │
│  │   "exemplary advisor responses {competency} {industry}"           │ │
│  │                                                                    │ │
│  │ Retrieved:                                                        │ │
│  │ • Gold-standard response examples for comparison                  │ │
│  │ • Common mistakes to identify                                     │ │
│  │ • Improvement suggestions                                         │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ STEP 4: GENERATE GROUNDED EVALUATION                              │ │
│  │                                                                    │ │
│  │ LLM evaluates conversation against:                               │ │
│  │ • Retrieved rubric criteria (with citations)                      │ │
│  │ • Compliance requirements (with citations)                        │ │
│  │ • Exemplary response comparisons                                  │ │
│  │                                                                    │ │
│  │ OUTPUT includes:                                                  │ │
│  │ • Scores with rubric citations                                    │ │
│  │ • Compliance flags with regulation citations                      │ │
│  │ • Improvement suggestions with best-practice citations            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Sources

| Data Category | Source | Purpose |
|---------------|--------|---------|
| **Competency Rubrics** | LIMRA competency frameworks, CFP Board standards | Scoring criteria |
| **Compliance Checklists** | FINRA rules, state insurance regulations | Regulatory compliance evaluation |
| **Best Practice Examples** | Sales training organizations, case studies | Exemplary response comparison |
| **Common Mistakes** | Training feedback databases, error analysis | Issue identification |
| **Improvement Resources** | Training curricula, remediation guides | Targeted feedback |

#### When the Agent Queries RAG

| Evaluation Phase | RAG Query | Purpose |
|------------------|-----------|---------|
| Pre-evaluation | Rubric for competency + difficulty + industry | Get scoring criteria |
| Compliance check | Regulatory requirements for industry | Check for violations |
| Scoring | Behavioral indicators for score ranges | Calibrate scores |
| Feedback generation | Improvement strategies for identified gaps | Actionable recommendations |
| Citation | Source documents for all claims | Transparency |

#### New Tool Handlers Required

```typescript
// New tools to add to EvaluationAgent
this.toolHandlers.set('query_rubrics', this.handleQueryRubrics.bind(this));
this.toolHandlers.set('query_compliance_criteria', this.handleQueryComplianceCriteria.bind(this));
this.toolHandlers.set('query_exemplary_responses', this.handleQueryExemplaryResponses.bind(this));
this.toolHandlers.set('query_improvement_strategies', this.handleQueryImprovementStrategies.bind(this));
```

---

### 3.4 Expert Guidance Agent (MOST CRITICAL FOR RAG)

**Current State**: Tiered response system, but no knowledge base - relies entirely on LLM knowledge

**File Location**: `backend/agents/expert-guidance-agent.ts`

#### RAG Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│               EXPERT GUIDANCE AGENT - RAG FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  This agent has THREE MODES of knowledge retrieval:                     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ MODE 1: FACTUAL QUERY (Tier 1)                                    │ │
│  │ Trigger: "What is...", "Explain...", "Types of..."                │ │
│  │                                                                    │ │
│  │ Query LEARNER_RESOURCES:                                          │ │
│  │   "factual information {topic} {industry}"                        │ │
│  │                                                                    │ │
│  │ Retrieved:                                                        │ │
│  │ • Product definitions with sources                                │ │
│  │ • Feature comparisons                                             │ │
│  │ • Regulatory context                                              │ │
│  │                                                                    │ │
│  │ PLUS Query GUARDRAILS:                                            │ │
│  │   "accuracy constraints {topic}"                                  │ │
│  │                                                                    │ │
│  │ Retrieved:                                                        │ │
│  │ • What NOT to claim                                               │ │
│  │ • Required disclaimers                                            │ │
│  │ • Citation requirements                                           │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ MODE 2: COACHING QUERY (Tier 2)                                   │ │
│  │ Trigger: "How should I...", "Strategy for...", "Handle..."        │ │
│  │                                                                    │ │
│  │ Query LEARNER_RESOURCES:                                          │ │
│  │   "coaching strategy {competency} {situation}"                    │ │
│  │                                                                    │ │
│  │ Retrieved:                                                        │ │
│  │ • Step-by-step approach                                           │ │
│  │ • Sample questions to ask                                         │ │
│  │ • What to avoid                                                   │ │
│  │                                                                    │ │
│  │ Query PERSONA_CONTEXT:                                            │ │
│  │   "client archetype response patterns {archetype}"                │ │
│  │                                                                    │ │
│  │ Retrieved:                                                        │ │
│  │ • What this specific client archetype responds to                 │ │
│  │ • Trust-building triggers for this archetype                      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ MODE 3: COMPREHENSIVE QUERY (Tier 3)                              │ │
│  │ Trigger: Complex multi-part questions                             │ │
│  │                                                                    │ │
│  │ MULTI-QUERY FUSION:                                               │ │
│  │                                                                    │ │
│  │ Query 1 (LEARNER_RESOURCES): Product/concept information          │ │
│  │ Query 2 (GUARDRAILS): Compliance constraints                      │ │
│  │ Query 3 (PERSONA_CONTEXT): Client-specific considerations         │ │
│  │ Query 4 (LEARNER_RESOURCES): Sales strategy for situation         │ │
│  │                                                                    │ │
│  │ FUSION: Combine all retrieved context into comprehensive guidance │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ CITATION TRANSPARENCY (Charter Requirement)                       │ │
│  │                                                                    │ │
│  │ Every response includes:                                          │ │
│  │ • [Source: {document_name}] for factual claims                    │ │
│  │ • [Regulation: {reg_id}] for compliance guidance                  │ │
│  │ • [Best Practice: {source}] for recommendations                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Sources

| Data Category | Source Type | Examples | Update Frequency |
|---------------|------------|----------|------------------|
| **Product Knowledge** | Carrier documentation, industry guides | Life insurance types, annuity features, mutual fund categories | Quarterly |
| **Regulatory Guidance** | FINRA, SEC, State Insurance Departments | Advertising rules, suitability requirements, disclosure obligations | As regulations change |
| **Sales Best Practices** | Training organizations | LIMRA, NAIFA, CLU/ChFC curricula | Annually |
| **Objection Handling** | Sales training banks | Response strategies, reframing techniques | Quarterly |
| **Client Psychology** | Behavioral finance research | Decision-making patterns, trust factors | Annually |
| **Compliance Do's/Don'ts** | Legal/compliance teams | Prohibited claims, required disclosures | Monthly |

#### When the Agent Queries RAG

| Question Type | Collections Queried | Purpose |
|---------------|---------------------|---------|
| "What is term life insurance?" | LEARNER_RESOURCES + GUARDRAILS | Accurate definition + disclaimers |
| "How do I handle price objections?" | LEARNER_RESOURCES + PERSONA_CONTEXT | Strategy + client-specific approach |
| "Should I recommend an annuity?" | LEARNER_RESOURCES + GUARDRAILS | Product info + suitability requirements |
| "What questions should I ask?" | LEARNER_RESOURCES | Discovery question bank |
| "How do I build trust with this client?" | PERSONA_CONTEXT | Archetype-specific trust triggers |

#### New Tool Handlers Required

```typescript
// New tools to add to ExpertGuidanceAgent
this.toolHandlers.set('query_product_knowledge', this.handleQueryProductKnowledge.bind(this));
this.toolHandlers.set('query_regulatory_guidance', this.handleQueryRegulatoryGuidance.bind(this));
this.toolHandlers.set('query_sales_strategies', this.handleQuerySalesStrategies.bind(this));
this.toolHandlers.set('query_archetype_tactics', this.handleQueryArchetypeTactics.bind(this));
this.toolHandlers.set('query_compliance_constraints', this.handleQueryComplianceConstraints.bind(this));
```

---

## Part 4: Implementation Strategies

### 4.1 Vector Database Selection

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Azure Cognitive Search** | Native Azure integration, hybrid search | Cost at scale | :white_check_mark: **Recommended for MVP** (aligns with charter's Azure-first approach) |
| **Pinecone** | High performance, managed | Additional vendor | Good for scale |
| **Weaviate** | Open source, flexible | Self-managed | Good for cost control |
| **PostgreSQL + pgvector** | Uses existing Neon DB | Limited scale | Quick prototype option |

### 4.2 Embedding Model Strategy

For financial services domain:

```
Recommended: Azure OpenAI text-embedding-3-large

Configuration:
- Dimensions: 3072 (full) or 1536 (reduced for cost)
- Chunking: 512 tokens with 50 token overlap
- Metadata fields:
  - tenant_id (for multi-tenant isolation)
  - tag (persona_context | guardrail | learner_resource)
  - industry (insurance | wealth-management | securities | real-estate)
  - subcategory (e.g., life-health, property-casualty)
  - document_type (rubric | product_info | regulation | best_practice)
  - last_updated (timestamp)
  - source (document origin)
```

### 4.3 Retrieval Strategy by Agent

| Agent | Retrieval Strategy | Timing | Rationale |
|-------|-------------------|--------|-----------|
| **Profile Generation** | Batch retrieval | At generation start | One-time context gathering |
| **Simulation Client** | Real-time semantic search | Per-turn | Dynamic response to conversation |
| **Evaluation** | Batch retrieval | At review start | Comprehensive rubric gathering |
| **Expert Guidance** | Hybrid (semantic + keyword) | Per-query | Balance precision and recall |

### 4.4 Multi-Tenant Isolation Strategy

Per charter requirement for tenant isolation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT RAG ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    KAPLAN BASE KNOWLEDGE                         │   │
│  │            (Shared across all tenants - read only)               │   │
│  │                                                                  │   │
│  │  • Core product knowledge                                        │   │
│  │  • Regulatory compliance (FINRA, SEC, state regulations)        │   │
│  │  • Base competency rubrics                                       │   │
│  │  • Industry best practices                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│           ┌──────────────────┼──────────────────┐                      │
│           ▼                  ▼                  ▼                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │  Tenant A   │    │  Tenant B   │    │  Tenant C   │                 │
│  │ (Ameriprise)│    │ (MetLife)   │    │ (B2C Retail)│                 │
│  │             │    │             │    │             │                 │
│  │ +Custom KB  │    │ +Custom KB  │    │ Kaplan-only │                 │
│  │ +Custom     │    │ +Custom     │    │             │                 │
│  │  Rubrics    │    │  Products   │    │             │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                         │
│  Query Routing Logic:                                                   │
│  1. Check tenant-specific KB first (if exists)                          │
│  2. Fall back to Kaplan base KB                                         │
│  3. Merge results with tenant content taking priority                   │
│  4. Apply tenant-specific guardrails                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.5 RAG Service Architecture

New service to be created: `backend/services/rag-service.ts`

```typescript
// Proposed RAG Service Interface
interface RAGService {
  // Core retrieval
  query(params: {
    collection: 'persona_context' | 'guardrail' | 'learner_resource';
    query: string;
    filters: {
      tenant_id?: string;
      industry?: string;
      subcategory?: string;
      difficulty?: string;
    };
    topK?: number;
  }): Promise<RetrievalResult[]>;

  // Multi-collection retrieval
  multiQuery(queries: QueryParams[]): Promise<RetrievalResult[][]>;

  // Document management
  ingestDocument(doc: Document, metadata: DocumentMetadata): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;

  // Citation tracking
  getCitation(retrievalId: string): Citation;
}
```

---

## Part 5: Agent Improvement Strategies

### 5.1 Profile Generation Agent Improvement

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Diversity Analytics** | Track generated profiles in vector DB, identify clustering patterns | Ensure diverse client scenarios across sessions |
| **Realism Scoring** | Compare generated profiles to anonymized real client data | Improve authenticity of generated personas |
| **Feedback Loop** | Trainers rate profile realism after sessions | Continuous improvement based on expert feedback |
| **A/B Testing** | Compare RAG-grounded vs. pure LLM profiles | Quantify RAG benefit and tune retrieval |

### 5.2 Simulation Client Agent Improvement

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Consistency Tracking** | Monitor for persona contradictions across turns using embedding similarity | Reduce hallucination and maintain character |
| **Emotional State Calibration** | Track trust/frustration curves across sessions, compare to expected patterns | Realistic emotional arcs |
| **Objection Effectiveness** | Measure which objections challenge advisors most (by score impact) | Better training scenarios |
| **Knowledge Base Expansion** | Add new objections from real client interactions (anonymized) | Current, relevant content |

### 5.3 Evaluation Agent Improvement

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Calibration Sessions** | Compare AI scores to human trainer scores, measure correlation | Reduce scoring bias, improve reliability |
| **Rubric Refinement** | Analyze score distributions, adjust criteria for better differentiation | More meaningful score ranges |
| **Evidence Quality** | Track citation accuracy for feedback (spot-check retrieved content) | Defensible, verifiable evaluations |
| **Competency Gap Analysis** | Aggregate scores across learners to identify systemic training needs | Program-level improvement insights |

### 5.4 Expert Guidance Agent Improvement

| Strategy | Implementation | Benefit |
|----------|----------------|---------|
| **Citation Accuracy Audit** | Periodic verification that RAG citations are correct and current | Prevent misinformation in guidance |
| **Helpfulness Rating** | Advisors rate guidance usefulness (thumbs up/down + optional comment) | Content quality improvement |
| **Query Analysis** | Track common questions, identify KB gaps, prioritize content creation | Proactive content development |
| **Hallucination Detection** | Flag responses that lack citations or cite non-existent content | Quality control and trust |

---

## Part 6: Summary - RAG Implementation Priorities

### Priority 1: MVP Critical

| Agent | RAG Capability | Charter Reference | Effort |
|-------|----------------|-------------------|--------|
| **Expert Guidance** | Product knowledge + Guardrails + Citations | "Knowledge base citation with references" | High |
| **Evaluation** | Dynamic rubrics from KB | "Competency-based rubrics aligned to financial services skill frameworks" | Medium |

### Priority 2: MVP Important

| Agent | RAG Capability | Charter Reference | Effort |
|-------|----------------|-------------------|--------|
| **Simulation Client** | Objection patterns + Response grounding | "AI-generated personas with unique backgrounds, personalities" | High |
| **Profile Generation** | Demographic grounding + Diversity | "Per-tenant document repositories" | Medium |

### Priority 3: Post-MVP

| Capability | Purpose | Effort |
|------------|---------|--------|
| Per-tenant custom KB upload | B2B enterprise customization | High |
| Automated KB updates | Keep content current with regulatory changes | Medium |
| Multi-lingual support | International expansion | High |
| Predictive analytics | Learner success modeling | High |

### Implementation Roadmap

```
Phase 1 (Weeks 1-4): Foundation
├── Set up Azure Cognitive Search
├── Create embedding pipeline
├── Implement RAG service base
└── Seed initial Kaplan base KB

Phase 2 (Weeks 5-8): Expert Guidance RAG
├── Integrate RAG into Expert Guidance Agent
├── Implement citation transparency
├── Add guardrail retrieval
└── Test with pilot users

Phase 3 (Weeks 9-12): Evaluation RAG
├── Migrate rubrics to KB
├── Add compliance criteria retrieval
├── Implement exemplary response comparison
└── Calibrate against human evaluators

Phase 4 (Weeks 13-16): Client & Profile RAG
├── Add objection pattern retrieval
├── Implement demographic grounding
├── Add persona consistency checking
└── Full integration testing

Phase 5 (Post-MVP): Multi-Tenant
├── Per-tenant KB isolation
├── Custom document upload
├── Tenant-specific guardrails
└── Admin tools for KB management
```

---

## Sources

### Research Papers & Technical Resources

- [RAG in 2025: Bridging Knowledge and Generative AI - Squirro](https://squirro.com/squirro-blog/state-of-rag-genai)
- [Retrieval Augmented Generation (RAG) for Fintech: Agentic Design and Evaluation](https://arxiv.org/html/2510.25518v1)
- [Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG](https://arxiv.org/abs/2501.09136)
- [RAG Architecture for Financial Compliance Knowledge Retrieval](https://www.auxiliobits.com/blog/rag-architecture-for-domain-specific-knowledge-retrieval-in-financial-compliance/)
- [Enhancing Persona Consistency for LLMs' Role-Playing using Persona-Aware Contrastive Learning](https://arxiv.org/html/2503.17662v1)
- [Call for Customized Conversation: Customized Conversation Grounding Persona and Knowledge](https://arxiv.org/abs/2112.08619)

### Industry Resources

- [Agentic AI for Insurance Agents & Bank Advisors - Zelros](https://www.zelros.com/2025/01/17/agentic-ai-for-insurance-agents-bank-advisors-the-complete-guide/)
- [AI Roleplay for Training Insurance Agents - Exec](https://www.exec.com/learn/ai-roleplay-for-training-insurance-agents-on-empathy)
- [What Is Multi-Agent RAG? Components & Benefits - GigaSpaces](https://www.gigaspaces.com/data-terms/multi-agent-rag)
- [Agentic RAG: What it is, its types, applications and implementation - LeewayHertz](https://www.leewayhertz.com/agentic-rag/)
- [RAG for Finance: Automating Document Analysis with LLMs - CFA Institute](https://rpc.cfainstitute.org/research/the-automation-ahead-content-series/retrieval-augmented-generation)

### RAG Evaluation

- [RAG Evaluation Metrics - Confident AI](https://www.confident-ai.com/blog/rag-evaluation-metrics-answer-relevancy-faithfulness-and-more)
- [A Complete Guide to RAG Evaluation - Evidently AI](https://www.evidentlyai.com/llm-guide/rag-evaluation)
- [An Overview on RAG Evaluation - Weaviate](https://weaviate.io/blog/rag-evaluation)

---

## Appendix A: Current Agent File References

| Agent | File | Key Lines for Modification |
|-------|------|---------------------------|
| Base Agent | `backend/agents/base-agent.ts` | 124-239 (chat method) |
| Simulation Client | `backend/agents/simulation-client-agent.ts` | 76-80 (tool handlers), 177-215 (generateResponse) |
| Profile Generation | `backend/agents/profile-generation-agent.ts` | 54-59 (tool handlers), 121-179 (generateProfile) |
| Evaluation | `backend/agents/evaluation-agent.ts` | 115-119 (tool handlers), 212-302 (generateReview) |
| Expert Guidance | `backend/agents/expert-guidance-agent.ts` | 54-58 (tool handlers), 119-167 (generateGuidance) |

## Appendix B: Charter Quotes - Knowledge Architecture

> **From Charter Section "Knowledge Grounding Architecture":**
>
> "Retrieval-augmented generation (RAG) system supporting per-tenant document repositories. Tagged content categorization (Persona Context, Guardrail, Learner Resource). Citation transparency showing when and what knowledge base content was retrieved. Configurable grounding policies mapped to simulation types."

> **From Charter Section "Knowledge Base":**
>
> "Per-tenant document upload with file type and size limit support. Tagging system: Persona Context, Guardrail, Learner Resource. Retrieval-augmented generation (RAG) capability with citation transparency. Grounding policy configuration mapped to simulation types. Configuration of which knowledge base content applies to which simulation categories."

> **From Charter Section "Expert Mode (In-Session Coach)":**
>
> "Optional AI coaching persona providing strategy guidance and SME hints. Knowledge base citation with references. Context-aware next-step suggestions within scenarios."
