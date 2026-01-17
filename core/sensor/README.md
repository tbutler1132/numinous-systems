# @vital-systems/sensor

Domain-agnostic observation memory infrastructure. A foundation for building sensors that convert external data into normalized, append-only observations.

## Philosophy

This is a **memory organ**, not an analytics platform. It implements the first two stages of cybernetic system maturity:

1. **Sensing** — converting raw external data into observations
2. **Memory** — storing observations in a durable, queryable format

Pattern recognition, inference, and regulation come later. This package provides the substrate.

## Installation

```bash
npm install
npm run build
```

## Core Concepts

### Observations

An observation is a timestamped record of something that happened. All domains (finance, health, time, mood) use the same structure:

```typescript
interface Observation {
  id: string;           // Deterministic fingerprint (SHA-256)
  observed_at: string;  // When it happened (ISO-8601)
  domain: string;       // 'finance', 'health', 'time', etc.
  source: string;       // 'chase_csv', 'oura_api', 'manual'
  type: string;         // 'transaction', 'sleep_session', etc.
  schema_version: number;
  payload: Record<string, unknown>;  // Domain-specific data
  ingested_at: string;  // When stored
}
```

### Fingerprinting

Observations have deterministic IDs computed from their semantic content. This enables:

- **Idempotent ingestion** — re-running ingest doesn't create duplicates
- **Collision detection** — same fingerprint + different source data = warning

```typescript
import { fingerprint, sourceRowHash } from "@vital-systems/sensor";

// Generic fingerprint from any fields
const id = fingerprint(["domain", "source", "type", "field1", 123]);

// Source row hash for collision detection
const rawHash = sourceRowHash(["raw", "csv", "fields"]);
```

Each domain defines its own fingerprint function using the generic `fingerprint()`. See `@vital-systems/finance` for an example.

### ObservationStore

SQLite-backed storage with automatic schema initialization:

```typescript
import { ObservationStore, resolveDbPath } from "@vital-systems/sensor";

// Create/open a store
const dbPath = resolveDbPath("/path/to/workspace", "personal");
const store = await ObservationStore.create(dbPath);

// Insert observations (idempotent)
const result = store.insertObservations(observations, {
  sourceRowHashes: hashMap,  // For collision detection
});
console.log(`Inserted: ${result.inserted}, Skipped: ${result.skipped}`);

// Query observations
const recent = store.queryObservations({
  domain: "finance",
  since: "2026-01-01",
  limit: 100,
});

// Audit trail
const runId = store.startIngestRun("/path/to/source", "finance");
// ... do work ...
store.finishIngestRun(runId, {
  rowsRead: 100,
  rowsInserted: 95,
  rowsSkipped: 5,
  minObserved: "2026-01-01",
  maxObserved: "2026-01-14",
  status: "success",
});

// Always close when done
store.close();
```

## Database Schema

Two tables, both domain-agnostic:

### observations

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Deterministic fingerprint |
| observed_at | TEXT | ISO-8601 timestamp |
| domain | TEXT | Domain namespace |
| source | TEXT | Data source identifier |
| type | TEXT | Observation type within domain |
| schema_version | INTEGER | Payload schema version |
| payload | TEXT | JSON blob |
| ingested_at | TEXT | When row was stored |

### ingest_runs

| Column | Type | Description |
|--------|------|-------------|
| run_id | TEXT PRIMARY KEY | UUID |
| started_at | TEXT | ISO-8601 timestamp |
| finished_at | TEXT | ISO-8601 timestamp |
| source_file | TEXT | Source path |
| domain | TEXT | Domain being ingested |
| rows_read | INTEGER | Total rows in source |
| rows_inserted | INTEGER | New observations |
| rows_skipped | INTEGER | Duplicates skipped |
| min_observed | TEXT | Earliest observation |
| max_observed | TEXT | Latest observation |
| status | TEXT | 'running', 'success', 'failed', 'partial' |

## File Layout

Data lives per-node, separate from code:

```
nodes/
  personal/
    data/
      observations.db    # SQLite database
    raw/
      finance/
        chase/           # CSV drops
      health/            # Future sensors
  org/
    data/
      observations.db    # Separate memory
```

## API Reference

### fingerprint(fields)

Generate SHA-256 hash from array of values.

### financeTransactionFingerprint(params)

Generate fingerprint for finance transactions per spec.

### sourceRowHash(rawFields)

Generate hash of raw source data for collision detection.

### ObservationStore.create(dbPath)

Async factory to create/open a store.

### store.insertObservations(observations, options?)

Insert observations with deduplication. Returns `{ inserted, skipped, warnings }`.

### store.queryObservations(filter?)

Query observations with optional filters: `domain`, `type`, `since`, `until`, `limit`.

### store.startIngestRun(sourceFile, domain)

Start an audit trail. Returns `runId`.

### store.finishIngestRun(runId, result)

Complete an audit trail with results.

### store.getCounts()

Get observation counts by domain.

### store.close()

Save and close the database.

### resolveDbPath(workspaceRoot, nodeName)

Resolve database path for a node.

## Testing

```bash
npm test
```

## Building a New Sensor

1. Parse your source format into `Observation[]`
2. Compute fingerprints using domain-specific fields
3. Compute source row hashes for collision detection
4. Use `ObservationStore` to persist

See `sensors/finance` for a complete example.
