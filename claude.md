# Skill Simulator MVP - Architecture & System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Core Architecture](#core-architecture)
4. [Data Flow & User Journey](#data-flow--user-journey)
5. [AI Simulation Engine](#ai-simulation-engine)
6. [Performance Tracking & Feedback System](#performance-tracking--feedback-system)
7. [Key Modules & Components](#key-modules--components)
8. [Database Schema](#database-schema)
9. [API Routes](#api-routes)
10. [Code Flow Diagrams](#code-flow-diagrams)

---

## System Overview

### Purpose
The Skill Simulator is an AI-powered training platform designed for financial services professionals (insurance, wealth management, securities). Users practice client interactions with AI-simulated clients that exhibit realistic personalities, emotional states, and industry-specific behaviors.

### Key Capabilities
- **Dynamic AI Client Simulation**: AI-generated clients with realistic personalities, emotional states, and behaviors
- **Expert Coaching Mode**: On-demand AI expert guidance during simulations
- **Real-time Performance Tracking**: Continuous assessment of competencies with live feedback
- **Emotional State Modeling**: Clients react dynamically to advisor behavior (trust, frustration, openness)
- **Multi-level Difficulty**: Beginner, Intermediate, and Advanced difficulty levels with different client behaviors
- **Comprehensive Performance Review**: AI-generated detailed feedback using OpenAI GPT-4o

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 (React 19)
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **State Management**: Zustand (for parameter catalog), React Context (for interface mode)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

### Backend
- **Runtime**: Next.js API Routes (Server Actions)
- **AI Integration**:
  - Vercel AI SDK (`ai` package)
  - OpenAI SDK (`@ai-sdk/openai`)
  - Model: GPT-4o
- **Database**: Neon Serverless Postgres (`@neondatabase/serverless`)
- **Authentication**: NextAuth.js (latest)

### Key Dependencies
- **AI/ML**: `openai`, `ai`, `@ai-sdk/openai`
- **Data Processing**: `csv-parse`, `immer`
- **Security**: `bcryptjs`, `crypto`
- **Utilities**: `date-fns`, `uuid`, `zod`

---

## Core Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Setup     │  │  Simulation  │  │   Review &        │  │
│  │   Pages     │  │   Session    │  │   Feedback        │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Profile     │  │  Simulation  │  │  Performance     │  │
│  │  Generator   │  │  Actions     │  │  Review          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Engine Layer                         │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  Client AI       │  │  Expert Coach AI                 │ │
│  │  (GPT-4o)        │  │  (GPT-4o)                        │ │
│  │  - Personality   │  │  - Tiered Responses              │ │
│  │  - Emotions      │  │  - Factual/Coaching/Comprehensive│ │
│  │  - Objectives    │  │  - Risk Mitigation               │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Neon        │  │  Session     │  │  JSON Data       │  │
│  │  Postgres    │  │  Storage     │  │  Files           │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App Root (layout.tsx)
├── Authentication Layer (auth-provider.tsx)
├── Theme Provider (theme-provider.tsx)
└── Main Routes
    ├── / (Home/Dashboard)
    ├── /simulation
    │   ├── /attestation - Terms acceptance
    │   ├── /industry-selection - Choose industry/subcategory
    │   ├── /setup - Configure simulation & view client profile
    │   ├── /session - Active simulation
    │   ├── /review - Performance feedback
    │   └── /history/[id] - Past simulation review
    ├── /admin
    │   ├── /competencies - Manage competencies
    │   ├── /parameter-catalog - Manage AI parameters
    │   ├── /user-management - Manage users
    │   ├── /api-settings - Configure API keys
    │   ├── /feedback - View NPS feedback
    │   └── /industry-settings - Configure industry traits
    └── /profile-generator - Generate client profiles
```

---

## Data Flow & User Journey

### Complete User Flow

```
START
  │
  ├─► 1. LOGIN/SIGNUP
  │    └─► Authentication via NextAuth
  │         └─► Session created
  │
  ├─► 2. SIMULATION SETUP (Attestation)
  │    └─► /simulation/attestation
  │         └─► User accepts terms
  │              └─► Session: acceptedTerms = true
  │
  ├─► 3. INDUSTRY SELECTION
  │    └─► /simulation/industry-selection
  │         ├─► Select industry (insurance/wealth-management/securities)
  │         ├─► Select subcategory (for insurance)
  │         ├─► Select difficulty (beginner/intermediate/advanced)
  │         ├─► Select competencies to evaluate
  │         └─► Select focus areas (optional)
  │              └─► Session: industry, subcategory, difficulty, competencies, focusAreas
  │
  ├─► 4. PROFILE GENERATION & PREVIEW
  │    └─► /simulation/setup
  │         ├─► Calls getProfileForSimulation()
  │         │    ├─► Fetches industry settings
  │         │    ├─► Calls generateProfile() with AI
  │         │    └─► Returns ClientProfile with:
  │         │         ├─► Demographics (name, age, occupation)
  │         │         ├─► Financial details (income, assets, debts)
  │         │         ├─► Goals and concerns
  │         │         └─► Fusion Model Traits (personality)
  │         ├─► Displays client profile (filtered by difficulty)
  │         ├─► Shows simulation parameters
  │         ├─► Shows competencies being evaluated
  │         └─► User clicks "Continue to Simulation"
  │              └─► Session: clientProfile, simulationId
  │
  ├─► 5. SIMULATION SESSION
  │    └─► /simulation/session
  │         ├─► INITIALIZATION
  │         │    ├─► Load client profile from session
  │         │    ├─► Initialize emotional state
  │         │    ├─► Set personality traits
  │         │    └─► Send initial client greeting
  │         │         └─► generateClientResponse() → AI greeting
  │         │
  │         ├─► CONVERSATION LOOP
  │         │    ├─► User types message
  │         │    ├─► trackMessageSent() → engagement tracking
  │         │    ├─► processMessageForEmotionalImpact() → update client emotions
  │         │    ├─► generateClientResponse()
  │         │    │    ├─► Build system prompt with:
  │         │    │    │    ├─► Client profile
  │         │    │    │    ├─► Personality traits
  │         │    │    │    ├─► Emotional state
  │         │    │    │    ├─► Difficulty guidelines
  │         │    │    │    └─► Focus areas
  │         │    │    ├─► Call OpenAI GPT-4o API
  │         │    │    └─► Return client response
  │         │    │
  │         │    ├─► OBJECTIVE TRACKING (parallel call)
  │         │    │    ├─► Separate AI call with function calling
  │         │    │    ├─► trackObjectiveProgress()
  │         │    │    └─► Returns scores for:
  │         │    │         ├─► Rapport (0-100)
  │         │    │         ├─► Needs Assessment (0-100)
  │         │    │         ├─► Objection Handling (0-100)
  │         │    │         └─► Recommendations (0-100)
  │         │    │
  │         │    └─► Update UI with scores and feedback
  │         │
  │         ├─► EXPERT MODE (optional)
  │         │    ├─► User clicks "Need Help?"
  │         │    ├─► Toggle expert mode
  │         │    ├─► User asks coaching question
  │         │    ├─► generateExpertResponse()
  │         │    │    ├─► Determine response tier (1-3)
  │         │    │    ├─► Build expert system prompt
  │         │    │    ├─► Call OpenAI GPT-4o API
  │         │    │    └─► Return coaching advice
  │         │    └─► User returns to client mode
  │         │
  │         └─► END SIMULATION
  │              ├─► User clicks "End & Review"
  │              ├─► Calculate completion metrics
  │              ├─► trackEngagementMetrics()
  │              └─► Store session data to sessionStorage
  │                   └─► Navigate to /simulation/review
  │
  ├─► 6. PERFORMANCE REVIEW
  │    └─► /simulation/review
  │         ├─► Load session data
  │         ├─► Call generatePerformanceReview()
  │         │    ├─► Fetch rubrics from data/rubrics.json
  │         │    ├─► Build review prompt with:
  │         │    │    ├─► Conversation history
  │         │    │    ├─► Competency criteria
  │         │    │    ├─► Difficulty-specific expectations
  │         │    │    └─► Rubric guidelines
  │         │    ├─► Call OpenAI GPT-4o API
  │         │    └─► Parse JSON response with:
  │         │         ├─► Overall score (1-10)
  │         │         ├─► Competency scores (1-10 each)
  │         │         ├─► Strengths list
  │         │         ├─► Improvements list
  │         │         └─► Detailed feedback
  │         │
  │         ├─► Display review dashboard with:
  │         │    ├─► Simulation summary
  │         │    ├─► Radar chart of competency scores
  │         │    ├─► Detailed competency breakdown
  │         │    ├─► Key simulation moments timeline
  │         │    └─► Full conversation transcript
  │         │
  │         ├─► NPS Feedback dialog
  │         │    └─► User rates experience (0-10)
  │         │
  │         └─► Next actions
  │              ├─► New simulation
  │              ├─► View history
  │              └─► Return to dashboard
  │
  └─► END
```

---

## AI Simulation Engine

### Client AI Role (`generateClientResponse`)

**Location**: `/app/api/simulation/actions.ts`

#### Purpose
Generates realistic client responses during simulations, maintaining personality consistency and reacting to advisor behavior.

#### Architecture

```
generateClientResponse()
├─► 1. PREPARE PERSONALITY
│    ├─► Load fusion model traits from clientProfile
│    ├─► Build fusion prompt block (age, mood, archetype, style)
│    └─► Map traits to conversational profiles
│
├─► 2. BUILD SYSTEM PROMPT
│    ├─► formatSystemPrompt()
│    │    ├─► Client demographics
│    │    ├─► Personality traits with examples
│    │    ├─► Industry context
│    │    ├─► Difficulty guidelines
│    │    ├─► Focus areas (if any)
│    │    └─► Behavioral instructions
│    │
│    ├─► Add difficulty-specific disclosure rules
│    │    ├─► Beginner: Open, shares readily
│    │    ├─► Intermediate: Reserved, needs trust
│    │    └─► Advanced: Skeptical, very guarded
│    │
│    └─► Add inappropriate behavior responses
│
├─► 3. EMOTIONAL STATE PROCESSING
│    ├─► initializeEmotionalContext()
│    │    └─► Base emotional state from personality
│    │
│    ├─► Process conversation history
│    │    ├─► detectActions() - identify advisor behaviors
│    │    └─► updateEmotionalState() - adjust emotions
│    │
│    ├─► injectDynamicContext()
│    │    └─► Add emotional state to prompt
│    │
│    └─► getEmotionalStateDescription()
│         ├─► Trust level guidance
│         ├─► Frustration level guidance
│         ├─► Openness level guidance
│         └─► Crisis response (if trust < 30 or frustration > 70)
│
├─► 4. GENERATE CLIENT RESPONSE
│    ├─► Call OpenAI GPT-4o via Vercel AI SDK
│    │    ├─► Model: gpt-4o
│    │    ├─► Temperature: 0.7
│    │    ├─► Max tokens: 1000
│    │    └─► Messages: [system prompt, conversation history]
│    │
│    └─► Return client response text
│
└─► 5. EVALUATE OBJECTIVES (parallel call)
     ├─► Build separate evaluation prompt
     ├─► Call OpenAI with function calling
     │    ├─► Function: trackObjectiveProgress
     │    ├─► Temperature: 0.3
     │    └─► Max tokens: 500
     │
     └─► Return objective scores:
          ├─► rapport (0-100)
          ├─► needs (0-100)
          ├─► objections (0-100)
          ├─► recommendations (0-100)
          ├─► decreaseReason (if scores dropped)
          └─► explanation
```

#### Personality Trait Mapping

**Traits** (0-100 scale):
- **Openness**: Willingness to consider new ideas
- **Conscientiousness**: Attention to detail
- **Extraversion**: Energy and sociability
- **Agreeableness**: Cooperation level
- **Neuroticism**: Emotional reactivity
- **Assertiveness**: Confidence in expressing needs
- **Honesty-Humility**: Sincerity and fairness

**Mapped to Conversational Behavior**:
```typescript
// Example from trait-behavior-mapping.ts
openness: 75 → "Open-minded"
- Summary: "Very receptive to new ideas"
- Positive example: "That's interesting, tell me more..."
- Negative example: "I'm not sure that approach works for me..."
```

#### Emotional State Model

**State Variables** (`emotional-state-model.ts`):
```typescript
interface EmotionalState {
  trust: number        // 0-100: Trust in advisor
  frustration: number  // 0-100: Frustration level
  openness: number     // 0-100: Willingness to share
  engagement: number   // 0-100: Interest level
  anxiety: number      // 0-100: Anxiety about topic
  timestamp: number    // When recorded
}
```

**Dynamic Updates**:
- Trust increases with good rapport-building, decreases with inappropriate comments
- Frustration increases with poor listening, pressure tactics
- Openness decreases if trust is low or questions are intrusive
- Engagement decreases if conversation is boring or irrelevant

**Critical Thresholds**:
- Trust < 30: Client may end conversation
- Frustration > 70: Client shows visible irritation
- Openness < 30: Client withholds information

---

### Expert AI Role (`generateExpertResponse`)

**Location**: `/app/api/simulation/actions.ts`

#### Purpose
Provides on-demand coaching and guidance to advisors during simulations without breaking immersion.

#### Response Tiers

The expert AI uses a **3-tier response system** based on question classification:

```
┌────────────────────────────────────────────────────────────┐
│ TIER 1: Factual Topic Clarification                       │
├────────────────────────────────────────────────────────────┤
│ Trigger: "What is...", "Explain...", "Define..."          │
│ Structure:                                                 │
│   ## Expert Summary                                        │
│   • Key facts (3-4 bullets)                               │
│   ## Client-Friendly Explanation                          │
│   [Simple conversational explanation]                      │
├────────────────────────────────────────────────────────────┤
│ Example: "What is term life insurance?"                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ TIER 2: Coaching-Only Guidance                            │
├────────────────────────────────────────────────────────────┤
│ Trigger: "How do I...", "What should I...", "Strategy..." │
│ Structure:                                                 │
│   ## Situation Assessment                                  │
│   [Current state analysis]                                 │
│   ## Strategic Coaching                                    │
│   [2-3 actionable steps]                                   │
│   ## Sample Questions                                      │
│   [Questions to ask the client]                           │
├────────────────────────────────────────────────────────────┤
│ Example: "How do I handle this objection about price?"    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ TIER 3: Full Support (Comprehensive)                      │
├────────────────────────────────────────────────────────────┤
│ Trigger: Complex or ambiguous questions                   │
│ Structure:                                                 │
│   ## Expert Information                                    │
│   ## Sample Client Dialogue                               │
│   ## Situation Assessment                                  │
│   ## Recommended Next Steps                               │
│   ## Key Questions to Ask                                 │
├────────────────────────────────────────────────────────────┤
│ Example: Multi-part or complex strategic questions        │
└────────────────────────────────────────────────────────────┘
```

#### Question Classification Algorithm

```typescript
determineResponseTier(question: string): number {
  // 1. Length check
  if (question.length < 100) return 1

  // 2. Keyword scoring
  const factualScore =
    countMatches(question, factualIndicators) * 2 +
    countMatches(question, factualTopics) * 1

  const coachingScore =
    countMatches(question, coachingIndicators) * 2 +
    countMatches(question, coachingTopics) * 1

  // 3. Complexity check
  if (hasMultipleParts(question)) return 3

  // 4. Score-based determination
  if (factualScore > coachingScore && factualScore > 2) return 1
  if (coachingScore > factualScore && coachingScore > 2) return 2

  return 3 // Default comprehensive
}
```

#### Risk Mitigation Guidelines

The expert AI includes **mandatory risk mitigation** to prevent:
- Invented product features or guarantees
- Specific product endorsements
- Unlicensed advice
- Regulatory violations

Example safeguards:
```
⚠️ RISK MITIGATION GUIDELINES:
- Never invent features, tax benefits, guarantees, or endorsements
- Do not claim annuities guarantee growth unless qualified
- Avoid "the best" policy - compare types generally
- Include disclaimers when appropriate
- Note when licensed expertise required
```

---

## Performance Tracking & Feedback System

### Real-Time Objective Tracking

**Objectives** (4 core competencies):
1. **Build Rapport**: Establish connection with client
2. **Needs Assessment**: Discover financial situation and goals
3. **Handle Objections**: Address concerns professionally
4. **Provide Recommendations**: Suggest appropriate options

**Tracking Mechanism**:
```
User Message → generateClientResponse()
                    ↓
         ┌──────────┴──────────┐
         │                     │
    Client Response    Objective Evaluation
         │                     │
         └──────────┬──────────┘
                    ↓
            Update UI with:
            - Scores (0-100)
            - Feedback messages
            - Progress bars
```

**Scoring Logic** (`objectiveTrackingFunctions`):
```typescript
{
  name: "trackObjectiveProgress",
  parameters: {
    rapport: number,        // 0-100
    needs: number,          // 0-100
    objections: number,     // 0-100
    recommendations: number, // 0-100
    decreaseReason?: {      // Only if scores drop
      rapport?: string,
      needs?: string,
      objections?: string,
      recommendations?: string
    },
    explanation: string     // Why scores were assigned
  }
}
```

**Ratcheting System**:
- Scores generally only increase
- Can decrease only for **significant mistakes**:
  - Inappropriate comments/profanity
  - Harmful financial advice
  - Ignoring client concerns
  - Major misunderstanding after clarity
- Requires explicit `decreaseReason` from AI

**UI Display** (`/simulation/session/page.tsx:1259-1384`):
- Progress bar with current score
- High water mark indicator (if decreased)
- Color coding: green (completed), red (decreased), gray (in progress)
- Tooltips explaining ratcheting behavior
- XP rewards on completion

### Performance Review Generation

**Location**: `/app/api/simulation/review-actions.ts`

#### Review Process

```
generatePerformanceReview()
├─► 1. LOAD DATA
│    ├─► Conversation messages
│    ├─► Selected competencies
│    ├─► Difficulty level
│    └─► Rubrics for each competency
│
├─► 2. BUILD EVALUATION PROMPT
│    ├─► Competency-specific criteria
│    │    ├─► Load rubrics.json
│    │    └─► Get criteria by difficulty level
│    │
│    ├─► General evaluation guidelines
│    │    ├─► Critical if < 3 messages
│    │    ├─► Honest scoring (use full 1-10 range)
│    │    └─► Specific examples required
│    │
│    └─► Risk factors
│         ├─► Inappropriate recommendations
│         ├─► Unprofessional language
│         └─► Ignoring client requests
│
├─► 3. CALL OPENAI API
│    ├─► Model: gpt-4o
│    ├─► Temperature: 0.2 (consistent evaluation)
│    ├─► Response format: JSON
│    └─► Messages: [system prompt, conversation]
│
├─► 4. PARSE RESPONSE
│    └─► Extract:
│         ├─► overallScore (1-10)
│         ├─► competencyScores[] (1-10 each)
│         │    ├─► name
│         │    ├─► score
│         │    ├─► strengths[]
│         │    ├─► improvements[]
│         │    ├─► specificExamples[]
│         │    └─► criteria[]
│         ├─► generalStrengths[]
│         ├─► generalImprovements[]
│         ├─► summary (paragraph)
│         └─► conversationAnalysis
│
└─► 5. ENHANCE SCORES
     └─► Add expectation text based on score:
          ├─► 9-10: "Outstanding, exceeds expectations"
          ├─► 7-8: "Strong, meets expectations"
          ├─► 5-6: "Satisfactory, room for improvement"
          ├─► 3-4: "Below expectations, significant improvement needed"
          └─► 1-2: "Critical improvement required, unacceptable"
```

#### Rubric System

**Structure** (`data/rubrics.json`):
```json
{
  "id": "communication-rapport",
  "rubric": {
    "beginner": [
      {
        "range": "9-10",
        "description": "Exceptional performance",
        "criteria": [
          "Consistently uses active listening",
          "Builds genuine rapport quickly",
          "Adapts communication style effectively"
        ]
      },
      // ... more ranges
    ],
    "intermediate": [...],
    "advanced": [...]
  }
}
```

#### Review UI Display

**Location**: `/simulation/review/page.tsx`

**Components**:
1. **Simulation Summary Card**
   - Industry, difficulty, duration, date
   - Overall score (X/10)
   - Total XP earned

2. **Objectives Completed**
   - List of completed objectives
   - XP earned per objective
   - Completion status (green checkmarks)

3. **Key Takeaways**
   - General strengths (bullets)
   - Areas for improvement (bullets)

4. **Performance Summary**
   - AI-generated summary paragraph
   - Toggle for showing/hiding AI feedback

5. **Radar Chart**
   - Visual representation of competency scores
   - Dynamically scaled based on number of competencies

6. **Detailed Competency Breakdown**
   - Score (X/10) with progress bar
   - Performance level expectation
   - Strengths (bullets)
   - Improvements (bullets)

7. **Key Simulation Moments Timeline**
   - Timestamped key events
   - Competency tags
   - Score changes

8. **Full Conversation Tab**
   - Complete message transcript
   - Color-coded by role (user/assistant/system)
   - Formatted with gesture markers and styling

---

## Key Modules & Components

### 1. Profile Generation System

**Location**: `/app/profile-generator/`

#### Profile Generator Actions (`actions.ts`)

**Core Function**: `generateProfile(params: ProfileGenerationParams)`

**Parameters**:
```typescript
interface ProfileGenerationParams {
  industry: string                    // insurance, wealth-management, securities
  subIndustry: string | null          // life-health, property-casualty
  difficulty: string                  // beginner, intermediate, advanced
  complexity: number                  // 10-100
  includeFinancialDetails: boolean
  includeFamilyDetails: boolean
  includePersonalityTraits: boolean
  includeRecentEvents: boolean
  ageGroup?: string
  communicationStyle?: string
  emotionalReactivity?: number
  lifeStageContext?: string
  culturalContext?: string
  includeQuirks?: boolean
  selectedQuirks?: string[]
  focusAreas?: { id: string; name: string }[]
  useCache?: boolean
}
```

**Process**:
1. Check cache for existing profile
2. Fetch industry-specific traits from API
3. Build detailed prompt with:
   - Difficulty-specific guidelines
   - Industry context
   - Focus area requirements
   - Diversity parameters
   - Personality trait specifications
4. Call OpenAI GPT-4o with temperature 0.8
5. Parse JSON response
6. Fallback to predefined profiles if parsing fails
7. Cache for future use (max 50 profiles)

**Output Structure**:
```typescript
interface ClientProfile {
  name: string
  age: number
  occupation: string
  familyStatus: string
  incomeLevel: string
  lifeNarrative: string
  goals: string[]
  concerns: string[]
  financialDetails?: {
    income: string
    assets: string[]
    debts: string[]
  }
  recentEvents?: string[]
  personalityTraits?: {
    riskTolerance: string
    decisionMaking: string
    financialKnowledge: string
    trustLevel: string
  }
  fusionModelTraits?: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
    assertiveness: number
    honestyHumility: number
  }
  fusionModelArchetype?: string
  fusionModelMood?: string
  communicationStyle?: string
  quirks?: string[]
  industryKnowledge?: {
    familiarTerms: string[]
    knowledgeGaps: string[]
    misconceptions: string[]
  }
}
```

#### Fusion Prompt Builder (`fusion-prompt-builder.ts`)

**Purpose**: Creates dynamic personality prompts for AI clients

**Components**:
- **Vocabulary Guidance**: Age-appropriate language
- **Tone Guidance**: Emotional context
- **Reference Guidance**: Cultural/generational references
- **Life Stage**: Career focus, retirement, etc.
- **Communication Style**: Rambler, sniper, overthinker, etc.
- **Archetype**: Analyst, guardian, entrepreneur, etc.
- **Mood**: Confident, anxious, skeptical, etc.

#### Emotional State Store (`emotional-state-store.ts`)

**Purpose**: Manages client emotional state across conversation

**Store Pattern**:
```typescript
class EmotionalStateStore {
  private context: EmotionalContext | null = null

  initialize(profile: ClientProfile)
  getContext(): EmotionalContext | null
  processMessage(message: string, isUser: boolean)
  updateState(newState: EmotionalState)
  reset()
}
```

**Singleton Pattern**:
```typescript
let emotionalStateStore: EmotionalStateStore | null = null

export function getEmotionalStateStore(): EmotionalStateStore {
  if (!emotionalStateStore) {
    emotionalStateStore = new EmotionalStateStore()
  }
  return emotionalStateStore
}
```

#### Conversation State Tracker (`conversation-state-tracker.ts`)

**Purpose**: Detects advisor actions and updates emotional state

**Action Detection**:
```typescript
export function detectActions(message: string): string[] {
  const actions: string[] = []

  // Positive actions
  if (hasReflectiveListening(message)) actions.push('reflective_listening')
  if (hasEmpathenticResponse(message)) actions.push('empathetic_response')
  if (hasOpenQuestion(message)) actions.push('open_question')

  // Negative actions
  if (hasPressureTactics(message)) actions.push('pressure_tactics')
  if (hasInterruption(message)) actions.push('interruption')
  if (hasInappropriateComment(message)) actions.push('inappropriate_comment')

  return actions
}
```

**State Update Rules**:
```typescript
export function updateEmotionalState(
  context: EmotionalContext,
  actions: string[],
  traits: any
): EmotionalContext {
  const newState = { ...context.currentState }

  actions.forEach(action => {
    switch(action) {
      case 'reflective_listening':
        newState.trust += 5
        newState.openness += 3
        break
      case 'pressure_tactics':
        newState.frustration += 10
        newState.trust -= 8
        break
      // ... more action handlers
    }
  })

  return { ...context, currentState: clamp(newState) }
}
```

### 2. Simulation Session Management

**Location**: `/app/simulation/session/page.tsx`

#### State Management

**Key State Variables**:
```typescript
const [messages, setMessages] = useState([])           // Conversation history
const [input, setInput] = useState("")                 // User input
const [isTyping, setIsTyping] = useState(false)        // AI typing indicator
const [expertMode, setExpertMode] = useState(false)    // Expert coaching mode
const [objectives, setObjectives] = useState([])       // Progress tracking
const [notes, setNotes] = useState("")                 // User notes
const [totalXp, setTotalXp] = useState(0)             // XP earned
const [clientProfile, setClientProfile] = useState({}) // Client data
const [showFeedback, setShowFeedback] = useState(true) // Feedback visibility
```

#### Message Handling Flow

```
User types message
  │
  ├─► handleSendMessage()
  │    ├─► Add user message to UI
  │    ├─► trackMessageSent() [engagement tracking]
  │    ├─► recordEvent() [timeline tracking]
  │    └─► processMessageForEmotionalImpact() [emotion update]
  │
  ├─► IF expertMode:
  │    └─► generateExpertResponse()
  │         ├─► Determine tier
  │         ├─► Build expert prompt
  │         └─► Return coaching advice
  │
  ├─► ELSE (client mode):
  │    ├─► generateClientResponse()
  │    │    ├─► Generate client reply
  │    │    └─► Evaluate objectives (parallel)
  │    │
  │    ├─► handleObjectiveProgress()
  │    │    ├─► Check for score decreases
  │    │    ├─► Update high water marks
  │    │    ├─► Display feedback messages
  │    │    └─► Award XP for completions
  │    │
  │    └─► processMessageForEmotionalImpact() [AI response]
  │
  └─► Update UI
       ├─► Show AI response
       ├─► Update objective progress bars
       └─► Scroll to bottom
```

#### Expert Mode Toggle

```typescript
const toggleExpertMode = () => {
  if (!expertMode) {
    // Switching TO expert mode
    setExpertMode(true)
    trackHelpUsage(true, simulationId, userId)
    addSystemMessage("Switching to expert guidance mode...")
  } else {
    // Switching BACK to client mode
    setExpertMode(false)
    trackHelpUsage(false, simulationId, userId)
    addSystemMessage("Returning to client conversation...")
  }
}
```

#### Feedback Visibility

**Purpose**: Allow users to hide real-time AI feedback during practice

**Implementation**:
```typescript
const toggleFeedbackVisibility = () => {
  const newValue = !showFeedback
  setShowFeedback(newValue)
  sessionStorage.setItem("showSimulationFeedback", newValue.toString())
}

// In message rendering:
messages.map(message => {
  // Hide system feedback if showFeedback is false
  if (message.role === "system" &&
      !message.content.includes("XP") &&
      !showFeedback &&
      message.content.includes("Advisor progress")) {
    return null // Don't render
  }
  // ... render message
})
```

#### XP System

**Reward Structure**:
```typescript
const objectiveXP = {
  'rapport': 50,
  'needs': 75,
  'objections': 100,
  'recommendations': 125
}

const bonusXP = {
  'startingSimulation': 25,
  'thoughtfulQuestion': 10,
  'completionBonus': completedObjectives * 50
}
```

**Animation**:
```typescript
const awardXp = (amount: number, reason: string) => {
  setTotalXp(prev => prev + amount)
  setRecentXp(amount)
  setShowXpAnimation(true)

  // Add XP notification
  addSystemMessage(`You earned ${amount} XP for: ${reason}`)

  // Hide animation after 3 seconds
  setTimeout(() => setShowXpAnimation(false), 3000)
}
```

### 3. Engagement Tracking System

**Location**: `/utils/engagement-tracker.ts`

#### Event Types

```typescript
type EngagementEventType =
  | "simulation_load"       // Page loaded
  | "simulation_exit"       // Page exited
  | "help_opened"           // Expert mode activated
  | "help_closed"           // Expert mode deactivated
  | "objective_completed"   // Objective finished
  | "message_sent"          // User sent message
  | "note_created"          // First note added
  | "note_updated"          // Note modified
  | "note_section_toggled"  // Notes panel toggled
  | "note_analyzed"         // Note content analyzed
```

#### Tracking Functions

```typescript
export const logEngagementEvent = async (
  type: EngagementEventType,
  simulationId?: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  const event: EngagementEvent = {
    type,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    simulationId,
    userId,
    metadata
  }

  await fetch("/api/engagement/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true // Ensure delivery even on page unload
  })
}
```

#### Note Analysis

```typescript
const analyzeNoteContent = (content: string) => {
  return {
    isEmpty: content.trim().length === 0,
    hasStructure: /^[•\-*]\s/m.test(content) || /^\d+\.\s/m.test(content),
    bulletPointCount: (content.match(/^[•\-*]\s/gm) || []).length,
    questionCount: (content.match(/\?/g) || []).length,
    numberCount: (content.match(/\$\d+|\d+%|\d+,\d+/g) || []).length,
    topicCategories: detectTopics(content) // goals, financial, insurance, etc.
  }
}
```

#### Engagement Metrics Summary

```typescript
export const trackEngagementMetrics = (
  simulationId: string,
  userId: string,
  metrics: {
    totalMessages: number
    timeInSimulationMinutes: number
    usedNeedsHelp: boolean
    exitedEarly: boolean
    objectivesCompleted: number
    coachingInteractions: number
    tookNotes: boolean
    noteLength?: number
    noteUpdateCount?: number
  }
) => {
  logEngagementEvent("simulation_exit", simulationId, userId, {
    ...metrics,
    isEngagementSummary: true
  })
}
```

### 4. Authentication & User Management

**Location**: `/components/auth-provider.tsx`, `/app/api/users/`

#### Authentication Flow

```typescript
// NextAuth configuration
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export default NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Verify credentials against database
        const user = await verifyUser(credentials)
        if (user) {
          return { id: user.id, name: user.name, email: user.email, role: user.role }
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
      }
      return session
    }
  }
})
```

#### Protected Routes

```typescript
// components/protected-route.tsx
export function ProtectedRoute({ children, requiredRole }) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <LoadingSpinner />
  }

  if (!session) {
    router.push("/login")
    return null
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return <AccessDenied />
  }

  return children
}
```

#### User Roles

```typescript
enum UserRole {
  STUDENT = "student",   // Can take simulations
  TRAINER = "trainer",   // Can view student progress
  ADMIN = "admin"        // Full system access
}
```

### 5. Parameter Catalog System

**Location**: `/app/admin/parameter-catalog/`, `/lib/parameter-db.ts`

#### Purpose
Manages AI personality parameters that control client behavior during simulations.

#### Parameter Categories

1. **Narrative Parameters**
   - Life stage contexts
   - Communication styles
   - Emotional states
   - Cultural backgrounds

2. **Structured Parameters**
   - Personality traits (Big Five + 2)
   - Archetypes
   - Moods
   - Quirks

3. **Guardrail Parameters**
   - Response length limits
   - Profanity filters
   - Topic boundaries
   - Disclosure rules

#### Parameter Structure

```typescript
interface Parameter {
  id: string
  category_id: string
  name: string
  description: string
  type: "narrative" | "structured" | "guardrail"
  value_type: "text" | "number" | "boolean" | "array"
  default_value: any
  min_value?: number
  max_value?: number
  options?: string[]
  industry?: string
  subcategory?: string
}
```

#### Store Management (Zustand)

```typescript
interface ParameterCatalogStore {
  parameters: Parameter[]
  categories: ParameterCategory[]
  loadParameters: () => Promise<void>
  loadCategories: () => Promise<void>
  addParameter: (parameter: Parameter) => Promise<void>
  updateParameter: (id: string, updates: Partial<Parameter>) => Promise<void>
  deleteParameter: (id: string) => Promise<void>
  resetToDefaults: () => Promise<void>
}

