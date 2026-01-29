# Memory

The observation memory layer. Stores, queries, deduplicates, and computes identity.

## What It Is

Memory is the storage substrate for all observations. It handles persistence, deduplication, and querying. Sensors perceive and transform; Memory remembers.

This separation is intentional. Sensing is about perception—converting external data into observations. Memory is about storage—keeping those observations durable and queryable. Different concerns, different packages.

## What Lives Here

- **Observation type** — the universal structure for all sensed data
- **ObservationIdentity** — declaration of what makes an observation unique
- **Fingerprinting** — deterministic identity computation from declared fields
- **ObservationStore** — SQLite-backed memory with idempotent writes
- **Ingest runs** — audit trail for every data import

## Identity and Fingerprinting

Sensors declare *what* makes an observation unique. Memory computes *how* to identify it.

```typescript
// Sensor declares identity fields
const observation = {
  identity: {
    values: [observed_at, amount_cents, description_norm, account_label]
  },
  domain: "finance",
  source: "chase_csv",
  type: "transaction",
  // ... rest of observation
};

// Memory computes fingerprint: SHA-256(domain|source|type|value1|value2|...)
store.insertObservations([observation]); // id computed automatically
```

This separation keeps domain knowledge in sensors (which fields matter) and mechanical computation in memory (how to hash them). Sensors never call fingerprint functions directly.

## Why Separate From Sensor

The sensor package focuses purely on sensing:
- Sensor registration and discovery
- Ingest context and results
- Node sensor configuration

Memory handles everything about storage:
- Where observations live
- How they're identified (fingerprinting)
- How they're deduplicated
- How they're queried

This makes the dependency graph cleaner. Memory is independent. Sensor depends on Memory. Domain sensors depend on both.

## Technical Details

See the code for API reference and schema details.
