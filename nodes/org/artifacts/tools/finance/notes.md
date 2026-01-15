# Finance — Working Notes

This document contains the full specification and implementation notes for the Finance tool.

---

## Specification: Local-First Finance Sensor

Chase CSV → Observations → Ledger → Reports

---

### 0. Observation Infrastructure

This tool is the first sensor in what may become a multi-domain observation system. The architecture is designed to support future sensors (health, calendar, code activity, etc.) without requiring changes to the core schema.

#### Design Principle: Observations Belong to Nodes

Each **node** in the system is a self-contained organism with its own observation layer. Nodes don't share internal state—they regulate independently. This follows the "Separation of Organisms" principle.

```
nodes/personal/                       nodes/org/
  │                                     │
  ├── data/                             ├── data/
  │   └── observations.sqlite           │   └── observations.sqlite
  │       │                             │       │
  │       ├── observations (table)      │       ├── observations (table)
  │       ├── finance_transactions      │       ├── code_commits
  │       └── health_sleep_sessions     │       └── project_metrics
  │                                     │
  ├── raw/                              ├── raw/
  │   └── finance/chase/                │   └── git/
  │                                     │
  ├── log.md                            ├── log.md
  ├── feedback.md                       ├── feedback.md
  └── models.md                         └── models.md
    (regulatory layer)                    (regulatory layer)
```

Each node has:

- **Its own observation layer** — sensors feed data into the node's `data/observations.sqlite`
- **Its own regulatory layer** — log, feedback, models, episodes (markdown)
- **Cross-domain queries within the node** — e.g., "spending on days I slept poorly" works because finance + health are in the same node

The **tooling** is shared (same ChaseCSVAdapter code), but the **data** lives per-node.

#### What This Means for v1

- The SQLite database lives at `nodes/personal/data/observations.sqlite`
- The `observations` table is domain-agnostic (finance, health, etc. coexist)
- The `finance_transactions` projection is finance-specific
- Future sensors add new observation types and projections to the same node
- Different nodes (personal vs org) have separate databases

---

### 1. Purpose

#### Goal

Create a safe, local-first personal analytics pipeline that:

- Ingests Chase transaction exports (CSV)
- Stores them as generic Observations (future-proof for many sensor domains)
- Maintains a finance transaction projection for fast analytics
- Provides minimal analytics:
  - Monthly spend / income / net
  - Merchant rollups
- Provides system integrity signals:
  - Staleness detection ("data is old")

#### Non-goals (v1)

- Automated bank login / scraping
- Real-time sync
- Multi-bank connectors
- Complex categorization / budgeting UX
- Multi-user permissions

---

### 2. System Model (Cybernetic Framing)

| Component           | Role                             |
| ------------------- | -------------------------------- |
| Environment         | Real-world financial activity    |
| Upstream transducer | Chase's ledger representation    |
| Sensor interface    | CSV ingest adapter               |
| Memory              | Local event log + projections    |
| Observer            | Analytics queries (reports)      |
| Health monitoring   | Data staleness (sensor liveness) |

---

### 3. High-Level Architecture

#### Components

**Sensor (ChaseCSVAdapter)**

- Input: Chase CSV file(s)
- Output: list/stream of Observation objects

**Memory (SQLiteMemoryStore)**

- Append-only storage: observations
- Projection: finance_transactions
- Idempotent ingest via deterministic IDs/fingerprints

**Observer (Reports)**

- Reads projections (and optionally observations)
- Produces:
  - Monthly totals
  - Merchant rollups

**Ops/Health (Status)**

- Reads projections
- Computes staleness + coverage stats

#### Data Flow

```
CSV files → parse/normalize → Observation(finance.transaction) → store observations → upsert transaction projection → reports/status
```

---

### 3.1 Component Interfaces (Modularity Contracts)

These interfaces define the boundaries between components. Any implementation that satisfies the interface can be swapped in without changing the rest of the system.

#### Observation (Universal Data Contract)

The core data type that all sensors produce and all storage/projectors consume:

```typescript
interface Observation {
  id: string; // Deterministic fingerprint
  type: string; // e.g., "finance.transaction", "health.sleep_session"
  timestamp: string; // ISO-8601
  source: string; // e.g., "chase_csv", "oura_api"
  schema_version: number; // Payload schema version
  payload: Record<string, unknown>; // Domain-specific data
  ingested_at?: string; // Set by MemoryStore on insert
}
```