export const useParameterCatalogStore = create<ParameterCatalogStore>((set, get) => ({
  // ... implementation
}))
```

---

## Database Schema

### Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'student', 'trainer', 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Parameter Categories
```sql
CREATE TABLE parameter_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'narrative', 'structured', 'guardrail'
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Parameters
```sql
CREATE TABLE parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES parameter_categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  value_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'boolean', 'array'
  default_value TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  options TEXT[], -- For enum-like values
  industry VARCHAR(100),
  subcategory VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Simulations (Proposed)
```sql
CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  industry VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  difficulty VARCHAR(50) NOT NULL,
  client_profile JSONB NOT NULL,
  conversation_history JSONB NOT NULL,
  objectives_completed JSONB,
  performance_review JSONB,
  total_xp INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

#### Engagement Events (Proposed)
```sql
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  simulation_id VARCHAR(50),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### NPS Feedback
```sql
CREATE TABLE nps_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback_type VARCHAR(50) NOT NULL, -- 'promoter', 'passive', 'detractor'
  reasons TEXT[],
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Routes

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - User login (NextAuth handles this)
- `POST /api/logout` - User logout
- `GET /api/check-auth` - Verify authentication status
- `GET /api/check-session` - Check active session
- `POST /api/change-password` - Update user password

