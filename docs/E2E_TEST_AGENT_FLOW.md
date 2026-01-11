# End-to-End Test Flow: Agent Interactions and Routing

## Overview

This document captures the complete sequence flow of the end-to-end test performed on the AI Simulation Platform, detailing all agent interactions, routing decisions, and data flow between components.

## System Architecture

```
+------------------+     +------------------+     +------------------+
|    Frontend      |     |    Backend       |     |   Azure AI       |
|    (Next.js)     |<--->|    (Express)     |<--->|   Agents         |
|    Port 3000     |     |    Port 3001     |     |                  |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        |                        v                        |
        |                +------------------+             |
        |                |    PostgreSQL    |             |
        |                |    (Neon)        |             |
        |                +------------------+             |
        |                        |                        |
        v                        v                        v
+---------------------------------------------------------------+
|                    OpenAI API (Fallback)                      |
+---------------------------------------------------------------+
```

## Agents Involved

| Agent | Purpose | Location |
|-------|---------|----------|
| **Simulation Client Agent** | Simulates realistic client personas during training conversations | `backend/agents/simulation-client-agent.ts` |
| **Profile Generation Agent** | Generates diverse, realistic client profiles | `backend/agents/profile-generation-agent.ts` |
| **Evaluation Agent** | Evaluates advisor performance and generates reviews | `backend/agents/evaluation-agent.ts` |
| **Expert Guidance Agent** | Provides real-time coaching during simulations | `backend/agents/expert-guidance-agent.ts` |

---

## E2E Test Sequence Flow

### Phase 1: Application Startup

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION STARTUP                          │
└─────────────────────────────────────────────────────────────────┘

1. Backend Server Initialization (Port 3001)
   ├── Load environment variables
   ├── Initialize Express middleware
   ├── Initialize Database connection (PostgreSQL/Neon)
   ├── Initialize WebSocket TTS Service
   │   └── Socket.io listening on allowed origins
   └── Initialize Azure AI Agents
       ├── [AzureClient] Initialize Azure AI Projects client
       ├── [simulation-client] Initialize agent → Agent ID assigned
       ├── [profile-generation] Initialize agent → Agent ID assigned
       ├── [evaluation] Initialize agent → Agent ID assigned
       └── [expert-guidance] Initialize agent → Agent ID assigned

2. Frontend Server Initialization (Port 3000)
   ├── Next.js development server starts
   ├── Hot reload enabled
   └── API client configured for http://localhost:3001
```

### Phase 2: User Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User → [Browser] Navigate to http://localhost:3000
         │
         ▼
[Frontend] Check authentication status
         │
         ├── AuthProvider: Token exists: false
         ├── AuthProvider: User data exists: false
         └── Redirect to /login
         │
         ▼
User → [Login Page] Click "Sign up" link
         │
         ▼
[Signup Page] User fills form:
         │   - First Name: Test
         │   - Last Name: User
         │   - Email: testuser@example.com
         │   - Password: TestPassword123!
         │
         ▼
[Frontend] POST /api/auth/signup
         │
         ▼
[Backend: auth.ts] Create user in database
         │   ├── Hash password
         │   ├── Insert into users table
         │   ├── Create session token
         │   └── Return token + user data
         │
         ▼
[Frontend] Store token in localStorage
         │   ├── AuthProvider: Logging in user
         │   ├── AuthProvider: Token exists: true
         │   └── Redirect to /dashboard
```

### Phase 3: Simulation Setup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION SETUP FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User → [Dashboard] Click "Start Simulation"
         │
         ▼
[Attestation Page] /simulation/attestation
         │   User types "I Attest"
         │   Click "Proceed to Simulation"
         │
         ▼
[Industry Selection] /simulation/industry-selection
         │
         ├── GET /api/industry-settings ◄── [FIXED: Was returning 403]
         │   └── Returns: industryCompetencies, metadata, difficultySettings
         │
         ├── GET /api/competencies/industry
         │   └── Returns: industry competency mappings
         │
         │   User selects:
         │   - Industry: Insurance
         │   - Subcategory: Life & Health
         │   - Difficulty: Beginner
         │
         └── Click "Continue"
