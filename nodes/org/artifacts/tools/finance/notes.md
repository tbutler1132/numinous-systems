# Finance — Working Notes

---

## v1 Spec: Memory Organ

> **"This tool converts bank CSVs into a normalized, append-only financial memory."**

That's it. If the description gets longer, you've overshot.

---

### What This Is

A **memory organ** — not a finance app, not a budgeting system, not a decision engine.

You are not solving "money" right now.
You are solving **"how does this system observe itself over time?"**

Cybernetic systems mature in this order:

1. **Sensing** ← you are here
2. **Memory** ← you are here
3. Pattern recognition
4. Variable inference
5. Regulation

Most personal finance tools start at step 5. You're correctly starting at steps 1–2.

---

### What This Is NOT

**Design constraint** — this system MUST NOT:

- Produce scores
- Trigger alerts
- Recommend actions
- Enforce goals
- Tell you what's good or bad
- Nudge behavior
- Optimize spend

Those are downstream concerns. If it does any of that, it's too early.

---

### The Ritual

A repeatable ritual + a data vessel.

1. Download CSV from Chase
2. Drop it in `nodes/personal/raw/finance/chase/`
3. Run: `finance ingest nodes/personal/raw/finance/chase/`
4. Done

That's the habit you're actually installing.

---

### The Schema

One table. Normalized transactions.

```sql
CREATE TABLE transactions (
  id              TEXT PRIMARY KEY,   -- deterministic fingerprint
  timestamp       TEXT NOT NULL,      -- ISO-8601 (posted_date or transaction_date)
  amount_cents    INTEGER NOT NULL,   -- signed: negative = debit, positive = credit
  description_raw TEXT NOT NULL,      -- original from CSV
  description_norm TEXT NOT NULL,     -- normalized for matching
  account_label   TEXT,               -- optional: "checking", "credit", etc.
  source_file     TEXT,               -- which file this came from
  ingested_at     TEXT NOT NULL       -- when this row was added
);

CREATE INDEX idx_timestamp ON transactions(timestamp);
CREATE INDEX idx_description_norm ON transactions(description_norm);
```

That's it. No projections, no separate observations table, no multi-domain abstractions. Just transactions.

---

### Normalization Rules

**Dates:**

- Parse to ISO YYYY-MM-DD
- Prefer posted_date; fall back to transaction_date

**Amount:**

- Convert to signed integer cents
- Debit (money out) = negative
- Credit (money in) = positive

**Description:**

- `description_raw` = unchanged from CSV
- `description_norm` = derived:
  - Uppercase
  - Trim whitespace
  - Collapse repeated spaces
  - Remove obvious suffixes like `*1234`

Keep normalization conservative. Over-normalization creates false merges.

---

### Idempotency (Fingerprinting)

Re-running ingest must not create duplicates.

**Fingerprint inputs:**

- `transaction_date` (YYYY-MM-DD)
- `amount_cents`
- `description_norm`
- `account_label` (if provided)

**Implementation:**

```
chase|2026-01-14|-12345|STARBUCKS|checking
```

Hash with SHA-256 → use as `id`

Primary key enforces dedupe. Conflicts are silently ignored.

---

### File Layout

```
nodes/personal/
  raw/
    finance/
      chase/          # drop CSVs here
  data/
    transactions.db   # SQLite database
```

- `raw/` and `data/` MUST be .gitignore'd
- Back up `transactions.db` periodically

---

### CLI

```bash
# Ingest CSVs
finance ingest <path>

# Optional flags
--dry-run           # parse only, no writes
--account-label     # tag with account name (e.g., "checking")
```

**Output:**

```
files: 1
rows read: 47
inserted: 42
skipped (duplicates): 5
date range: 2025-12-15 to 2026-01-14
```

No reports. No status. No dashboards. Just ingest.

---

### Tech Stack

- Node.js + TypeScript
- `better-sqlite3` (synchronous, simple)
- `csv-parse` (handles CSV edge cases)

---