### Users
- `GET /api/users` - List all users (admin)
- `POST /api/users` - Create new user (admin)
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `POST /api/users/bulk` - Bulk create users (admin)
- `POST /api/users/bulk-import` - Import users from CSV

### Simulation
- `POST /api/simulation/actions` - Server actions for AI generation
  - `generateClientResponse()` - Generate client message
  - `generateExpertResponse()` - Generate expert coaching
  - `generateSimulationId()` - Create unique simulation ID
- `POST /api/simulation/generate-review` - Generate performance review
- `GET /api/simulation/data-store` - Get difficulty settings
- `POST /api/simulation/data-store` - Update difficulty settings

### Profile Generation
- `POST /api/profile-generator/actions` - Generate client profile
  - `generateProfile(params)` - Create AI client profile

### Competencies
- `GET /api/competencies` - List all competencies
- `POST /api/competencies` - Create competency
- `PUT /api/competencies/[id]` - Update competency
- `DELETE /api/competencies/[id]` - Delete competency
- `GET /api/competencies/industry` - Get industry-specific competencies

### Industry Settings
- `GET /api/industry-settings` - Get industry traits and settings
- `PUT /api/industry-settings` - Update industry settings

### Parameters
- `GET /api/parameters` - List all parameters
- `POST /api/parameters` - Create parameter
- `GET /api/parameters/[id]` - Get parameter details
- `PUT /api/parameters/[id]` - Update parameter
- `DELETE /api/parameters/[id]` - Delete parameter
- `POST /api/parameters/reset` - Reset to defaults

