# Finance — Working Notes

This document contains the full specification and implementation notes for the Finance tool.

---

## Specification: Local-First Finance Sensor

Chase CSV → Observations → Ledger → Reports

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

| Component | Role |
|-----------|------|
| Environment | Real-world financial activity |
| Upstream transducer | Chase's ledger representation |
| Sensor interface | CSV ingest adapter |
| Memory | Local event log + projections |
| Observer | Analytics queries (reports) |
| Health monitoring | Data staleness (sensor liveness) |

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

### 4. Data Contracts

#### 4.1 Observation (Canonical Cross-Domain Event)

| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT, primary key | Deterministic fingerprint for idempotency |
| `type` | TEXT | e.g. "finance.transaction" |
| `timestamp` | TEXT ISO-8601 | Prefer posted date; fallback transaction date |
| `source` | TEXT | e.g. "chase_csv" |
| `schema_version` | INTEGER | Default 1 |
| `payload_json` | TEXT JSON | Domain-specific payload, minimally normalized |
| `ingested_at` | TEXT ISO-8601 | When this observation was stored |

#### Observation Type: `finance.transaction` Payload (v1)

| Field | Type | Description |
|-------|------|-------------|
| `transaction_date` | YYYY-MM-DD | Date of transaction |
| `posted_date` | YYYY-MM-DD \| null | Date posted (if available) |
| `amount` | number | Decimal dollars (human friendly) |
| `currency` | string | Default "USD" |
| `description_raw` | string | Original description from CSV |
| `description_norm` | string | Normalized merchant-ish string |
| `account_label` | string \| null | Optional account identifier |
| `source_row` | object | Original row fields for audit/debug |

#### Amount Policy

Store `amount_cents` as integer in projection, and store both:
- **payload**: `amount` as decimal dollars (human friendly)
- **projection**: `amount_cents` integer for precision

Sign convention:
- Debit (money out) is **negative**
- Credit (money in) is **positive**

#### 4.2 Projection: Finance Transactions (Query-Optimized)

**Table: `finance_transactions`**

| Column | Type | Description |
|--------|------|-------------|
| `txn_id` | TEXT, primary key | Same as Observation id for traceability |
| `observation_id` | TEXT, unique, FK | References observations.id |
| `transaction_date` | TEXT YYYY-MM-DD | |
| `posted_date` | TEXT YYYY-MM-DD, nullable | |
| `amount_cents` | INTEGER | Signed cents |
| `currency` | TEXT | Default USD |
| `description_raw` | TEXT | |
| `description_norm` | TEXT | |
| `merchant` | TEXT | Optional alias of description_norm |
| `category` | TEXT, nullable | Manual categorization (future) |
| `is_pending` | INTEGER 0/1 | Default 0 |
| `superseded_by` | TEXT, nullable | For pending→posted merge |
| `ingested_at` | TEXT datetime | |

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

**Command name:** `finance`

#### 7.1 `finance ingest <path>`

Ingest one file or all CSVs in a folder.

**Inputs**
- `<path>` file or directory
- Flags:
  - `--dry-run` (no writes, just parse + show counts)
  - `--move-processed` (move ingested files to processed/)
  - `--account-label "<label>"` (tag imports)

**Behavior**
1. Discover files (if dir: all *.csv)
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

#### 7.2 `finance report monthly [--last N]`

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

#### 7.3 `finance report merchants [--month YYYY-MM] [--last-days N] [--limit K]`

Outputs merchant rollups.

**Modes**
- All time (default)
- By month
- By last N days

**Output columns**
- merchant/description_norm
- spend (sum)
- txn_count

#### 7.4 `finance status`

Computes health + staleness.

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
2. Drop into raw folder
3. `finance ingest finance/raw/chase/`
4. `finance status` shows OK

**System-level reinforcement**
- `finance status` is the primary feedback signal
- Calendar/task reminder is a secondary prompt

---

### 9. File/Folder Conventions

Default local layout:

```
/finance
  /raw/chase/           # user drops exports here
  /processed/chase/     # optional, if move-processed enabled
  /db/finance.sqlite
  /reports/             # optional output dumps
```

- `raw/` and `db/` MUST be .gitignore'd
- If you use cloud backup/sync, consider encrypting `raw/` and `db/`

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

| Milestone | Scope |
|-----------|-------|
| M0: Skeleton | SQLite schema, CLI scaffold with commands (ingest/status/report) |
| M1: Chase CSV ingest working | Parse one known Chase CSV format, deterministic fingerprint, idempotent ingest |
| M2: Reports | Monthly report, merchant report |
| M3: Status + staleness | Implement thresholds, print actionable message when stale |
| M4: Hardening | Handle 1–2 Chase CSV header variants, tests + fixtures |

---

### 15. Acceptance Criteria (v1)

1. You can export a Chase CSV, drop it in `raw/chase/`, and run:
   ```
   finance ingest finance/raw/chase/
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

```
tools/
  finance/
    package.json
    tsconfig.json
    src/
      cli.ts              # entry point
      sensors/
        chase-csv.ts      # ChaseCSVAdapter
      storage/
        sqlite.ts         # SQLiteMemoryStore
        schema.sql
      reports/
        monthly.ts
        merchants.ts
      status.ts
    tests/
      fixtures/
        chase-sample.csv
```

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

The `db/finance.sqlite` file is the source of truth. Backup options:

1. **Manual**: Copy `finance.sqlite` to a backup location periodically
2. **Automated**: Script that copies on each ingest (before or after)
3. **Cloud sync**: If using Dropbox/iCloud, ensure the db folder is included but consider encryption for sensitive data

Document chosen approach in the tool's README.