```

### Phase 4: Profile Generation (Agent Interaction #1)

```
┌─────────────────────────────────────────────────────────────────┐
│              PROFILE GENERATION AGENT INTERACTION               │
└─────────────────────────────────────────────────────────────────┘

[Simulation Setup Page] /simulation/setup
         │
         ▼
[Frontend: actions.ts] generateProfile()
         │
         ├── Request Parameters:
         │   {
         │     industry: "insurance",
         │     subcategory: "life-health",
         │     difficulty: "beginner",
         │     focusAreas: [],
         │     existingProfiles: []
         │   }
         │
         ▼
[Backend: agents.ts] POST /api/agents/profile/generate
         │
         ├── Check: areAgentsAvailable() → true
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│           PROFILE GENERATION AGENT (Azure AI)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Azure Thread                                         │
│     └── Thread ID generated                                     │
│                                                                 │
│  2. Add Message to Thread                                       │
│     └── System instructions + generation parameters             │
│                                                                 │
│  3. Run Agent                                                   │
│     └── Agent processes with tools:                             │
│         ├── get_industry_settings → Insurance settings          │
│         ├── get_difficulty_settings → Beginner parameters       │
│         ├── generate_diversity_params → Ensure variety          │
│         └── validate_profile → Check completeness               │
│                                                                 │
│  4. Tool Execution Loop (max 20 iterations)                     │
│     └── Execute tool handlers, submit outputs                   │
│                                                                 │
│  5. Get Response                                                │
│     └── Generated profile JSON                                  │
│                                                                 │
│  6. Cleanup Thread                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[Response] Generated Client Profile:
         {
           name: "Benjamin Yamamoto",
           age: 35,
           occupation: "Photographer",
           familyStatus: "Married with Children",
           income: "Moderate Income",
           assets: "Low Assets",
           debt: "High Debt",
           goals: [
             "Save for children's education",
             "Expand photography business",
             "Build a retirement fund"
           ]
         }
```

### Phase 5: Simulation Session (Agent Interaction #2)

```
┌─────────────────────────────────────────────────────────────────┐
│              SIMULATION SESSION - CLIENT AGENT                  │
└─────────────────────────────────────────────────────────────────┘

User → [Setup Page] Click "Continue to Simulation"
         │
         ▼
