# @numinous-systems/finance

Finance sensor — converts Chase bank CSVs into normalized observations.

## Philosophy

This is a **memory organ**, not a finance app. It doesn't:

- Produce scores
- Trigger alerts
- Recommend actions
- Enforce goals
- Tell you what's good or bad

It observes. That's it. Analysis and regulation are downstream concerns.

## Installation

```bash
# From workspace root
npm install
npm run build
```

## The Ritual

1. Download CSV from Chase (Activity → Download)
2. Drop it in `nodes/personal/raw/finance/chase/`
3. Run: `npx finance ingest nodes/personal/raw/finance/chase/`
4. Done

That's the habit you're installing.

## CLI Usage

```bash
finance ingest <path> [options]
```

### Options

| Flag                      | Default    | Description                        |
| ------------------------- | ---------- | ---------------------------------- |
| `--node <name>`           | `personal` | Which node's observation store     |
| `--dry-run`               | false      | Parse only, no writes              |
| `--account-label <label>` | `checking` | Tag transactions with account name |

### Examples

```bash
# Ingest from default location
npx finance ingest nodes/personal/raw/finance/chase/

# Explicit node: Will store data in that node
npx finance ingest --node personal nodes/personal/raw/finance/chase/

# Different account
npx finance ingest --account-label savings statement.csv

# Preview without writing
npx finance ingest --dry-run nodes/personal/raw/finance/chase/
```

### Output

```
files: 1
rows read: 47
inserted: 42
skipped (duplicates): 5
date range: 2025-12-15 to 2026-01-14
run logged: ingest_runs.run_id = abc123...
```

If a collision is detected (same fingerprint, different raw data):

```
warning: possible duplicate suppressed (same fingerprint, different raw data) at statement.csv:23
```

## Normalization Rules

### Dates

- Parsed to ISO `YYYY-MM-DD`
- Prefers `Post Date`; falls back to `Transaction Date`

### Amounts

- Converted to signed integer cents
- Debit (money out) = negative
- Credit (money in) = positive

### Descriptions

Conservative normalization to avoid false merges:

- Uppercase
- Trim whitespace
- Collapse repeated spaces
- Remove card suffixes (`*1234`, `#1234`)
- Remove POS prefixes

Numbers are **preserved** — they might be store IDs that disambiguate.

## Idempotency

Re-running ingest won't create duplicates. Each transaction gets a deterministic fingerprint from:

- Domain (`finance`)
- Source (`chase_csv`)
- Type (`transaction`)
- `observed_at` (post date)
- `amount_cents`
- `description_norm`
- `account_label`

Primary key enforces uniqueness.

### Collision Detection

The semantic fingerprint can collide (two identical Starbucks charges). To detect this:

- Raw CSV fields are hashed separately (`source_row_hash`)
- On conflict: if hashes differ, a warning is logged
- Ingestion proceeds, but you have an audit trail

## Payload Schema

Each transaction is stored with this payload:

```json
{
  "amount_cents": -1250,
  "description_raw": "STARBUCKS STORE 12345",
  "description_norm": "STARBUCKS STORE 12345",
  "account_label": "checking",
  "posted_at": "2026-01-14",
  "transaction_at": "2026-01-13",
  "source_row_hash": "a1b2c3..."
}
```

Both raw and normalized descriptions are preserved. No information is lost.

## File Layout

```
nodes/personal/
  data/
    observations.db     # SQLite database (gitignored)
  raw/
    finance/
      chase/            # Drop CSVs here (gitignored)
```

**Important:** Back up `observations.db` periodically. Encrypt backups at rest.

## Supported CSV Formats

### Chase Credit Card

```csv
Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,STARBUCKS STORE 12345,Food & Drink,Sale,-12.50,
```

### Chase Checking

```csv
Transaction Date,Posting Date,Description,Amount,Type,Balance,Check or Slip #
01/10/2026,01/11/2026,STARBUCKS,-12.50,DEBIT,1234.56,
```

Both formats are auto-detected based on column headers.

## Testing

```bash
npm test
```

Tests cover:

- CSV parsing
- Date normalization
- Amount conversion
- Description normalization
- Fingerprint generation
- Collision detection

## Cadence

Every 2 weeks:

1. Export last 30 days from Chase (overlap is fine)
2. Drop in `raw/finance/chase/`
3. Run `finance ingest`

The ritual is the point.

## Querying Data

The database is standard SQLite. Query directly:

```bash
sqlite3 nodes/personal/data/observations.db
```

```sql
-- Recent transactions
SELECT observed_at, json_extract(payload, '$.amount_cents') / 100.0 as amount,
       json_extract(payload, '$.description_norm') as description
FROM observations
WHERE domain = 'finance'
ORDER BY observed_at DESC
LIMIT 20;

-- Monthly totals
SELECT substr(observed_at, 1, 7) as month,
       SUM(json_extract(payload, '$.amount_cents')) / 100.0 as total
FROM observations
WHERE domain = 'finance'
GROUP BY month
ORDER BY month DESC;

-- Ingest history
SELECT run_id, started_at, rows_inserted, rows_skipped, status
FROM ingest_runs
ORDER BY started_at DESC;
```

## Future Sensors

This is the first sensor. The same observation protocol works for:

- Health (Oura, Apple Health)
- Time (calendar, RescueTime)
- Mood (manual entries)
- Code (git activity)

Zero schema changes required.
