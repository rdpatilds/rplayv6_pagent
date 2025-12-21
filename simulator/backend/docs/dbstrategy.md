# Database & Architecture Strategy for Semi-Structured Configuration Data

**AI Roleplay Simulation Platform - Technical Architecture Decision Document**

**Date:** December 20, 2025
**Purpose:** Evaluate database options for semi-structured configuration data (rubrics, competencies, industry settings)

---

## Executive Summary

**Recommendation:** PostgreSQL with JSONB columns + Repository Pattern + Optional Redis Caching

**Key Decision Factors:**
- Already using PostgreSQL infrastructure
- Data is semi-structured with evolving schema requirements
- Need for both flexibility (JSONB) and structure (relational)
- Performance requirements: Fast reads, occasional writes
- Data size: Small (~40KB total) but complex nested structures

---

## Table of Contents

1. [Current Data Analysis](#current-data-analysis)
2. [Database Options Comparison](#database-options-comparison)
3. [Application-Level Strategies](#application-level-strategies)
4. [Final Recommendation](#final-recommendation)
5. [Implementation Plan](#implementation-plan)
6. [Performance Benchmarks](#performance-benchmarks)

---

## Current Data Analysis

### Data Inventory

| Data Type | Complexity | Size | Structure Type | Change Frequency |
|-----------|-----------|------|----------------|------------------|
| **Competencies** | Low | ~1KB | Simple array of objects | Medium |
| **Rubrics** | **High** | **32KB** | Deeply nested with arrays | Low |
| **Industry Competencies** | Medium | ~2KB | 3-level nested object | Medium |
| **Industry Metadata** | Low | ~0.5KB | Simple object | Low |
| **Difficulty Settings** | Medium | ~6KB | Nested configuration | Low |

**Total Size:** ~40KB across all configuration files

### Data Characteristics

**Key Observations:**
- ✅ Data is hierarchical and nested
- ✅ Schema varies across entity types
- ✅ Relationships exist (competencies → rubrics, industries → competencies)
- ✅ Infrequent writes, frequent reads (90% reads, 10% writes)
- ✅ Need for schema flexibility (future field additions/deletions)
- ✅ Complex nested structures (rubrics have 3 difficulty levels, each with arrays)

### Sample Data Structure

**Rubric Example:**
```json
{
  "id": "communication",
  "name": "Communication Skills",
  "description": "Ability to clearly articulate concepts",
  "rubric": {
    "beginner": [
      {
        "range": "1-2",
        "description": "Critical improvement required",
        "criteria": [
          "Used inappropriate or unprofessional language",
          "Failed to listen to client concerns",
          "Communicated in a confusing or unclear manner"
        ]
      }
    ],
    "intermediate": [...],
    "advanced": [...]
  }
}
```

**Industry Competencies Example:**
```json
{
  "insurance": {
    "life-health": {
      "competencies": ["communication", "needs-assessment"],
      "focusAreas": {
        "life-insurance": {
          "competencies": [],
          "enabled": true
        }
      }
    }
  }
}
```

---

## Database Options Comparison

### Option 1: PostgreSQL with JSONB ⭐⭐⭐⭐⭐ (RECOMMENDED)

**Approach:** Hybrid relational + document model

#### Schema Design

```sql
-- Core entities remain relational for queryability
CREATE TABLE competencies (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  weight INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Semi-structured data stored as JSONB
CREATE TABLE rubrics (
  competency_id VARCHAR PRIMARY KEY REFERENCES competencies(id),
  rubric_data JSONB NOT NULL,  -- Stores beginner/intermediate/advanced
  version VARCHAR DEFAULT '1.0.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GIN index for fast JSONB queries
CREATE INDEX idx_rubric_data ON rubrics USING GIN (rubric_data);

-- Industry configuration as JSONB
CREATE TABLE industry_configs (
  industry_key VARCHAR PRIMARY KEY,
  metadata JSONB NOT NULL,
  competency_mappings JSONB NOT NULL,
  difficulty_settings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_industry_competency_mappings
  ON industry_configs USING GIN (competency_mappings);
CREATE INDEX idx_industry_difficulty
  ON industry_configs USING GIN (difficulty_settings);
```

#### Query Examples

```sql
-- Query rubric for specific difficulty level
SELECT rubric_data->'beginner'
FROM rubrics
WHERE competency_id = 'communication';

-- Find all industries using a specific competency
SELECT industry_key, competency_mappings
FROM industry_configs
WHERE competency_mappings @> '{"life-health": {"competencies": ["communication"]}}';

-- Update specific nested field without full rewrite
UPDATE rubrics
SET rubric_data = jsonb_set(
    rubric_data,
    '{beginner,0,criteria}',
    '["Updated criteria 1", "Updated criteria 2"]'
)
WHERE competency_id = 'communication';

-- Search within arrays
SELECT * FROM rubrics
WHERE rubric_data->'beginner' @> '[{"range": "1-2"}]';

-- Get keys from JSONB object
SELECT jsonb_object_keys(competency_mappings) as subcategory
FROM industry_configs
WHERE industry_key = 'insurance';
```

#### Advantages ✅

1. **Flexibility:** JSONB allows dynamic schema - add/remove fields without migrations
2. **Queryability:** Rich set of JSON operators (`->`, `->>`, `@>`, `?`, `#>`)
3. **Indexing:** GIN/GiST indexes enable fast queries on JSON content
4. **ACID Compliance:** Full transactional support with rollback
5. **Mature Ecosystem:** Well-tested, large community, excellent tooling (pgAdmin, DBeaver)
6. **Type Validation:** Can add CHECK constraints on JSON structure
7. **Best of Both Worlds:** Relational for structured data, JSONB for flexible config
8. **No Infrastructure Change:** Already using PostgreSQL (Neon DB)
9. **Binary Storage:** JSONB is stored in binary format (faster than TEXT)
10. **Constraints:** Can enforce JSON schema validation with CHECK constraints

#### Disadvantages ❌

1. Slightly more complex queries for deeply nested data (requires knowledge of operators)
2. JSON field size limit (1GB per field, but your data is 32KB max)
3. Updates to nested fields require full object rewrite internally
4. No native support for referencing JSON elements (workaround: materialized views)

#### Use Case Fit

**Score:** ⭐⭐⭐⭐⭐ (95%)

**Perfect fit because:**
- Mix of structured entities (competencies) and flexible config (rubrics)
- Already using PostgreSQL infrastructure
- Data size is small enough for excellent performance
- Need for both relational queries and JSON flexibility

---

### Option 2: MongoDB (Document Database)

**Approach:** Pure document-oriented NoSQL storage

#### Schema Design

```javascript
// Competencies Collection
{
  _id: "communication",
  name: "Communication Skills",
  description: "Ability to clearly articulate concepts",
  category: "soft-skills",
  weight: 10,
  created_at: ISODate("2025-12-20T00:00:00Z")
}

// Rubrics Collection
{
  _id: "communication-rubric",
  competency_id: "communication",
  rubric: {
    beginner: [
      {
        range: "1-2",
        description: "Critical improvement required",
        criteria: [...]
      }
    ],
    intermediate: [...],
    advanced: [...]
  },
  version: "1.0.0",
  created_at: ISODate()
}

// Industry Config Collection
{
  _id: "insurance",
  metadata: {
    name: "Insurance",
    description: "Insurance industry"
  },
  competencies: {
    "life-health": {
      competencies: ["communication", "needs-assessment"],
      focusAreas: {...}
    }
  },
  difficulty: {...}
}
```

#### Query Examples

```javascript
// Find rubric
db.rubrics.findOne({ competency_id: "communication" })

// Query nested data
db.industryConfigs.find({
  "competencies.life-health.competencies": "communication"
})

// Update nested field
db.rubrics.updateOne(
  { competency_id: "communication" },
  { $set: { "rubric.beginner.0.criteria": ["new criteria"] } }
)

// Aggregation pipeline
db.rubrics.aggregate([
  { $match: { competency_id: "communication" } },
  { $project: { beginner: "$rubric.beginner" } }
])
```

#### Advantages ✅

1. **Native JSON:** No impedance mismatch - store data exactly as-is
2. **Schema Flexibility:** Maximum flexibility for evolving schemas
3. **Horizontal Scaling:** Excellent sharding capabilities for massive scale
4. **Rich Query Language:** Powerful aggregation pipeline
5. **Nested Data:** Natural fit for hierarchical structures
6. **Embedded Documents:** Can embed related data (no joins needed)
7. **GridFS:** For large file storage (not needed for your use case)
8. **Change Streams:** Real-time notifications on data changes

#### Disadvantages ❌

1. **No Joins:** Must denormalize or make multiple queries (N+1 problem)
2. **Eventual Consistency:** By default (can configure for stronger consistency)
3. **New Infrastructure:** Requires running MongoDB instance (Atlas or self-hosted)
4. **Transaction Overhead:** Multi-document ACID transactions have performance cost
5. **Licensing:** SSPL license (Server Side Public License) - restrictions for SaaS
6. **Memory Usage:** Requires more RAM than PostgreSQL for same dataset
7. **Learning Curve:** Different paradigm from SQL
8. **Tooling:** Less mature admin tools compared to PostgreSQL

#### Use Case Fit

**Score:** ⭐⭐⭐ (60%)

**Why it's not ideal:**
- Overkill for your data size (~40KB)
- Adds infrastructure complexity
- No need for horizontal scaling yet
- Already have PostgreSQL running

**Good if:**
- You expect to scale to millions of documents
- Complex aggregations are primary use case
- Team already knows MongoDB

---

### Option 3: Redis with JSON Module

**Approach:** In-memory key-value store with RedisJSON module

#### Schema Design

```javascript
// Key-value pairs with JSON
SET competency:communication '{"id": "communication", "name": "Communication Skills", ...}'
SET rubric:communication '{"beginner": [...], "intermediate": [...], "advanced": [...]}'
SET industry:insurance:config '{"metadata": {...}, "competencies": {...}}'

// With RedisJSON module
JSON.SET rubric:communication $ '{"beginner": [...], "intermediate": [...], "advanced": [...]}'

// Query nested data
JSON.GET rubric:communication $.beginner[0]

// Update nested field
JSON.SET rubric:communication $.beginner[0].criteria '["new criteria"]'
```

#### Advantages ✅

1. **Blazing Fast:** In-memory = sub-millisecond reads (0.1-1ms)
2. **Simple:** Very easy to use and deploy
3. **JSON Support:** RedisJSON module provides JSON path queries
4. **Caching Layer:** Perfect as cache + persistent store hybrid
5. **Pub/Sub:** Built-in messaging for real-time updates
6. **TTL Support:** Automatic expiration of cache entries
7. **Atomic Operations:** Strong consistency for single-key operations

#### Disadvantages ❌

1. **Memory Cost:** Must fit all data in RAM (expensive for large datasets)
2. **Limited Query Capabilities:** No complex joins, aggregations, or full-text search
3. **No ACID for Complex Transactions:** Limited multi-key transaction support
4. **Persistence Trade-offs:** RDB (snapshot) or AOF (append-only) - performance vs durability
5. **Not a Primary Database:** Better suited as cache layer
6. **Single-Threaded:** One command at a time per instance
7. **No Schema Validation:** No built-in validation

#### Use Case Fit

**Score:** ⭐⭐ (40%)

**Why it's not ideal:**
- Not suitable as primary database
- Data doesn't need sub-millisecond access
- Persistence guarantees are weaker

**Good for:**
- Caching layer on top of PostgreSQL (recommended!)
- Session storage
- Real-time leaderboards

---

### Option 4: SQLite with JSON1 Extension

**Approach:** Embedded file-based database with JSON support

#### Schema Design

```sql
-- Similar to PostgreSQL
CREATE TABLE competencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE rubrics (
  competency_id TEXT PRIMARY KEY,
  rubric_data TEXT,  -- JSON stored as TEXT
  FOREIGN KEY (competency_id) REFERENCES competencies(id)
);

-- JSON queries using JSON1 extension
SELECT json_extract(rubric_data, '$.beginner')
FROM rubrics
WHERE competency_id = 'communication';
```

#### Advantages ✅

1. **Zero Configuration:** No separate database server
2. **JSON Support:** JSON1 extension provides JSON functions
3. **ACID Compliant:** Full transactional support
4. **Portable:** Single file database
5. **Lightweight:** Minimal resource usage
6. **Embedded:** Ships with application

#### Disadvantages ❌

1. **No Concurrent Writes:** Single writer at a time (database locks)
2. **Limited Scalability:** Not suitable for high-traffic multi-user apps
3. **No Network Access:** Can't separate application from database
4. **Limited JSON Functions:** Fewer operators than PostgreSQL JSONB
5. **No Replication:** No built-in high availability

#### Use Case Fit

**Score:** ⭐ (20%)

**Why it's not suitable:**
- Only good for development/prototyping
- Your app is multi-user with concurrent access needs
- Already have PostgreSQL infrastructure

---

### Option 5: Current Approach (File-Based JSON)

**What You Have Now:** JSON files in `/shared/data/` directory

#### Current Implementation

```typescript
// Read entire file
const rubrics = readJSONFile<Rubric[]>('rubrics.json');

// Find specific item (must load all)
const rubric = rubrics.find(r => r.id === 'communication');

// Update (must rewrite entire file)
writeJSONFile('rubrics.json', updatedRubrics);
```

#### Advantages ✅

1. **Simplicity:** No database complexity, no setup
2. **Version Control:** Easy to track changes in Git
3. **Human Readable:** Easy to inspect and edit manually
4. **Zero Cost:** No infrastructure, no licensing
5. **Portability:** Works anywhere Node.js runs
6. **Backup:** Just copy files

#### Disadvantages ❌

1. **No Concurrency:** File locks required for writes, risk of corruption
2. **No Atomic Updates:** Race conditions possible
3. **Performance:** Full file read/write for any change (40KB each time)
4. **No Querying:** Must load everything into memory to search
5. **No Validation:** Easy to corrupt data with manual edits
6. **No Backup/Recovery:** Manual process, no point-in-time recovery
7. **No Relationships:** Can't enforce foreign keys
8. **Memory Usage:** Must load all data to access any part
9. **No Transactions:** Can't rollback partial changes

#### Use Case Fit

**Score:** ⭐ (20%)

**Why it's inadequate:**
- Already seeing limitations (your original issue)
- Not scalable beyond development
- Risk of data corruption with concurrent users

**OK for:**
- Development environment
- Configuration that changes via deployment (not runtime)
- Single-user applications

---

## Application-Level Strategies

### Strategy 1: Repository Pattern with Caching ⭐ (RECOMMENDED)

**Architecture:**

```
┌─────────────────────────────────────────────┐
│              Frontend Layer                 │
│  - React Components                         │
│  - API Client (fetch)                       │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│         Backend API Layer                   │
│  ┌──────────────────────────────────────┐  │
│  │   CompetencyService                   │  │
│  │   RubricService                       │  │
│  │   IndustryService                     │  │
│  │   - Business logic                    │  │
│  │   - Validation                        │  │
│  └──────────┬───────────────────────────┘  │
│             │                                │
│  ┌──────────▼───────────────────────────┐  │
│  │   Repository Layer                    │  │
│  │   - CompetencyRepository              │  │
│  │   - RubricRepository                  │  │
│  │   - IndustryRepository                │  │
│  │   - Data access abstraction           │  │
│  └──────────┬───────────────────────────┘  │
│             │                                │
│  ┌──────────▼───────────────────────────┐  │
│  │   Cache Layer (Optional)              │  │
│  │   - Redis/In-Memory                   │  │
│  │   - TTL-based invalidation            │  │
│  │   - Cache-aside pattern               │  │
│  └──────────┬───────────────────────────┘  │
│             │                                │
└─────────────┼────────────────────────────────┘
              │
┌─────────────▼────────────────────────────────┐
│    PostgreSQL Database (JSONB)               │
│    - Persistent storage                      │
│    - ACID transactions                       │
│    - Complex queries                         │
│    - Indexing                                │
└──────────────────────────────────────────────┘
```

#### Implementation Example

```typescript
// 1. Repository Layer - Data Access
class RubricRepository {
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private cacheTTL = 3600000; // 1 hour

  async findByCompetencyId(competencyId: string): Promise<RubricData | null> {
    // Check in-memory cache first
    const cacheKey = `rubric:${competencyId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      console.log('Cache hit:', cacheKey);
      return cached.data;
    }

    // Query database (JSONB)
    const result = await sql`
      SELECT rubric_data
      FROM rubrics
      WHERE competency_id = ${competencyId}
    `;

    if (!result[0]) return null;

    const rubricData = result[0].rubric_data;

    // Cache result
    this.cache.set(cacheKey, {
      data: rubricData,
      expiresAt: Date.now() + this.cacheTTL
    });

    return rubricData;
  }

  async update(competencyId: string, data: RubricData): Promise<void> {
    await sql`
      UPDATE rubrics
      SET rubric_data = ${JSON.stringify(data)},
          updated_at = NOW()
      WHERE competency_id = ${competencyId}
    `;

    // Invalidate cache
    this.invalidateCache(competencyId);
  }

  async invalidateCache(competencyId?: string): Promise<void> {
    if (competencyId) {
      this.cache.delete(`rubric:${competencyId}`);
    } else {
      this.cache.clear();
    }
  }
}

// 2. Service Layer - Business Logic
class RubricService {
  constructor(private repository: RubricRepository) {}

  async getRubricForDifficulty(
    competencyId: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<RubricEntry[] | null> {
    const rubric = await this.repository.findByCompetencyId(competencyId);
    if (!rubric) return null;

    return rubric[difficulty] || [];
  }

  async updateRubric(competencyId: string, data: RubricData): Promise<void> {
    // Validate before saving
    this.validateRubricData(data);

    await this.repository.update(competencyId, data);
  }

  private validateRubricData(data: RubricData): void {
    if (!data.beginner || !data.intermediate || !data.advanced) {
      throw new Error('All difficulty levels required');
    }
    // More validation...
  }
}

// 3. API Layer - HTTP Endpoints
app.get('/api/rubrics/:competencyId', async (req, res) => {
  try {
    const rubric = await rubricService.getRubricForDifficulty(
      req.params.competencyId,
      req.query.difficulty as any
    );

    if (!rubric) {
      return res.status(404).json({ error: 'Rubric not found' });
    }

    res.json({ success: true, data: rubric });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Advantages ✅

- Clean separation of concerns
- Easy to test (mock repositories)
- Flexible (can swap database without changing services)
- Performance (caching layer)
- Type safety (TypeScript interfaces)

---

### Strategy 2: Event Sourcing + CQRS

**Architecture:**

```
Command Side (Writes)          Event Store          Query Side (Reads)
┌──────────────┐              ┌───────────┐         ┌──────────────┐
│ Update       │              │ Event Log │         │ Get Config   │
│ Rubric       │─────────────▶│           │────────▶│              │
│              │   Event      │ - Created │  Replay │ Materialized │
│              │              │ - Updated │         │ View         │
│              │              │ - Deleted │         │              │
└──────────────┘              └───────────┘         └──────────────┘
```

#### Implementation Example

```typescript
// Event types
type ConfigEvent =
  | { type: 'RubricCreated'; data: RubricData; timestamp: Date }
  | { type: 'RubricUpdated'; data: Partial<RubricData>; timestamp: Date }
  | { type: 'RubricDeleted'; competencyId: string; timestamp: Date };

// Event store
class EventStore {
  async appendEvent(event: ConfigEvent): Promise<void> {
    await sql`
      INSERT INTO config_events (event_type, event_data, timestamp)
      VALUES (${event.type}, ${JSON.stringify(event)}, ${event.timestamp})
    `;
  }

  async getEvents(entityId: string): Promise<ConfigEvent[]> {
    const results = await sql`
      SELECT event_data FROM config_events
      WHERE entity_id = ${entityId}
      ORDER BY timestamp ASC
    `;
    return results.map(r => r.event_data);
  }
}

// Rebuild state from events
class RubricProjection {
  async rebuild(competencyId: string): Promise<RubricData> {
    const events = await eventStore.getEvents(competencyId);

    let state = {};
    for (const event of events) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  private applyEvent(state: any, event: ConfigEvent): any {
    switch (event.type) {
      case 'RubricCreated':
        return event.data;
      case 'RubricUpdated':
        return { ...state, ...event.data };
      case 'RubricDeleted':
        return null;
      default:
        return state;
    }
  }
}
```

#### Advantages ✅

- Full audit trail of all changes
- Time-travel queries (see config at any point in time)
- Replay events to rebuild state
- Perfect for compliance/audit requirements

#### Disadvantages ❌

- Complex to implement
- Higher storage costs (keep all events)
- Eventual consistency
- Overkill for simple config data

#### Use Case Fit

**Score:** ⭐⭐ (30%)

**Only if:**
- Audit trail is critical requirement
- Need to track who changed what when
- Compliance requirements demand it

---

### Strategy 3: Versioned Configuration

**Approach:** Store multiple versions of each config

#### Implementation

```typescript
interface ConfigVersion {
  version: string;
  timestamp: Date;
  data: any;
  changedBy: string;
  changeReason?: string;
}

class VersionedConfigRepository {
  async saveVersion(
    entityType: string,
    entityId: string,
    version: string,
    data: any,
    changedBy: string
  ): Promise<void> {
    await sql`
      INSERT INTO config_versions (
        entity_type,
        entity_id,
        version,
        data,
        changed_by,
        created_at
      ) VALUES (
        ${entityType},
        ${entityId},
        ${version},
        ${JSON.stringify(data)},
        ${changedBy},
        NOW()
      )
    `;
  }

  async getLatestVersion(entityType: string, entityId: string): Promise<any> {
    const result = await sql`
      SELECT data FROM config_versions
      WHERE entity_type = ${entityType}
        AND entity_id = ${entityId}
      ORDER BY version DESC
      LIMIT 1
    `;
    return result[0]?.data;
  }

  async getVersion(
    entityType: string,
    entityId: string,
    version: string
  ): Promise<any> {
    const result = await sql`
      SELECT data FROM config_versions
      WHERE entity_type = ${entityType}
        AND entity_id = ${entityId}
        AND version = ${version}
    `;
    return result[0]?.data;
  }

  async rollback(
    entityType: string,
    entityId: string,
    version: string
  ): Promise<void> {
    const oldVersion = await this.getVersion(entityType, entityId, version);
    if (!oldVersion) throw new Error('Version not found');

    const newVersion = this.incrementVersion(version);
    await this.saveVersion(entityType, entityId, newVersion, oldVersion, 'system');
  }
}
```

#### Advantages ✅

- Rollback capability
- Change tracking
- A/B testing (serve different versions to different users)
- Compare versions

#### Disadvantages ❌

- Storage overhead
- More complex queries
- Version management complexity

---

### Strategy 4: Schema Validation

**Approach:** Validate JSON structure before storage using JSON Schema

#### Implementation

```typescript
import Ajv from 'ajv';

// Define JSON Schema
const rubricSchema = {
  type: 'object',
  required: ['beginner', 'intermediate', 'advanced'],
  properties: {
    beginner: {
      type: 'array',
      items: {
        type: 'object',
        required: ['range', 'description', 'criteria'],
        properties: {
          range: { type: 'string', pattern: '^\\d+-\\d+$' },
          description: { type: 'string', minLength: 1 },
          criteria: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1
          }
        }
      }
    },
    intermediate: { /* same structure */ },
    advanced: { /* same structure */ }
  }
};

class ValidatedRubricRepository {
  private ajv = new Ajv();
  private validate = this.ajv.compile(rubricSchema);

  async save(competencyId: string, rubricData: any): Promise<void> {
    // Validate schema
    if (!this.validate(rubricData)) {
      throw new ValidationError({
        message: 'Invalid rubric data',
        errors: this.validate.errors
      });
    }

    // Save to database
    await sql`
      INSERT INTO rubrics (competency_id, rubric_data)
      VALUES (${competencyId}, ${JSON.stringify(rubricData)})
      ON CONFLICT (competency_id)
      DO UPDATE SET rubric_data = EXCLUDED.rubric_data
    `;
  }
}

// Alternative: Use Zod for TypeScript integration
import { z } from 'zod';

const rubricEntrySchema = z.object({
  range: z.string().regex(/^\d+-\d+$/),
  description: z.string().min(1),
  criteria: z.array(z.string()).min(1)
});

const rubricSchema = z.object({
  beginner: z.array(rubricEntrySchema),
  intermediate: z.array(rubricEntrySchema),
  advanced: z.array(rubricEntrySchema)
});

type RubricData = z.infer<typeof rubricSchema>;

class ZodValidatedRepository {
  async save(competencyId: string, rubricData: unknown): Promise<void> {
    // Validate and parse
    const validated = rubricSchema.parse(rubricData);

    // Type-safe! validated is RubricData
    await sql`
      INSERT INTO rubrics (competency_id, rubric_data)
      VALUES (${competencyId}, ${JSON.stringify(validated)})
    `;
  }
}
```

#### Advantages ✅

- Prevents data corruption
- Self-documenting schema
- Type safety (with Zod)
- Validation errors are descriptive
- Can generate types from schema

---

## Final Recommendation

### Recommended Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│  Database: PostgreSQL with JSONB                        │
│  ────────────────────────────────────────────────────  │
│  Tables:                                                │
│    - competencies (relational)                          │
│    - rubrics (JSONB for nested structure)               │
│    - industry_configs (JSONB for flexible config)       │
│                                                         │
│  Caching: Redis (Optional - Phase 2)                    │
│  ────────────────────────────────────────────────────  │
│    - Cache compiled configs with TTL                    │
│    - Invalidate on updates                              │
│    - Reduce database load                               │
│                                                         │
│  Application Architecture:                              │
│  ────────────────────────────────────────────────────  │
│    - Repository Pattern (data access abstraction)       │
│    - Service Layer (business logic)                     │
│    - Schema Validation (Zod for TypeScript)             │
│    - Optional: Versioning for audit trail               │
│                                                         │
│  Development Tools:                                     │
│  ────────────────────────────────────────────────────  │
│    - TypeScript for type safety                         │
│    - Zod for runtime validation                         │
│    - Migrations (node-pg-migrate or Prisma)             │
└─────────────────────────────────────────────────────────┘
```

### Why This Combination?

#### 1. PostgreSQL with JSONB is the Perfect Choice

**Technical Reasons:**
- ✅ Already using PostgreSQL (Neon DB) - no new infrastructure
- ✅ JSONB provides schema flexibility without losing query power
- ✅ Can handle nested structures efficiently with GIN indexes
- ✅ ACID compliance ensures data integrity
- ✅ Binary JSONB format is faster than TEXT JSON
- ✅ Rich set of operators for querying nested data
- ✅ Can add constraints and validation at database level

**Business Reasons:**
- ✅ No additional licensing costs
- ✅ Team likely already knows SQL
- ✅ Mature tooling ecosystem (pgAdmin, DBeaver, Postico)
- ✅ Easy to find developers with PostgreSQL experience
- ✅ Lower operational complexity

#### 2. Specific Schema Design

```sql
-- =====================================================
-- Competencies Table (Relational)
-- =====================================================
CREATE TABLE competencies (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  weight INTEGER DEFAULT 10 CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_competencies_category ON competencies(category);

-- =====================================================
-- Rubrics Table (JSONB for Complex Nested Data)
-- =====================================================
CREATE TABLE rubrics (
  competency_id VARCHAR(100) PRIMARY KEY REFERENCES competencies(id) ON DELETE CASCADE,
  rubric_data JSONB NOT NULL,
  version VARCHAR(20) DEFAULT '1.0.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure rubric has all difficulty levels
  CONSTRAINT rubric_has_all_levels CHECK (
    rubric_data ? 'beginner' AND
    rubric_data ? 'intermediate' AND
    rubric_data ? 'advanced'
  )
);

-- GIN index for fast JSONB queries
CREATE INDEX idx_rubrics_data ON rubrics USING GIN (rubric_data);

-- Index specific JSON paths if needed
CREATE INDEX idx_rubrics_beginner ON rubrics USING GIN ((rubric_data->'beginner'));

-- =====================================================
-- Industry Configurations (JSONB for Flexibility)
-- =====================================================
CREATE TABLE industry_configs (
  industry_key VARCHAR(100) PRIMARY KEY,
  display_name VARCHAR(255) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  competency_mappings JSONB NOT NULL DEFAULT '{}',
  difficulty_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GIN indexes for nested queries
CREATE INDEX idx_industry_competency_mappings
  ON industry_configs USING GIN (competency_mappings);
CREATE INDEX idx_industry_difficulty
  ON industry_configs USING GIN (difficulty_settings);

-- =====================================================
-- Optional: Config Versions for Audit Trail
-- =====================================================
CREATE TABLE config_versions (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'rubric', 'industry_config', etc.
  entity_id VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  data JSONB NOT NULL,
  changed_by VARCHAR(100),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(entity_type, entity_id, version)
);

CREATE INDEX idx_config_versions_lookup
  ON config_versions(entity_type, entity_id, version DESC);

-- =====================================================
-- Triggers for Auto-Update Timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competencies_updated_at
  BEFORE UPDATE ON competencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rubrics_updated_at
  BEFORE UPDATE ON rubrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_configs_updated_at
  BEFORE UPDATE ON industry_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Application Code Pattern

```typescript
// =====================================================
// Type Definitions
// =====================================================
import { z } from 'zod';

// Rubric Entry Schema
const rubricEntrySchema = z.object({
  range: z.string().regex(/^\d+-\d+$/, 'Range must be in format "1-2"'),
  description: z.string().min(1, 'Description required'),
  criteria: z.array(z.string().min(1)).min(1, 'At least one criterion required')
});

// Full Rubric Schema
const rubricDataSchema = z.object({
  beginner: z.array(rubricEntrySchema).min(1),
  intermediate: z.array(rubricEntrySchema).min(1),
  advanced: z.array(rubricEntrySchema).min(1)
});

type RubricEntry = z.infer<typeof rubricEntrySchema>;
type RubricData = z.infer<typeof rubricDataSchema>;

// =====================================================
// Repository Layer
// =====================================================
class RubricRepository {
  private cache = new Map<string, { data: RubricData; expiresAt: number }>();
  private cacheTTL = 3600000; // 1 hour

  /**
   * Get rubric by competency ID
   * Uses in-memory cache for performance
   */
  async findByCompetencyId(competencyId: string): Promise<RubricData | null> {
    // Check cache first
    const cacheKey = `rubric:${competencyId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Query database
    const result = await sql`
      SELECT rubric_data
      FROM rubrics
      WHERE competency_id = ${competencyId}
    `;

    if (!result[0]) return null;

    const rubricData = result[0].rubric_data as RubricData;

    // Update cache
    this.cache.set(cacheKey, {
      data: rubricData,
      expiresAt: Date.now() + this.cacheTTL
    });

    return rubricData;
  }

  /**
   * Create or update rubric
   * Validates data before saving
   */
  async upsert(competencyId: string, data: unknown): Promise<void> {
    // Validate with Zod
    const validatedData = rubricDataSchema.parse(data);

    // Save to database (UPSERT)
    await sql`
      INSERT INTO rubrics (competency_id, rubric_data, updated_at)
      VALUES (${competencyId}, ${JSON.stringify(validatedData)}, NOW())
      ON CONFLICT (competency_id)
      DO UPDATE SET
        rubric_data = EXCLUDED.rubric_data,
        updated_at = NOW()
    `;

    // Invalidate cache
    this.cache.delete(`rubric:${competencyId}`);
  }

  /**
   * Get rubric for specific difficulty level
   */
  async findByDifficulty(
    competencyId: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<RubricEntry[] | null> {
    const result = await sql`
      SELECT rubric_data->${difficulty} as entries
      FROM rubrics
      WHERE competency_id = ${competencyId}
    `;

    return result[0]?.entries || null;
  }

  /**
   * Delete rubric
   */
  async delete(competencyId: string): Promise<void> {
    await sql`
      DELETE FROM rubrics
      WHERE competency_id = ${competencyId}
    `;

    this.cache.delete(`rubric:${competencyId}`);
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// =====================================================
// Service Layer
// =====================================================
class RubricService {
  constructor(private repository: RubricRepository) {}

  /**
   * Get rubric for competency at specific difficulty
   */
  async getRubricForDifficulty(
    competencyId: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<RubricEntry[] | null> {
    return this.repository.findByDifficulty(competencyId, difficulty);
  }

  /**
   * Get complete rubric
   */
  async getRubric(competencyId: string): Promise<RubricData | null> {
    return this.repository.findByCompetencyId(competencyId);
  }

  /**
   * Update rubric (with validation)
   */
  async updateRubric(competencyId: string, data: unknown): Promise<void> {
    try {
      await this.repository.upsert(competencyId, data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid rubric data', error.errors);
      }
      throw error;
    }
  }

  /**
   * Score evaluation based on rubric
   */
  async evaluateScore(
    competencyId: string,
    difficulty: string,
    score: number
  ): Promise<RubricEntry | null> {
    const entries = await this.getRubricForDifficulty(
      competencyId,
      difficulty as any
    );

    if (!entries) return null;

    // Find matching entry
    for (const entry of entries) {
      const [min, max] = entry.range.split('-').map(Number);
      if (score >= min && score <= max) {
        return entry;
      }
    }

    return null;
  }
}

// =====================================================
// Industry Config Repository
// =====================================================
class IndustryConfigRepository {
  async findByKey(industryKey: string): Promise<any | null> {
    const result = await sql`
      SELECT * FROM industry_configs
      WHERE industry_key = ${industryKey}
    `;
    return result[0] || null;
  }

  async updateCompetencyMappings(
    industryKey: string,
    subcategory: string,
    competencies: string[]
  ): Promise<void> {
    await sql`
      UPDATE industry_configs
      SET competency_mappings = jsonb_set(
        competency_mappings,
        ${`{${subcategory},competencies}`},
        ${JSON.stringify(competencies)}::jsonb,
        true
      ),
      updated_at = NOW()
      WHERE industry_key = ${industryKey}
    `;
  }

  async getDifficultySettings(industryKey: string): Promise<any> {
    const result = await sql`
      SELECT difficulty_settings
      FROM industry_configs
      WHERE industry_key = ${industryKey}
    `;
    return result[0]?.difficulty_settings || null;
  }
}

// =====================================================
// API Endpoints
// =====================================================
import express from 'express';

const app = express();
const rubricService = new RubricService(new RubricRepository());

// GET /api/rubrics/:competencyId
app.get('/api/rubrics/:competencyId', async (req, res) => {
  try {
    const { competencyId } = req.params;
    const { difficulty } = req.query;

    if (difficulty) {
      const entries = await rubricService.getRubricForDifficulty(
        competencyId,
        difficulty as any
      );

      if (!entries) {
        return res.status(404).json({
          success: false,
          error: 'Rubric not found'
        });
      }

      return res.json({ success: true, data: entries });
    }

    const rubric = await rubricService.getRubric(competencyId);

    if (!rubric) {
      return res.status(404).json({
        success: false,
        error: 'Rubric not found'
      });
    }

    res.json({ success: true, data: rubric });
  } catch (error) {
    console.error('Get rubric error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/rubrics/:competencyId
app.put('/api/rubrics/:competencyId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { competencyId } = req.params;

    await rubricService.updateRubric(competencyId, req.body);

    res.json({
      success: true,
      message: 'Rubric updated successfully'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        details: error.details
      });
    }

    console.error('Update rubric error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## Implementation Plan

### Phase 1: Database Migration (Week 1)

**Goal:** Migrate from file-based to PostgreSQL JSONB

#### Step 1: Create Tables

```sql
-- Run migration SQL (see schema above)
-- Use a migration tool like node-pg-migrate or Prisma
```

#### Step 2: Data Migration Script

```typescript
import { readJSONFile } from './utils/file-storage';
import { sql } from './db/connection';

async function migrateData() {
  console.log('Starting data migration...');

  // 1. Migrate Competencies
  const competencies = readJSONFile('competencies.json');
  for (const comp of competencies) {
    await sql`
      INSERT INTO competencies (id, name, description, category, weight)
      VALUES (
        ${comp.id},
        ${comp.name},
        ${comp.description || null},
        ${comp.category || 'General'},
        ${comp.weight || 10}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`✓ Migrated ${competencies.length} competencies`);

  // 2. Migrate Rubrics
  const rubrics = readJSONFile('rubrics.json');
  for (const rubric of rubrics) {
    await sql`
      INSERT INTO rubrics (competency_id, rubric_data)
      VALUES (
        ${rubric.id},
        ${JSON.stringify(rubric.rubric)}
      )
      ON CONFLICT (competency_id) DO UPDATE
      SET rubric_data = EXCLUDED.rubric_data
    `;
  }
  console.log(`✓ Migrated ${rubrics.length} rubrics`);

  // 3. Migrate Industry Configs
  const industryCompetencies = readJSONFile('industry-competencies.json');
  const industryMetadata = readJSONFile('industry-metadata.json');
  const difficultySettings = readJSONFile('difficulty-settings.json');

  for (const industry of Object.keys(industryMetadata)) {
    await sql`
      INSERT INTO industry_configs (
        industry_key,
        display_name,
        metadata,
        competency_mappings,
        difficulty_settings
      )
      VALUES (
        ${industry},
        ${industryMetadata[industry].name},
        ${JSON.stringify(industryMetadata[industry])},
        ${JSON.stringify(industryCompetencies[industry] || {})},
        ${JSON.stringify(difficultySettings[industry] || {})}
      )
      ON CONFLICT (industry_key) DO UPDATE
      SET
        metadata = EXCLUDED.metadata,
        competency_mappings = EXCLUDED.competency_mappings,
        difficulty_settings = EXCLUDED.difficulty_settings
    `;
  }
  console.log(`✓ Migrated ${Object.keys(industryMetadata).length} industries`);

  console.log('✅ Migration complete!');
}

migrateData().catch(console.error);
```

#### Step 3: Update Repositories

```typescript
// Switch from file-based to database-based repositories
// Example: RubricRepository
class RubricRepository {
  // Before: Read from JSON file
  // async findByCompetencyId(id: string) {
  //   const rubrics = readJSONFile('rubrics.json');
  //   return rubrics.find(r => r.id === id);
  // }

  // After: Read from PostgreSQL JSONB
  async findByCompetencyId(id: string) {
    const result = await sql`
      SELECT rubric_data FROM rubrics WHERE competency_id = ${id}
    `;
    return result[0]?.rubric_data;
  }
}
```

#### Step 4: Testing

```typescript
// Integration tests
describe('RubricRepository', () => {
  it('should fetch rubric from database', async () => {
    const rubric = await rubricRepository.findByCompetencyId('communication');
    expect(rubric).toBeDefined();
    expect(rubric.beginner).toBeDefined();
    expect(rubric.intermediate).toBeDefined();
    expect(rubric.advanced).toBeDefined();
  });

  it('should update rubric in database', async () => {
    const updatedData = { beginner: [...], intermediate: [...], advanced: [...] };
    await rubricRepository.upsert('communication', updatedData);

    const fetched = await rubricRepository.findByCompetencyId('communication');
    expect(fetched).toEqual(updatedData);
  });
});
```

#### Step 5: Deploy

1. Run migration on staging environment
2. Test all functionality
3. Keep file-based system as fallback
4. Deploy to production
5. Monitor for issues
6. After 1 week of stable operation, remove file-based code

---

### Phase 2: Add Caching Layer (Optional - Week 2-3)

**Goal:** Improve read performance with Redis cache

#### Step 1: Set Up Redis

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or use a managed service (Redis Cloud, AWS ElastiCache, etc.)
```

#### Step 2: Add Redis Client

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

export { redis };
```

#### Step 3: Update Repository with Redis Cache

```typescript
class RubricRepository {
  async findByCompetencyId(competencyId: string): Promise<RubricData | null> {
    const cacheKey = `rubric:${competencyId}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss - query database
    const result = await sql`
      SELECT rubric_data FROM rubrics WHERE competency_id = ${competencyId}
    `;

    if (!result[0]) return null;

    const rubricData = result[0].rubric_data;

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(rubricData));

    return rubricData;
  }

  async upsert(competencyId: string, data: RubricData): Promise<void> {
    // Save to database
    await sql`
      INSERT INTO rubrics (competency_id, rubric_data)
      VALUES (${competencyId}, ${JSON.stringify(data)})
      ON CONFLICT (competency_id)
      DO UPDATE SET rubric_data = EXCLUDED.rubric_data
    `;

    // Invalidate cache
    await redis.del(`rubric:${competencyId}`);
  }
}
```

#### Step 4: Monitor Performance

```typescript
// Add metrics
class RubricRepository {
  private cacheHits = 0;
  private cacheMisses = 0;

  async findByCompetencyId(competencyId: string): Promise<RubricData | null> {
    const cacheKey = `rubric:${competencyId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      this.cacheHits++;
      console.log(`Cache hit rate: ${this.getCacheHitRate()}%`);
      return JSON.parse(cached);
    }

    this.cacheMisses++;
    // ... rest of implementation
  }

  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }
}
```

---

### Phase 3: Add Validation (Week 3-4)

**Goal:** Ensure data integrity with schema validation

#### Step 1: Define Schemas with Zod

```typescript
// schemas/rubric.schema.ts
import { z } from 'zod';

export const rubricEntrySchema = z.object({
  range: z.string().regex(/^\d+-\d+$/, 'Range must be "min-max" format'),
  description: z.string().min(1, 'Description is required'),
  criteria: z.array(z.string().min(1)).min(1, 'At least one criterion required')
});

export const rubricDataSchema = z.object({
  beginner: z.array(rubricEntrySchema).min(1, 'Beginner entries required'),
  intermediate: z.array(rubricEntrySchema).min(1, 'Intermediate entries required'),
  advanced: z.array(rubricEntrySchema).min(1, 'Advanced entries required')
});

export type RubricEntry = z.infer<typeof rubricEntrySchema>;
export type RubricData = z.infer<typeof rubricDataSchema>;
```

#### Step 2: Add Validation to Repository

```typescript
class RubricRepository {
  async upsert(competencyId: string, data: unknown): Promise<void> {
    // Validate with Zod
    const validatedData = rubricDataSchema.parse(data);

    // Save validated data
    await sql`
      INSERT INTO rubrics (competency_id, rubric_data)
      VALUES (${competencyId}, ${JSON.stringify(validatedData)})
      ON CONFLICT (competency_id)
      DO UPDATE SET rubric_data = EXCLUDED.rubric_data
    `;
  }
}
```

#### Step 3: Handle Validation Errors

```typescript
// API endpoint with validation error handling
app.put('/api/rubrics/:competencyId', async (req, res) => {
  try {
    await rubricService.updateRubric(req.params.competencyId, req.body);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### Phase 4: Optional Enhancements

#### Versioning (If Needed)

```typescript
class VersionedRubricRepository extends RubricRepository {
  async upsert(competencyId: string, data: RubricData, userId: string): Promise<void> {
    // Get current version
    const current = await this.findByCompetencyId(competencyId);

    // Save new version to history
    await sql`
      INSERT INTO config_versions (
        entity_type, entity_id, version, data, changed_by
      ) VALUES (
        'rubric', ${competencyId}, ${this.nextVersion()},
        ${JSON.stringify(data)}, ${userId}
      )
    `;

    // Update current
    await super.upsert(competencyId, data);
  }

  async rollback(competencyId: string, version: string): Promise<void> {
    const historical = await sql`
      SELECT data FROM config_versions
      WHERE entity_type = 'rubric'
        AND entity_id = ${competencyId}
        AND version = ${version}
    `;

    if (historical[0]) {
      await this.upsert(competencyId, historical[0].data, 'system');
    }
  }
}
```

---

## Performance Benchmarks

### Expected Performance (PostgreSQL JSONB)

| Operation | Current (Files) | PostgreSQL | PostgreSQL + Redis |
|-----------|----------------|------------|-------------------|
| **Read Single Config** | 1-5ms | 2-10ms | 0.1-1ms |
| **Write Single Config** | 5-50ms | 5-20ms | 5-20ms + cache invalidation |
| **Query Nested Data** | 10-100ms | 5-15ms | 0.5-2ms |
| **Complex Query** | 50-500ms | 10-50ms | 5-20ms |
| **Concurrent Reads** | ❌ Limited | ✅ 1000s/sec | ✅ 10000s/sec |
| **Concurrent Writes** | ❌ Single writer | ✅ 100s/sec | ✅ 100s/sec |

### Storage Requirements

| Data Type | Size | JSONB Overhead | Total |
|-----------|------|----------------|-------|
| Competencies | 1KB | ~10% | ~1.1KB |
| Rubrics | 32KB | ~10% | ~35KB |
| Industry Configs | 8KB | ~10% | ~9KB |
| **Total** | **41KB** | - | **~45KB** |

**Conclusion:** Even with 1000x growth, data would be <50MB - fits easily in PostgreSQL.

---

## Summary & Decision

### Final Recommendation: PostgreSQL with JSONB ⭐

**Why:**
1. ✅ **No new infrastructure** - Already using PostgreSQL (Neon)
2. ✅ **Best balance** - Relational structure + JSON flexibility
3. ✅ **Performance** - Fast queries with GIN indexes
4. ✅ **Flexibility** - Schema can evolve without migrations
5. ✅ **Proven** - Battle-tested for semi-structured data
6. ✅ **Cost-effective** - No additional licensing
7. ✅ **Developer-friendly** - Standard SQL + JSON operators
8. ✅ **Future-proof** - Can add Redis caching later if needed

### What NOT to Choose:

| Option | Why Not |
|--------|---------|
| **MongoDB** | Overkill for 40KB data, adds complexity, new infrastructure |
| **Redis-only** | Not suitable as primary database, persistence concerns |
| **SQLite** | No concurrent writes, not for production multi-user apps |
| **File-based** | Already showing limitations, no concurrency, risk of corruption |

### Implementation Roadmap:

1. **Week 1:** PostgreSQL JSONB migration (HIGH PRIORITY)
2. **Week 2-3:** Add Redis caching (OPTIONAL - only if performance needed)
3. **Week 3-4:** Add Zod validation (RECOMMENDED)
4. **Week 4+:** Consider versioning if audit trail needed

### Success Criteria:

- ✅ All config data migrated to PostgreSQL
- ✅ API response times < 50ms (p95)
- ✅ Zero data corruption incidents
- ✅ Easy to add/modify config fields
- ✅ Admin UI works seamlessly

---

## Questions & Answers

**Q: Can we switch from PostgreSQL to MongoDB later if needed?**
A: Yes. The Repository Pattern abstracts the database, so swapping is relatively easy. Just implement MongoRubricRepository with same interface.

**Q: What if we need to add new fields to rubrics?**
A: With JSONB, just update the JSON - no migration needed. Add to Zod schema for validation.

**Q: How do we handle schema migrations?**
A: Use a migration tool like `node-pg-migrate`:
```bash
npx node-pg-migrate create add-rubrics-table
```

**Q: What if Redis goes down?**
A: App continues working, just queries PostgreSQL directly. Cache is optional performance enhancement, not required.

**Q: How do we backup configuration data?**
A: PostgreSQL backups handled by Neon. Export configs to JSON for redundancy:
```typescript
async function exportBackup() {
  const rubrics = await sql`SELECT * FROM rubrics`;
  writeJSONFile('backup-rubrics.json', rubrics);
}
```

---

**Document Version:** 1.0
**Last Updated:** December 20, 2025
**Author:** AI Analysis Team
**Status:** Ready for Implementation