### Parameter Categories
- `GET /api/parameter-categories` - List categories
- `POST /api/parameter-categories` - Create category
- `GET /api/parameter-categories/[id]` - Get category
- `PUT /api/parameter-categories/[id]` - Update category
- `DELETE /api/parameter-categories/[id]` - Delete category

### Engagement Tracking
- `POST /api/engagement/log` - Log engagement event
- `POST /api/engagement/score` - Calculate engagement score

### Feedback
- `POST /api/feedback/nps` - Submit NPS feedback
- `GET /api/feedback/nps` - Get NPS feedback data (admin)

### Seed Data
- `POST /api/seed` - Seed competencies database
- `POST /api/seed/parameter-catalog` - Seed parameter catalog
- `POST /api/admin/seed-data` - Admin seed all data

---

## Code Flow Diagrams

### 1. Simulation Initialization Flow

```
User navigates to /simulation/attestation
  │
  ├─► Accept terms → Session: acceptedTerms = true
  │
  └─► Navigate to /simulation/industry-selection
       │
       ├─► Select industry/subcategory/difficulty
       ├─► Select competencies (from competencies.json)
       ├─► Select focus areas (optional)
       │
       └─► Navigate to /simulation/setup
            │
            ├─► useEffect: loadClientProfile()
            │    │
            │    ├─► Get selectedFocusAreas from sessionStorage
            │    │
            │    ├─► Call getProfileForSimulation(industry, subcategory, difficulty, focusAreas)
            │    │    │
            │    │    ├─► Fetch industry settings: /api/industry-settings
            │    │    │
            │    │    └─► Call generateProfile()
            │    │         ├─► Build AI prompt with parameters
            │    │         ├─► Call OpenAI GPT-4o (temperature 0.8)
            │    │         ├─► Parse JSON response
            │    │         └─► Return ClientProfile
            │    │
            │    ├─► setClientProfile(profile)
            │    └─► sessionStorage.setItem("clientProfile", JSON.stringify(profile))
            │
            ├─► Display client profile (filtered by difficulty)
            │    ├─► Beginner: Show all details
            │    ├─► Intermediate: Hide financial details & goals
            │    └─► Advanced: Show only name
            │
            ├─► Display simulation parameters
            │    ├─► Industry, subcategory, difficulty
            │    ├─► Focus areas (if selected)
            │    └─► Competencies being evaluated
            │
            └─► User clicks "Continue to Simulation"
                 │
                 ├─► sessionStorage: aiRoleLabel, aiRoleDescription
                 │
                 └─► Navigate to /simulation/session?simulationId=...&industry=...
```