#### Sensor (Input Adapter)

Sensors parse external data into Observations. They never store or execute—only parse:

```typescript
interface Sensor<TInput> {
  /** Unique identifier for this sensor type */
  source: string; // e.g., "chase_csv"

  /** The observation type this sensor produces */
  observationType: string; // e.g., "finance.transaction"

  /** Parse input into observations. Pure function, no side effects. */
  parse(input: TInput, options?: SensorOptions): SensorResult;
}

interface SensorOptions {
  accountLabel?: string; // Optional context for fingerprinting
}

interface SensorResult {
  observations: Observation[];
  errors: ParseError[];
  metadata: {
    rowsRead: number;
    rowsParsed: number;
    dateRange: { min: string; max: string } | null;
  };
}

interface ParseError {
  row?: number;
  field?: string;
  message: string;
}
```

**Example implementations:**

- `ChaseCSVSensor` — parses Chase CSV files
- `PlaidSensor` — parses Plaid API responses (future)
- `OuraSensor` — parses Oura sleep data (future)

#### MemoryStore (Persistence)

The storage backend. Handles append-only observation storage and provides query access:

```typescript
interface MemoryStore {
  /** Append observations. Ignores duplicates (by id). Returns insert stats. */
  appendObservations(observations: Observation[]): AppendResult;

  /** Query observations by filter. */
  queryObservations(filter: ObservationFilter): Observation[];

  /** Get the most recent observation timestamp for a given type. */
  getLastTimestamp(type: string): string | null;

  /** Get observation counts by type. */
  getCounts(): Record<string, number>;
}

interface AppendResult {
  inserted: number;
  skipped: number; // Duplicates
}

interface ObservationFilter {
  type?: string;
  source?: string;
  since?: string; // ISO-8601
  until?: string; // ISO-8601
  limit?: number;
}
```

**Example implementations:**

- `SQLiteMemoryStore` — production storage
- `InMemoryStore` — for testing

#### Projector (Domain-Specific Materialization)

Projectors transform observations into query-optimized domain tables:

```typescript
interface Projector {
  /** The observation type this projector handles */
  observationType: string; // e.g., "finance.transaction"

  /** Project a batch of observations into the domain table. Idempotent. */
  project(observations: Observation[], store: ProjectionStore): ProjectResult;
}

interface ProjectionStore {
  /** Upsert rows into a projection table. */
  upsert(table: string, rows: Record<string, unknown>[], key: string): void;

  /** Query a projection table. */
  query<T>(table: string, filter: Record<string, unknown>): T[];
}

interface ProjectResult {
  upserted: number;
  table: string;
}
```

**Example implementations:**

- `FinanceTransactionProjector` — projects to `finance_transactions` table
- `HealthSleepProjector` — projects to `health_sleep_sessions` table (future)

#### Reporter (Query & Output)

Reporters query projections and produce formatted output:

```typescript
interface Reporter<TOptions, TOutput> {
  /** Unique name for this report */
  name: string;

  /** Generate the report. */
  run(store: ProjectionStore, options: TOptions): TOutput;
}

// Example: MonthlySpendReporter
interface MonthlyReportOptions {
  lastN?: number; // Last N months
}

interface MonthlyReportRow {
  month: string; // YYYY-MM
  spend: number; // cents
  income: number; // cents
  net: number; // cents
  txnCount: number;
}
```

**Example implementations:**

- `MonthlySpendReporter`
- `MerchantRollupReporter`

#### StatusProvider (Health & Staleness)

Computes system health metrics:

```typescript
interface StatusProvider {
  /** Compute status for a given observation type (or all types). */
  getStatus(store: MemoryStore, type?: string): StatusResult;
}

interface StatusResult {
  status: "OK" | "WARN" | "STALE";
  metrics: {
    lastObservationDate: string | null;
    daysSinceLastObservation: number | null;
    totalObservations: number;
    dateRange: { min: string; max: string } | null;
    lastIngestAt: string | null;
  };
  byType?: Record<string, StatusResult>; // If querying all types
}
```

---

### 3.2 Composition: How Components Connect

The CLI orchestrates these components:

