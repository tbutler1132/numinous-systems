# Finance Sensor — v1 Spec

> **"This tool converts bank CSVs into a normalized, append-only observation memory."**

---

## What This Is

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

## What This Is NOT

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

## The Ritual

A repeatable ritual + a data vessel.

1. Download CSV from Chase
2. Drop it in `nodes/personal/raw/finance/chase/`
3. Run: `finance ingest nodes/personal/raw/finance/chase/`
4. Done

That's the habit you're actually installing.

---

## The Schema

One table. Generic observations. Finance is just the first domain.

```sql
CREATE TABLE observations (
  id              TEXT PRIMARY KEY,       -- deterministic fingerprint
  observed_at     TEXT NOT NULL,          -- ISO-8601 (canonical time axis)
  domain          TEXT NOT NULL,          -- 'finance', 'health', 'time', etc.
  source          TEXT NOT NULL,          -- 'chase_csv', 'oura_api', 'manual'
  type            TEXT NOT NULL,          -- 'transaction', 'sleep_session', etc.
  schema_version  INTEGER NOT NULL DEFAULT 1,  -- payload schema version
  payload         TEXT NOT NULL CHECK (json_valid(payload)),  -- JSON blob
  ingested_at     TEXT NOT NULL           -- when this row was stored
);

CREATE INDEX idx_observed_at ON observations(observed_at);
CREATE INDEX idx_domain ON observations(domain);
CREATE INDEX idx_domain_type ON observations(domain, type);
```

A finance transaction is stored as:

```json
{
  "id": "sha256...",
  "observed_at": "2026-01-14",
  "domain": "finance",
  "source": "chase_csv",
  "type": "transaction",
  "schema_version": 1,
  "payload": {
    "amount_cents": -1250,
    "description_raw": "STARBUCKS STORE 12345",
    "description_norm": "STARBUCKS",
    "account_label": "checking",
    "posted_at": "2026-01-14",
    "transaction_at": "2026-01-13",
    "source_row_hash": "sha256..."
  },
  "ingested_at": "2026-01-15T10:30:00Z"
}
```

**Notes:**

- `schema_version` allows payload schema to evolve
- `CHECK (json_valid(payload))` enforces JSON at the database level
- `observed_at` is the canonical time axis (prefer `posted_at` for finance)
- `payload` preserves both `posted_at` and `transaction_at` so no information is lost
- `source_row_hash` is a hash of the raw CSV row for collision detection

This is your **observation protocol**. Finance is the first sensor. Health, time, mood can follow the same structure with zero schema changes.

---

## Normalization Rules

**Dates:**

- Parse to ISO YYYY-MM-DD
- Prefer posted_date; fall back to transaction_date

**Amount:**

- Convert to signed integer cents
- Debit (money out) = negative
- Credit (money in) = positive

**Description:**

- `description_raw` = unchanged from CSV (always keep this)
- `description_norm` = derived:
  - Uppercase
  - Trim whitespace
  - Collapse repeated spaces
  - Remove only **very specific patterns** you're confident are noise:
    - Card suffixes like `*1234` or `#1234`
    - Excessive spacing
    - Maybe "POS" prefixes (depends on Chase format)
  - **Do NOT remove numbers universally** — they might be store IDs that disambiguate

Keep normalization conservative. Over-normalization creates false merges. When in doubt, keep more of the original.

---

## Idempotency (Fingerprinting)

Re-running ingest must not create duplicates.

**Semantic fingerprint (id):**

- `domain` ('finance')
- `source` ('chase_csv')
- `type` ('transaction')
- `observed_at` (YYYY-MM-DD)
- `amount_cents`
- `description_norm`
- `account_label` (if provided)

```
finance|chase_csv|transaction|2026-01-14|-1250|STARBUCKS|checking
```

Hash with SHA-256 → use as `id`. Primary key enforces dedupe.

**Source row hash (collision detection):**

The semantic fingerprint can collide (two Starbucks charges, same day, same amount). To detect this:

- Also compute `source_row_hash` from raw fields (raw description, raw date, raw amount, check number if present)
- Store in payload
- On conflict: if `source_row_hash` differs, log a warning ("possible real duplicate suppressed")

This doesn't block ingest, but creates an audit trail for edge cases.

---

## Ingest Audit Log

Track every ingest run for self-audit:

```sql
CREATE TABLE ingest_runs (
  run_id        TEXT PRIMARY KEY,     -- UUID
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  source_file   TEXT NOT NULL,
  domain        TEXT NOT NULL,
  rows_read     INTEGER,
  rows_inserted INTEGER,
  rows_skipped  INTEGER,
  min_observed  TEXT,                 -- earliest observation in batch
  max_observed  TEXT,                 -- latest observation in batch
  status        TEXT NOT NULL         -- 'success', 'failed', 'partial'
);
```

This isn't a dashboard — it's system self-audit. You'll thank yourself when something breaks or a CSV format changes.

---

## File Layout

```
nodes/personal/
  raw/
    finance/
      chase/          # drop CSVs here
  data/
    observations.db   # SQLite database (all domains)
```

- `raw/` and `data/` MUST be .gitignore'd
- Back up `observations.db` periodically
- **Encrypt backups at rest** (even basic `age`/`gpg`) — transactions are sensitive

---

## CLI

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
run logged: ingest_runs.run_id = abc123...
```

If collision detected (same id, different source_row_hash):

```
warning: possible duplicate suppressed at row 23 (same fingerprint, different raw data)
```

No reports. No status. No dashboards. Just ingest + audit.

---

## Tech Stack

- Node.js + TypeScript
- `better-sqlite3` (synchronous, simple)
- `csv-parse` (handles CSV edge cases)

---

## Acceptance Criteria

1. Drop a Chase CSV in `raw/finance/chase/`
2. Run `finance ingest`
3. Re-run ingest → no duplicates
4. Data is in `observations` table with `domain='finance'`, `type='transaction'`
5. Payload contains normalized transaction data
6. Ingest run logged to `ingest_runs` table

That's v1.

---

## Why This Is Not Wasted Effort

Even if you never build dashboards, never automate decisions, never do budgeting — you still gain:

- A longitudinal record
- The ability to ask new questions later
- A stable testbed for cybernetic ideas
- **An observation protocol** that future sensors (health, time, mood) plug into with zero refactoring

This is **infrastructure**, not product.

> Normalization is not about making the data smart.
> It's about making the data compatible with the future.

---

## Cadence

Every 2 weeks:

1. Export last 30 days from Chase (overlap is fine)
2. Drop in `raw/finance/chase/`
3. Run `finance ingest`

The ritual is the point.