### 2. Message Exchange Flow

```
User types message in session page
  │
  ├─► handleSendMessage()
  │    │
  │    ├─► Add user message to messages[]
  │    │
  │    ├─► trackMessageSent(length, simulationId, userId)
  │    │    └─► POST /api/engagement/log
  │    │
  │    ├─► recordEvent("Advisor: [message]")
  │    │    └─► Add to eventTimestamps[]
  │    │
  │    ├─► IF !expertMode:
  │    │    └─► processMessageForEmotionalImpact(userMessage, true)
  │    │         │
  │    │         ├─► Get emotionalStateStore
  │    │         ├─► detectActions(userMessage)
  │    │         │    └─► Return actions: ['reflective_listening', 'open_question', ...]
  │    │         │
  │    │         └─► updateEmotionalState(context, actions, traits)
  │    │              ├─► Adjust trust (+/-)
  │    │              ├─► Adjust frustration (+/-)
  │    │              ├─► Adjust openness (+/-)
  │    │              └─► Return updated context
  │    │
  │    ├─► setIsTyping(true)
  │    │
  │    ├─► IF expertMode:
  │    │    │
  │    │    └─► generateExpertResponse(messages, clientProfile, ...)
  │    │         │
  │    │         ├─► determineResponseTier(userMessage)
  │    │         │    ├─► Check length, keywords, complexity
  │    │         │    └─► Return tier 1, 2, or 3
  │    │         │
  │    │         ├─► Build expert system prompt with:
  │    │         │    ├─► Client profile
  │    │         │    ├─► Objectives progress
  │    │         │    ├─► Risk mitigation guidelines
  │    │         │    └─► Tier-specific format
  │    │         │
  │    │         ├─► Call OpenAI GPT-4o
  │    │         │    ├─► Model: gpt-4o
  │    │         │    ├─► Temperature: 0.7
  │    │         │    └─► Max tokens: 1000
  │    │         │
  │    │         └─► Return { success: true, message: expertResponse, tier }
  │    │
  │    └─► ELSE (client mode):
  │         │
  │         └─► generateClientResponse(messages, clientProfile, ...)
  │              │
  │              ├─► BUILD SYSTEM PROMPT
  │              │    ├─► formatSystemPrompt(clientProfile, personalitySettings, ...)
  │              │    │    ├─► Demographics
  │              │    │    ├─► Personality traits with conversational examples
  │              │    │    ├─► Difficulty guidelines
  │              │    │    ├─► Focus areas context
  │              │    │    └─► Behavioral instructions
  │              │    │
  │              │    ├─► Add difficulty-specific disclosure rules
  │              │    └─► Add inappropriate behavior responses
  │              │
  │              ├─► EMOTIONAL STATE PROCESSING
  │              │    ├─► initializeEmotionalContext(traits)
  │              │    ├─► Process conversation history with detectActions()
  │              │    ├─► injectDynamicContext(prompt, emotionalContext, profile)
  │              │    ├─► getEmotionalStateDescription(currentState)
  │              │    └─► Add crisis response guidance if needed
  │              │
  │              ├─► GENERATE CLIENT RESPONSE (Step 1)
  │              │    ├─► Call OpenAI GPT-4o via Vercel AI SDK
  │              │    │    ├─► Model: gpt-4o
  │              │    │    ├─► Temperature: 0.7
  │              │    │    ├─► Max tokens: 1000
  │              │    │    └─► Messages: [system prompt, conversation]
  │              │    │
  │              │    └─► Return clientResponse text
  │              │
  │              └─► EVALUATE OBJECTIVES (Step 2 - parallel)
  │                   │
  │                   ├─► IF messages.length > 2:
  │                   │    │
  │                   │    ├─► Build objective tracking prompt
  │                   │    │    ├─► System: "You are an objective evaluator..."
  │                   │    │    ├─► Scoring instructions
  │                   │    │    └─► Conversation history
  │                   │    │
  │                   │    ├─► Call OpenAI with function calling
  │                   │    │    ├─► Model: gpt-4o
  │                   │    │    ├─► Temperature: 0.3
  │                   │    │    ├─► Max tokens: 500
  │                   │    │    ├─► Tool: trackObjectiveProgress
  │                   │    │    └─► Tool choice: required
  │                   │    │
  │                   │    └─► Parse function call arguments
  │                   │         └─► Return { rapport, needs, objections, recommendations, decreaseReason, explanation }
  │                   │
  │                   └─► Return { success: true, message: clientResponse, objectiveProgress }
  │
  ├─► Process response
  │    │
  │    ├─► Add AI message to messages[]
  │    │
  │    ├─► recordEvent("Client: [message]")
  │    │
  │    ├─► IF !expertMode:
  │    │    │
  │    │    ├─► processMessageForEmotionalImpact(aiResponse, false)
  │    │    │
  │    │    └─► IF objectiveProgress:
  │    │         │
  │    │         └─► handleObjectiveProgress(objectiveProgress)
  │    │              │
  │    │              ├─► FOR EACH objective (rapport, needs, objections, recommendations):
  │    │              │    │
  │    │              │    ├─► currentScore = objectiveProgress[objective]
  │    │              │    ├─► highestScore = highestScores[objective]
  │    │              │    │
  │    │              │    ├─► IF currentScore < highestScore:
  │    │              │    │    │
  │    │              │    │    ├─► IF decreaseReason[objective]:
  │    │              │    │    │    ├─► Apply decrease
  │    │              │    │    │    ├─► Update UI with decreased score
  │    │              │    │    │    └─► Show warning message
  │    │              │    │    │
  │    │              │    │    └─► ELSE: Maintain highest score (ratcheting)
  │    │              │    │
  │    │              │    └─► ELSE IF currentScore >= highestScore:
  │    │              │         ├─► Update score normally
  │    │              │         ├─► Update highestScores[objective]
  │    │              │         └─► Clear any decrease reason
  │    │              │
  │    │              ├─► IF explanation:
  │    │              │    └─► Add system message: "Advisor progress: {explanation}"
  │    │              │
  │    │              └─► IF any decreases detected:
  │    │                   └─► Add warning message with reasons
  │    │
  │    └─► setIsTyping(false)
  │
  └─► Update UI
       ├─► Scroll to bottom
       ├─► Update objective progress bars
       ├─► Update XP display
       └─► Show feedback messages (if enabled)
```