```typescript
// Pseudocode for `finance ingest`
async function ingest(path: string, nodeName: string) {
  const store = new SQLiteMemoryStore(getNodeDataPath(nodeName));
  const sensor = new ChaseCSVSensor();
  const projector = new FinanceTransactionProjector();

  // 1. Parse (Sensor)
  const csvData = await readFile(path);
  const result = sensor.parse(csvData, { accountLabel: options.accountLabel });

  // 2. Store (MemoryStore)
  const appendResult = store.appendObservations(result.observations);

  // 3. Project (Projector)
  const projectResult = projector.project(result.observations, store);

  // 4. Report
  console.log(
    `Inserted: ${appendResult.inserted}, Skipped: ${appendResult.skipped}`
  );
}
```

This separation means:

- Swap `ChaseCSVSensor` for `PlaidSensor` → same downstream flow
- Swap `SQLiteMemoryStore` for `PostgresMemoryStore` → sensors and projectors don't change
- Add `HealthSleepProjector` → reuse the same store and CLI patterns

---

### 4. Data Contracts

#### 4.1 Observation (Canonical Cross-Domain Event)

| Field            | Type              | Description                                   |
| ---------------- | ----------------- | --------------------------------------------- |
| `id`             | TEXT, primary key | Deterministic fingerprint for idempotency     |
| `type`           | TEXT              | e.g. "finance.transaction"                    |
| `timestamp`      | TEXT ISO-8601     | Prefer posted date; fallback transaction date |
| `source`         | TEXT              | e.g. "chase_csv"                              |
| `schema_version` | INTEGER           | Default 1                                     |
| `payload_json`   | TEXT JSON         | Domain-specific payload, minimally normalized |
| `ingested_at`    | TEXT ISO-8601     | When this observation was stored              |

#### Observation Type: `finance.transaction` Payload (v1)

| Field              | Type               | Description                         |
| ------------------ | ------------------ | ----------------------------------- |
| `transaction_date` | YYYY-MM-DD         | Date of transaction                 |
| `posted_date`      | YYYY-MM-DD \| null | Date posted (if available)          |
| `amount`           | number             | Decimal dollars (human friendly)    |
| `currency`         | string             | Default "USD"                       |
| `description_raw`  | string             | Original description from CSV       |
| `description_norm` | string             | Normalized merchant-ish string      |
| `account_label`    | string \| null     | Optional account identifier         |
| `source_row`       | object             | Original row fields for audit/debug |

#### Amount Policy

Store `amount_cents` as integer in projection, and store both:

- **payload**: `amount` as decimal dollars (human friendly)
- **projection**: `amount_cents` integer for precision

Sign convention:

- Debit (money out) is **negative**
- Credit (money in) is **positive**

#### 4.2 Projection: Finance Transactions (Query-Optimized)

**Table: `finance_transactions`**

| Column             | Type                      | Description                             |
| ------------------ | ------------------------- | --------------------------------------- |
| `txn_id`           | TEXT, primary key         | Same as Observation id for traceability |
| `observation_id`   | TEXT, unique, FK          | References observations.id              |
| `transaction_date` | TEXT YYYY-MM-DD           |                                         |
| `posted_date`      | TEXT YYYY-MM-DD, nullable |                                         |
| `amount_cents`     | INTEGER                   | Signed cents                            |
| `currency`         | TEXT                      | Default USD                             |
| `description_raw`  | TEXT                      |                                         |
| `description_norm` | TEXT                      |                                         |
| `merchant`         | TEXT                      | Optional alias of description_norm      |
| `category`         | TEXT, nullable            | Manual categorization (future)          |
| `is_pending`       | INTEGER 0/1               | Default 0                               |
| `superseded_by`    | TEXT, nullable            | For pending→posted merge                |
| `ingested_at`      | TEXT datetime             |                                         |

**Indexes**

- `(transaction_date)`
- `(posted_date)`
- `(description_norm)`
- `(amount_cents)`
- `(transaction_date, description_norm)`

---

### 5. Ingest: Parsing + Normalization + Dedupe

#### 5.1 Input Assumptions (Chase CSV)

Chase CSV formats vary slightly by account type and UI variant. v1 supports:

At minimum, it must have:

- date (transaction date or posted date)
- description
- amount (or separate debit/credit columns)

**Strategy**: implement mapping layer with:

- Known header variants (best effort)
- Fail-fast with a helpful error listing discovered columns when unknown

#### 5.2 Normalization Rules (v1)

**Dates:**

- Parse to ISO YYYY-MM-DD

**Amount:**

- Convert to signed numeric
- Debit negative, credit positive

**Description:**