[Backend: simulation.ts] POST /api/simulation
         │
         ├── Create simulation record in database
         │   - ID: 6e7c8e7c-9ded-442b-8eef-be17885b86bf
         │   - simulation_id: SIM-1768046091650
         │   - user_id: (user's ID)
         │   - industry: insurance
         │   - subcategory: life-health
         │   - difficulty: beginner
         │
         ▼
[Session Page] /simulation/session
         │
         ├── Initialize TTS WebSocket Connection
         │   └── [TTS Client] Connected to TTS service
         │
         ├── Load simulation from database
         │   └── GET /api/simulation/:id ◄── [FIXED: user_id check]
         │
         ▼
[Initial Client Message - Agent Generates Opening]
         │
         ▼
[Backend: chat.ts] POST /api/chat/client-response
         │
         ├── Check: areAgentsAvailable() → true
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│           SIMULATION CLIENT AGENT (Azure AI)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Context Store (Session-Specific):                              │
│  {                                                              │
│    sessionId: "6e7c8e7c-...",                                   │
│    clientProfile: { name: "Benjamin Yamamoto", ... },           │
│    personalitySettings: {                                       │
│      mood: "slightly anxious",                                  │
│      archetype: "family-focused professional",                  │
│      traits: ["friendly", "cooperative"]                        │
│    },                                                           │
│    simulationSettings: {                                        │
│      industry: "insurance",                                     │
│      difficulty: "beginner"                                     │
│    },                                                           │
│    emotionalState: {                                            │
│      trust: 63.5,                                               │
│      frustration: 15,                                           │
│      openness: 53,                                              │
│      engagement: 64                                             │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  Tool Calls During Response:                                    │
│  ├── get_client_profile → Returns full profile                  │
│  ├── get_emotional_state → Returns current emotions             │
│  └── track_objectives → Updates progress                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[Client Opening Message]:
"Hi! Thanks for meeting with me. So, I'm hoping to figure out
how to get my family better protected, especially since my work
is kind of unpredictable sometimes. We only have basic health
insurance right now and a little bit of life insurance, but I
keep wondering if that's enough, you know?..."

         │
         ▼
[XP Award] +25 XP for: Starting the simulation
```

### Phase 6: Conversation Exchange (Multiple Agent Calls)

```
┌─────────────────────────────────────────────────────────────────┐
│              CONVERSATION - ADVISOR MESSAGE                     │
└─────────────────────────────────────────────────────────────────┘

User → [Chat Input] Types message:
"Hi Benjamin! Thank you for meeting with me today. I can
definitely help you review your family's protection needs..."
         │
         ▼
[Frontend: Emotional State Processing]
         │
         ├── detectActions() analyzes message
         │   └── Detected: [reflective_listening, offensive_assumption]
         │
         ├── EmotionalStateStore.processUserMessage()
         │   ├── Before: { trust: 63.5, frustration: 15, ... }
         │   ├── Apply reflective_listening: +5 trust, -5 frustration
         │   ├── Apply offensive_assumption: -20 trust, +25 frustration
         │   └── After: { trust: 45.5, frustration: 31, ... }
         │
         ▼
[Backend: chat.ts] POST /api/chat/client-response
         │
         ├── Messages array with full conversation history
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│           SIMULATION CLIENT AGENT - RESPONSE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input Context:                                                 │
│  - Full conversation history                                    │
│  - Updated emotional state                                      │
│  - Client profile                                               │
│  - Difficulty: beginner (cooperative, shares freely)            │
│                                                                 │
│  Agent Decision Process:                                        │
│  1. Analyze advisor's question about business/income            │
│  2. Check emotional state (trust decreased)                     │
│  3. Maintain beginner difficulty (still cooperative)            │
│  4. Generate detailed response about finances                   │
│  5. Include emotional cue [fidgets with camera strap]           │
│                                                                 │
│  Tool Calls:                                                    │
│  └── track_objectives → Build Rapport: 25% complete             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[Client Response]:
"Sure! So, my business is mostly freelance—sometimes I have
busy periods with lots of gigs, especially around holidays
or wedding season... [fidgets with camera strap] Does that help?"
         │
         ▼
[TTS Service] Text-to-Speech
         ├── [TTS Client] Speech started: alloy voice
         └── [TTS Client] Speech ended: 1125600 bytes
```

### Phase 7: "Need Help?" Expert Guidance (Agent Interaction #3)

```
┌─────────────────────────────────────────────────────────────────┐
│              EXPERT GUIDANCE AGENT (IF TRIGGERED)               │
└─────────────────────────────────────────────────────────────────┘

User → [Chat] Clicks "Need Help?" button
         │
         ▼
[Frontend] Switch to Expert Mode
         │
         ▼
User → Types: "How should I handle this client's concerns
              about their unpredictable income?"
         │
         ▼
[Backend: chat.ts] POST /api/chat/expert-response
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│           EXPERT GUIDANCE AGENT (Azure AI)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tier Detection Algorithm:                                      │
│  ├── Analyze question: "how should I handle..."                 │
│  ├── Coaching indicators found: +2 (how should i)               │
│  ├── Client topic found: +1 (client)                            │
│  └── Result: Tier 2 (Coaching)                                  │
│                                                                 │
│  Tool Calls:                                                    │
│  ├── get_objectives → Current progress status                   │
│  ├── get_context → Full simulation context                      │
│  └── generate_guidance → Tailored advice                        │
│                                                                 │
│  Response Format (Tier 2 - Coaching):                           │
│  ├── Situation Assessment                                       │
│  ├── Strategic Coaching                                         │
│  └── Sample Questions to Ask                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[Expert Response]:
"**Situation Assessment:** Your client Benjamin has expressed
anxiety about income unpredictability as a freelance photographer...

**Strategic Coaching:** Focus on income replacement products...

**Sample Questions:**
- What's the longest gap you've experienced between projects?
- How much runway do you typically keep in savings?..."
```

### Phase 8: End Simulation & Review (Agent Interaction #4)

```
┌─────────────────────────────────────────────────────────────────┐
│              EVALUATION AGENT - PERFORMANCE REVIEW              │
└─────────────────────────────────────────────────────────────────┘

User → [Session] Clicks "End & Review"
         │
         ▼
[Frontend] Navigate to /simulation/review
         │
         ├── TTS Disconnecting
         │
         ▼
[Backend: simulation.ts] POST /api/simulation/generate-review
         │
         ├── Request Body:
         │   {
         │     messages: [...full conversation...],
         │     competencies: [...],
         │     difficultyLevel: "beginner"
         │   }
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│           EVALUATION AGENT (Azure AI)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input:                                                         │
│  - Complete conversation transcript                             │
│  - Competencies being evaluated                                 │
│  - Difficulty level context                                     │
│                                                                 │
│  Tool Calls:                                                    │
│  ├── get_rubrics → Evaluation criteria for beginner             │
│  ├── get_competencies → Competency definitions                  │
│  ├── analyze_conversation → Key moments, strengths, weaknesses  │
│  └── calculate_scores → Final competency scores                 │
│                                                                 │
│  Evaluation Criteria:                                           │
│  ├── Communication (clarity, professionalism)                   │
│  ├── Needs Assessment (discovery ability)                       │
│  ├── Rapport Building (trust, connection)                       │
│  ├── Objection Handling (concern addressing)                    │
│  └── Solution Recommendation (appropriateness)                  │
│                                                                 │
│  Scoring (1-10 scale):                                          │
│  ├── 9-10: Exceptional                                          │
│  ├── 7-8: Strong                                                │
│  ├── 5-6: Satisfactory                                          │
│  ├── 3-4: Below expectations                                    │
│  └── 1-2: Poor performance                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
[Review Response]:
{
  overallScore: 7,
  summary: "The advisor demonstrated strong rapport-building
            skills and initiated a needs assessment effectively...",
  competencyScores: [
    { name: "rapportBuilding", score: 8 },
    { name: "needsAssessment", score: 7 },
    { name: "communication", score: 7 },
    { name: "problemSolving", score: 6 },
    { name: "productKnowledge", score: 5 }
  ],
  generalStrengths: [
    "Greeted client warmly",
    "Acknowledged client's goals",
    "Asked about business situation"
  ],
  generalImprovements: [
    "Provide more specific recommendations",
    "Deeper exploration of financial details"
  ]
}
         │
         ▼
[Review Page] Display:
         ├── Radar Chart with competency scores
         ├── Overall Score: 7/10
         ├── Total XP Earned: 25 XP
         ├── Key Takeaways (Strengths & Improvements)
         └── NPS Feedback Form
```

---

## Agent Routing Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ROUTING LOGIC                          │
└─────────────────────────────────────────────────────────────────┘

                    Incoming Request
                          │
                          ▼
              ┌─────────────────────┐
              │ areAgentsAvailable()?│
              └─────────────────────┘
                    │           │
                   YES          NO
                    │           │
                    ▼           │
         ┌──────────────────┐   │
         │ Try Azure Agent  │   │
         └──────────────────┘   │
              │         │       │
           Success    Failure   │
              │         │       │
              │         ▼       ▼
              │    ┌─────────────────┐
              │    │ OpenAI Fallback │
              │    └─────────────────┘
              │         │
              ▼         ▼
         ┌─────────────────────┐
         │   Return Response   │
         │  source: "azure"    │
         │    or "openai"      │
         └─────────────────────┘


areAgentsAvailable() checks:
├── Azure configured? (AZURE_AI_PROJECT_CONNECTION_STRING)
├── Azure client initialized?
├── No recent errors?
└── At least one agent initialized?
```

---

## Data Flow Between Agents

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTER-AGENT DATA FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. PROFILE GENERATION → SIMULATION CLIENT
   ┌─────────────────┐      ┌─────────────────┐
   │    Profile      │      │   Simulation    │
   │   Generation    │─────▶│    Client       │
   │     Agent       │      │     Agent       │
   └─────────────────┘      └─────────────────┘
         │                         │
         │ Generated Profile       │ Uses profile for
         │ {name, age, goals...}   │ persona responses
         │                         │
         ▼                         ▼
   Frontend stores         Agent context store
   in session storage      initialized with profile


2. SIMULATION CLIENT → EVALUATION
   ┌─────────────────┐      ┌─────────────────┐
   │   Simulation    │      │   Evaluation    │
   │    Client       │─────▶│     Agent       │
   │     Agent       │      │                 │
   └─────────────────┘      └─────────────────┘
         │                         │
         │ Conversation History    │ Analyzes for
         │ [messages array]        │ performance review
         │                         │
         ▼                         ▼
   Stored in database      Generates scores
   during simulation       and feedback


3. SIMULATION ←→ EXPERT GUIDANCE
   ┌─────────────────┐      ┌─────────────────┐
   │   Simulation    │◀────▶│     Expert      │
   │    Session      │      │    Guidance     │
   │                 │      │     Agent       │
   └─────────────────┘      └─────────────────┘
         │                         │
         │ Context, Objectives     │ Coaching response
         │ Current state           │ with tier-based
         │                         │ formatting
         ▼                         ▼
   Pauses simulation       Advisor receives
   for help mode           expert advice
```

---

## Emotional State System

```
┌─────────────────────────────────────────────────────────────────┐
│               EMOTIONAL STATE TRACKING                          │
└─────────────────────────────────────────────────────────────────┘

[Frontend: Emotional State Store]
         │
         ├── Initial State (from profile):
         │   { trust: 63.5, frustration: 15, openness: 53, engagement: 64 }
         │
         ├── Action Detection:
         │   User message → detectActions() → [action1, action2, ...]
         │
         ├── Impact Application:
         │   For each action:
         │   ├── reflective_listening: +5 trust, -5 frustration, +3 openness
         │   ├── offensive_assumption: -20 trust, +25 frustration, -18 openness
         │   ├── empathy: +8 trust, -8 frustration, +6 openness
         │   └── ... (many more actions)
         │
         └── Updated State sent to Simulation Client Agent
             for behavior adjustment

[Simulation Client Agent uses emotional state to:]
├── Adjust response tone (more/less cooperative)
├── Determine information sharing level
├── Add emotional cues [fidgets], [sighs], etc.
└── Track rapport building progress
```

---

## WebSocket TTS Integration

```
┌─────────────────────────────────────────────────────────────────┐
│               TEXT-TO-SPEECH FLOW                               │
└─────────────────────────────────────────────────────────────────┘

[Session Page Load]
         │
         ▼
[TTS Client] Connect to ws://localhost:3001
         │
         ├── Socket connected
         ├── Received tts-connected event
         └── Ready for speech
         │
         ▼
[Client Response Generated]
         │
         ▼
[Frontend] ttsClient.speak(response.message)
         │
         ▼
[Backend: websocket-tts-service.ts]
         │
         ├── Receive text
         ├── Call OpenAI TTS API (voice: "alloy")
         ├── Stream audio chunks
         └── Send to client via WebSocket
         │
         ▼
[Frontend] Play audio in browser
         │
         └── Speech ended: 1125600 bytes
```

---

## Summary: Agent Interaction Count in E2E Test

| Agent | Interactions | Purpose |
|-------|-------------|---------|
| **Profile Generation** | 1 | Generate client "Benjamin Yamamoto" |
| **Simulation Client** | 2+ | Initial greeting + response to advisor |
| **Expert Guidance** | 0 (available) | Would activate on "Need Help?" |
| **Evaluation** | 1 | Generate performance review |

## Key Files Reference

| Component | File | Key Lines |
|-----------|------|-----------|
| Agent Initialization | `backend/agents/index.ts` | 57-115 |
| Base Agent | `backend/agents/base-agent.ts` | 124-239 |
| Simulation Client | `backend/agents/simulation-client-agent.ts` | 141-215 |
| Profile Generation | `backend/agents/profile-generation-agent.ts` | 121-179 |
| Evaluation | `backend/agents/evaluation-agent.ts` | 212-302 |
| Expert Guidance | `backend/agents/expert-guidance-agent.ts` | 119-167 |
| Agent Routes | `backend/routes/agents.ts` | 43-354 |
| Chat Routes | `backend/routes/chat.ts` | 23-150 |
| Emotional State | `frontend/app/profile-generator/emotional-state-store.ts` | Full file |
| TTS Service | `backend/services/websocket-tts-service.ts` | Full file |