### Acceptance Criteria

1. Drop a Chase CSV in `raw/finance/chase/`
2. Run `finance ingest`
3. Re-run ingest → no duplicates
4. Data is in SQLite, queryable

That's v1.

---

### Why This Is Not Wasted Effort

Even if you never build dashboards, never automate decisions, never do budgeting — you still gain:

- A longitudinal record
- The ability to ask new questions later
- A stable testbed for cybernetic ideas
- A concrete place to integrate future sensors

This is **infrastructure**, not product.

---

### Cadence

Every 2 weeks:

1. Export last 30 days from Chase (overlap is fine)
2. Drop in `raw/finance/chase/`
3. Run `finance ingest`

The ritual is the point.

---

---

## Future Vision

Everything below is hypothetical architecture for when the system asks for it.
Do not build any of this until reality demands it.

---

### Multi-Domain Observation Infrastructure

When you need multiple sensors (health, calendar, code), the architecture could evolve to:

```
nodes/personal/
  data/
    observations.sqlite     # shared observation log
      observations          # append-only, type-tagged
      finance_transactions  # projection
      health_sleep_sessions # projection
```

Each sensor writes typed observations. Each domain has its own projection.

---

### Component Interfaces

If modularity is needed, define explicit interfaces:

```typescript
interface Observation {
  id: string;
  type: string; // "finance.transaction", "health.sleep_session"
  timestamp: string;
  source: string;
  schema_version: number;
  payload: Record<string, unknown>;
  ingested_at?: string;
}

interface Sensor<TInput> {
  source: string;
  observationType: string;
  parse(input: TInput, options?: SensorOptions): SensorResult;
}

interface MemoryStore {
  appendObservations(observations: Observation[]): AppendResult;
  queryObservations(filter: ObservationFilter): Observation[];
  getLastTimestamp(type: string): string | null;
  getCounts(): Record<string, number>;
}

interface Projector {
  observationType: string;
  project(observations: Observation[], store: ProjectionStore): ProjectResult;
}

interface Reporter<TOptions, TOutput> {
  name: string;
  run(store: ProjectionStore, options: TOptions): TOutput;
}

interface StatusProvider {
  getStatus(store: MemoryStore, type?: string): StatusResult;
}
```

This enables:

- Swap ChaseCSV for Plaid
- Swap SQLite for Postgres
- Add health, calendar, code sensors
- All domains compose the same way

---

### Reports (When Needed)

```bash
finance report monthly [--last N]
finance report merchants [--month YYYY-MM] [--limit K]
```

Only build when you actually want to see this data.

---

### Status & Staleness (When Needed)

```bash
finance status
```

Output:

```
status: OK | WARN | STALE
last_transaction: 2026-01-14
days_stale: 3
total_transactions: 1,247
```

Thresholds:

- OK: ≤ 14 days
- WARN: 15–30 days
- STALE: > 30 days

Only build when you want the system to tell you it's degraded.

---

### Per-Node Architecture (When Needed)

If you have multiple nodes (personal, org), each gets its own observation store:

```
nodes/personal/data/observations.sqlite
nodes/org/data/observations.sqlite
```

CLI uses `--node` flag:

```bash
finance ingest --node personal <path>
finance status --node personal
```

Only build when you actually have multiple nodes that need separate memory.

---

### Becoming Engine Integration (When Needed)

Observations could eventually feed Variables:

1. Finance observations → `financial_health` Variable
2. Staleness → affects Variable confidence
3. Cross-domain aggregation → compound Variables

Only build when the regulatory layer is ready to consume this data.

---

### Project Structure (If Modular)

```
tools/
  sensor/                    # shared infrastructure
    src/
      interfaces/
      storage/
      status/
      utils/

  finance/                   # finance-specific
    src/
      cli.ts
      sensors/chase-csv.ts
      projectors/transactions.ts
      reporters/
```

Only split when a second domain exists.

---

This future vision is preserved for reference. Build the memory organ first. Let reality tell you what comes next.