- `description_raw` unchanged from CSV
- `description_norm` is derived:
  - Uppercase
  - Trim whitespace
  - Collapse repeated spaces
  - Remove obvious suffixes like `*1234`
  - Remove trailing location noise if clearly present (keep conservative)

> **Design note**: Keep normalization conservative in v1. Over-normalization creates false merges.

#### 5.3 Deterministic ID / Fingerprint (Critical)

`observation.id` (and `txn_id`) should be deterministic so ingest is idempotent.

**Fingerprint input (recommended v1)**

- `source` (e.g. chase_csv)
- `transaction_date`
- `amount_cents`
- `description_norm`
- `account_label` (if provided — prevents false deduplication across accounts)

Optionally include:

- `posted_date` if present

**Implementation**

Build a canonical string:

```
chase_csv|finance.transaction|2026-01-14|-12345|STARBUCKS
```

Hash with SHA-256 → hex string

Use that as `id`

#### 5.4 Deduplication Policy

- `observations.id` primary key enforces dedupe
- Projection uses `txn_id` as primary key, so it's also idempotent

#### 5.5 Pending vs Posted Handling (Optional v1)

If Chase export includes pending, you may see duplicates when posted appears later.

v1 can ignore pending complexity and simply dedupe on fingerprint; but better:

If both pending and posted exist and match on (amount, description_norm) within a short window:

- Keep posted as canonical (`is_pending=0`)
- Mark pending row as `is_pending=1` and `superseded_by=<posted_txn_id>`

If you skip this in v1, that's fine—just document it.

---

### 6. Storage: SQLite Schema (v1)

#### Tables

- `observations` (append-only)
- `finance_transactions` (projection)

#### Constraints

- `observations.id` PRIMARY KEY
- `finance_transactions.txn_id` PRIMARY KEY
- `finance_transactions.observation_id` UNIQUE FK

#### Migration Approach

v1 uses a single `schema.sql`

Later add migrations if needed; for now, drop/recreate is acceptable (with backups)

---

### 7. CLI: User Surface

**Command name:** `finance` (v1)

All commands require a `--node <name>` flag to specify which node's observation store to use. This reinforces that observations belong to a specific organism.

**Node resolution:**

```typescript
function getNodeDataPath(nodeName: string): string {
  // Resolves to: nodes/{nodeName}/data/observations.sqlite
  return path.join(
    process.cwd(),
    "nodes",
    nodeName,
    "data",
    "observations.sqlite"
  );
}
```

This keeps the CLI stateless—no configuration files, just pass the node name.

Future consideration: As more sensors are added, the CLI could become `sensor ingest finance <path>` or remain domain-specific (`finance ingest`, `health ingest`). Either works—the data architecture supports both. v1 uses `finance` for simplicity.

#### 7.1 `finance ingest <path> --node <name>`

Ingest one file or all CSVs in a folder.

**Inputs**