### 3. Simulation Completion & Review Flow

```
User clicks "End & Review"
  │
  ├─► handleEndSimulation()
  │    │
  │    ├─► Calculate completion metrics
  │    │    ├─► completedObjectivesCount
  │    │    ├─► completionBonus = completedObjectives * 50 XP
  │    │    └─► awardXp(completionBonus, "Simulation completion bonus")
  │    │
  │    ├─► trackEngagementMetrics(simulationId, userId, {
  │    │     totalMessages,
  │    │     timeInSimulationMinutes,
  │    │     usedNeedsHelp,
  │    │     exitedEarly,
  │    │     objectivesCompleted,
  │    │     coachingInteractions,
  │    │     tookNotes,
  │    │     noteLength,
  │    │     noteUpdateCount
  │    │   })
  │    │    └─► POST /api/engagement/log
  │    │
  │    ├─► Mark feedback messages in conversation
  │    │    └─► messages.map(msg => msg.content.includes("Advisor progress") ? {...msg, isFeedback: true} : msg)
  │    │
  │    ├─► Store session data
  │    │    ├─► sessionStorage: simulationEndTime
  │    │    ├─► sessionStorage: simulationMessages (with feedback marked)
  │    │    ├─► sessionStorage: simulationXp
  │    │    ├─► sessionStorage: completedObjectives
  │    │    └─► sessionStorage: simulationTimestamps (eventTimestamps)
  │    │
  │    └─► Navigate to /simulation/review
  │
  └─► Review Page (/simulation/review/page.tsx)
       │
       ├─► useEffect: Load data from sessionStorage
       │    ├─► simulationXp
       │    ├─► completedObjectives
       │    ├─► simulationId
       │    ├─► industry, subcategory, difficulty
       │    ├─► simulationMessages
       │    ├─► selectedCompetencies
       │    ├─► simulationTimestamps
       │    └─► showSimulationFeedback preference
       │
       ├─► Calculate duration
       │    └─► (endTime - startTime) → MM:SS format
       │
       ├─► Process timestamps
       │    ├─► Identify key moments:
       │    │    ├─► First interaction
       │    │    ├─► Significant score changes (>10%)
       │    │    ├─► Competency-related events
       │    │    └─► Evenly spaced intervals if needed
       │    │
       │    └─► Mark isKey: true for display
       │
       ├─► Generate performance review
       │    │
       │    └─► generatePerformanceReview(messages, competencies, difficulty)
       │         │
       │         ├─► Filter conversation (remove system messages except EXPERT MODE)
       │         │
       │         ├─► Load rubrics from data/rubrics.json
       │         │    └─► Get criteria by competency ID and difficulty level
       │         │
       │         ├─► Build evaluation prompt
       │         │    ├─► Competency-specific criteria from rubrics
       │         │    ├─► General evaluation guidelines
       │         │    ├─► Critical scoring requirements
       │         │    ├─► User message count context
       │         │    └─► Client request context
       │         │
       │         ├─► Call OpenAI GPT-4o
       │         │    ├─► Model: gpt-4o
       │         │    ├─► Temperature: 0.2 (consistent evaluation)
       │         │    ├─► Response format: JSON
       │         │    └─► Messages: [evaluation prompt, conversation]
       │         │
       │         ├─► Parse JSON response
       │         │    ├─► overallScore (1-10)
       │         │    ├─► competencyScores[] (1-10 each)
       │         │    │    ├─► name
       │         │    │    ├─► score
       │         │    │    ├─► strengths[]
       │         │    │    ├─► improvements[]
       │         │    │    ├─► specificExamples[]
       │         │    │    └─► criteria[] (from rubric)
       │         │    ├─► generalStrengths[]
       │         │    ├─► generalImprovements[]
       │         │    ├─► summary (paragraph)
       │         │    └─► conversationAnalysis
       │         │
       │         ├─► Enhance scores with expectation text
       │         │    ├─► 9-10: "Outstanding, exceeds expectations"
       │         │    ├─► 7-8: "Strong, meets expectations"
       │         │    ├─► 5-6: "Satisfactory, room for improvement"
       │         │    ├─► 3-4: "Below expectations"
       │         │    └─► 1-2: "Critical improvement required"
       │         │
       │         └─► Return PerformanceReview object
       │
       ├─► Display review UI
       │    │
       │    ├─► LEFT COLUMN (Simulation Summary)
       │    │    ├─► Simulation Summary Card
       │    │    │    ├─► Industry, difficulty, duration
       │    │    │    ├─► Overall score (X/10)
       │    │    │    └─► Total XP
       │    │    │
       │    │    ├─► Objectives Completed Card
       │    │    │    └─► List with XP earned
       │    │    │
       │    │    ├─► Key Takeaways Card
       │    │    │    ├─► Strengths bullets
       │    │    │    └─► Improvements bullets
       │    │    │
       │    │    └─► Key Simulation Moments Card
       │    │         └─► Timeline of key events with timestamps
       │    │
       │    └─► RIGHT COLUMN (Performance Details)
       │         │
       │         ├─► Performance Summary Tab
       │         │    ├─► Toggle feedback visibility button
       │         │    ├─► AI summary paragraph
       │         │    ├─► Radar chart (competency scores)
       │         │    └─► Detailed competency breakdown
       │         │         ├─► Score with progress bar
       │         │         ├─► Performance level expectation
       │         │         ├─► Strengths bullets
       │         │         └─► Improvements bullets
       │         │
       │         └─► Full Conversation Tab
       │              └─► Complete message transcript
       │
       ├─► Next Steps Section
       │    ├─► Practice improvement areas
       │    ├─► Try another simulation
       │    └─► Review learning resources
       │
       ├─► NPS Feedback Dialog
       │    └─► User rates experience (0-10)
       │         └─► POST /api/feedback/nps
       │
       └─► Action Buttons
            ├─► "Back to Simulation" (disabled)
            ├─► "New Simulation" → /simulation/attestation
            └─► "Dashboard" → /
```

---

## Summary

This skill simulator is a sophisticated AI-powered training platform that:

1. **Generates realistic AI clients** using GPT-4o with dynamic personality traits, emotional states, and industry-specific behaviors

2. **Tracks performance in real-time** using a dual-AI approach:
   - One AI call generates the client response
   - A parallel AI call evaluates objective progress with function calling

3. **Provides expert coaching** on-demand with a tiered response system (factual/coaching/comprehensive)

4. **Monitors emotional state** dynamically, adjusting client behavior based on advisor actions (trust, frustration, openness)

5. **Generates comprehensive reviews** using AI evaluation against rubric criteria with honest, critical scoring

6. **Tracks engagement** comprehensively including notes, help usage, objectives, and session metrics

The system uses **Next.js 15**, **React 19**, **OpenAI GPT-4o**, **Neon Postgres**, and **Vercel AI SDK** to deliver a seamless, immersive training experience for financial services professionals.

---

**Document Version**: 1.0
**Last Updated**: December 16, 2025
**Author**: Claude (Sonnet 4.5)