- `<path>` file or directory
- Flags:
  - `--node <name>` (required: which node's observation store to use)
  - `--dry-run` (no writes, just parse + show counts)
  - `--move-processed` (move ingested files to processed/)
  - `--account-label "<label>"` (tag imports)

**Behavior**

1. Discover files (if dir: all \*.csv)
2. For each file:
   - Parse rows
   - Normalize
   - Emit observations
   - Append to observations (ignore conflicts)
   - Upsert to finance_transactions (based on txn_id)
3. Print summary

**Output (example)**

```
files processed: N
rows read: X
observations new: Y
duplicates skipped: Z
min/max transaction_date in batch
last transaction_date overall
```

#### 7.2 `finance report monthly --node <name> [--last N]`

Outputs monthly spend/income/net.

**Behavior**

- Query finance_transactions
- Group by month

**Output columns**

- month (YYYY-MM)
- spend (sum of -debits)
- income (sum of credits)
- net (income - spend)
- txn_count

#### 7.3 `finance report merchants --node <name> [--month YYYY-MM] [--last-days N] [--limit K]`

Outputs merchant rollups.

**Modes**

- All time (default)
- By month
- By last N days

**Output columns**

- merchant/description_norm
- spend (sum)
- txn_count

#### 7.4 `finance status --node <name>`

Computes health + staleness for the specified node.

**Metrics**

- `last_transaction_date`
- `days_stale` = today - last_transaction_date
- `total_txns`
- `date_range` = min..max
- `last_ingest_at`

**Status thresholds (default)**

- OK: days_stale ≤ 14
- WARN: 15–30
- STALE: > 30

**Output**

```
status: OK/WARN/STALE
metrics table
```

---

### 8. Reminder Cadence (Ops Policy)

This spec doesn't need a reminder system built into the app yet, but it must support it.

**Cadence recommendation (default)**

- Every 2 weeks
- Wording: "Refresh finance data (Chase export → ingest)"

**Definition of done**

1. Export last 30 days CSV (overlap is fine)
2. Drop into raw folder (`nodes/personal/raw/finance/chase/`)
3. `finance ingest --node personal nodes/personal/raw/finance/chase/`
4. `finance status --node personal` shows OK

**System-level reinforcement**

- `finance status` is the primary feedback signal
- Calendar/task reminder is a secondary prompt

---

### 9. File/Folder Conventions

Default local layout (per-node):

```
nodes/personal/
  /data/
    observations.sqlite      # this node's observation log + projections
  /raw/
    /finance/
      /chase/                # user drops Chase exports here
    /health/                 # future: health exports
  /processed/
    /finance/
      /chase/                # optional, if move-processed enabled
  /log.md
  /feedback.md
  /models.md
  ...
```

- `nodes/*/data/` and `nodes/*/raw/` MUST be .gitignore'd (contains sensitive personal data)
- If you use cloud backup/sync, consider encrypting these folders
- Each node has its own database; back up per-node

#### Why Per-Node

- Each node is a separate organism with its own memory
- Cross-domain queries work within a node (finance + health in personal node)
- Nodes don't share internal state (personal and org are separate)
- Tooling is shared; data is not

---

### 10. Security & Privacy Requirements

- No storage of Chase credentials
- No automated login/scraping
- All data stored locally by default
- Raw exports treated as sensitive
- Logging must avoid printing full raw rows by default
  - Allow `--verbose` for debugging, but warn

---

### 11. Testing Requirements (v1)

#### Unit Tests

- Date parsing (multiple formats)
- Amount parsing (debit/credit, parentheses, commas)
- Description normalization (basic cases)
- Fingerprint determinism

#### Integration Tests

- Ingest same file twice → no duplicates
- Ingest overlapping date ranges → no duplicates
- Reports return stable outputs on a fixed fixture CSV

#### Fixtures

- Store 1–2 anonymized CSV samples (or synthetic) in `tests/fixtures/`
- Do not commit real personal data

---

### 12. Analytics Definitions (v1)

#### Monthly Spend

- **Spend** = sum of absolute value of negative amounts
- **Income** = sum of positive amounts
- **Net** = income - spend

#### Merchant Rollups

- Merchant key = `description_norm` (or `merchant` if you add it)
- Spend rollup uses only negative amounts (money out)

---

### 13. Future Extensions (Explicitly Supported by v1 Contracts)

Add new sensors by emitting new Observation types:

- `health.sleep_session`
- `social.calendar_event`
- `code.commit`

Add projections per domain:

- `health_sleep_sessions`
- `calendar_events`

Swap Chase CSV sensor with OAuth/aggregator later:

- Keep `finance.transaction` observation payload stable
- Add `source="plaid"` or similar

---

### 14. Milestones

| Milestone                    | Scope                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------ |
| M0: Skeleton                 | SQLite schema, CLI scaffold with commands (ingest/status/report)               |
| M1: Chase CSV ingest working | Parse one known Chase CSV format, deterministic fingerprint, idempotent ingest |
| M2: Reports                  | Monthly report, merchant report                                                |
| M3: Status + staleness       | Implement thresholds, print actionable message when stale                      |
| M4: Hardening                | Handle 1–2 Chase CSV header variants, tests + fixtures                         |

---

### 15. Acceptance Criteria (v1)

1. You can export a Chase CSV, drop it in `nodes/personal/raw/finance/chase/`, and run:

   ```
   finance ingest --node personal nodes/personal/raw/finance/chase/
   ```

2. Re-running ingest does not create duplicates.

3. `finance report monthly` produces correct spend/income/net per month.

4. `finance report merchants --last-days 30` shows top spend merchants.

5. `finance status` warns when data is stale per thresholds.

6. No credentials are stored; no scraping is used.

---

## Implementation Notes

### Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: SQLite via `better-sqlite3` (synchronous API, good for CLI)
- **CSV Parsing**: `csv-parse` (handles edge cases)
- **CLI**: Start with raw `process.argv`, add `commander` if surface grows

### Project Structure

The code is organized around the interfaces defined in Section 3.1:

```
tools/
  sensor/                         # shared observation infrastructure
    package.json
    tsconfig.json
    src/
      interfaces/
        observation.ts            # Observation interface
        sensor.ts                 # Sensor interface
        memory-store.ts           # MemoryStore interface
        projector.ts              # Projector interface
        reporter.ts               # Reporter interface
        status.ts                 # StatusProvider interface
        index.ts                  # re-exports all interfaces
      storage/
        sqlite-memory-store.ts    # SQLiteMemoryStore implements MemoryStore
        in-memory-store.ts        # InMemoryStore for testing
        schema.sql                # observations table schema
      status/
        default-status.ts         # DefaultStatusProvider implements StatusProvider
      utils/
        fingerprint.ts            # Deterministic ID generation
        dates.ts                  # ISO-8601 helpers

  finance/                        # finance-specific implementations
    package.json
    src/
      cli.ts                      # CLI entry point
      sensors/
        chase-csv.ts              # ChaseCSVSensor implements Sensor
      projectors/
        transactions.ts           # FinanceTransactionProjector implements Projector
      reporters/
        monthly.ts                # MonthlySpendReporter implements Reporter
        merchants.ts              # MerchantRollupReporter implements Reporter
      schema.sql                  # finance_transactions projection schema
    tests/
      sensors/
        chase-csv.test.ts
      projectors/
        transactions.test.ts
      fixtures/
        chase-sample.csv
```

#### Interface → Implementation Mapping

| Interface        | Shared Implementation                | Finance Implementation                           |
| ---------------- | ------------------------------------ | ------------------------------------------------ |
| `Observation`    | (type definition)                    | —                                                |
| `Sensor`         | —                                    | `ChaseCSVSensor`                                 |
| `MemoryStore`    | `SQLiteMemoryStore`, `InMemoryStore` | —                                                |
| `Projector`      | —                                    | `FinanceTransactionProjector`                    |
| `Reporter`       | —                                    | `MonthlySpendReporter`, `MerchantRollupReporter` |
| `StatusProvider` | `DefaultStatusProvider`              | —                                                |

#### Adding a New Domain (e.g., Health)

To add a health sensor:

1. Create `tools/health/` following the same structure
2. Implement `OuraSensor implements Sensor`
3. Implement `HealthSleepProjector implements Projector`
4. Implement any domain-specific reporters
5. Reuse `SQLiteMemoryStore` and `DefaultStatusProvider` from `sensor/`

The shared interfaces ensure all domains compose the same way.

#### Why This Split

- `tools/sensor/` contains interfaces + shared implementations
- `tools/finance/` contains finance-specific implementations
- Future domains follow the same pattern
- All domains depend on `sensor/` for interfaces; they never depend on each other

### Dependencies (minimal v1)

```json
{
  "dependencies": {
    "better-sqlite3": "^11.x",
    "csv-parse": "^5.x"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.x",
    "@types/node": "^20.x",
    "typescript": "^5.x"
  }
}
```

### Backup Strategy

Each node's `data/observations.sqlite` file is the source of truth for that organism. Backup options:

1. **Manual**: Copy `observations.sqlite` to a backup location periodically
2. **Automated**: Script that copies on each ingest (before or after)
3. **Cloud sync**: If using Dropbox/iCloud, ensure the data folder is included but consider encryption for sensitive data

Each node is backed up independently. For the personal node, one backup covers all its domains (finance, health, etc.).

Document chosen approach in the tool's README.

---

## Becoming Engine Integration (Future)

The observation infrastructure is designed to eventually integrate with each node's regulatory layer. Potential integration points:

1. **Observations → Variable Proxy Signals**: The personal node's financial observations could feed a `financial_health` Variable in that node. Aggregation logic would compute status (InRange, AtRisk) from transaction patterns.

2. **Staleness → Variable Status**: If finance data goes stale, it could affect a Variable's confidence score within that node.

3. **Cross-domain regulation within a node**: Health + finance + calendar observations in the personal node could inform compound Variables about personal viability.

4. **Signaling between nodes**: If a personal Variable (like financial health) crosses a threshold, it could emit a signal to the org node if relevant.

This integration is not required for v1. The observation architecture supports it when the time is right. Each node remains a self-contained organism; integration happens through explicit signals, not shared state.
