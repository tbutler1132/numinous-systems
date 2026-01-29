# Memory

The observation memory layer. Stores, queries, and deduplicates observations.

## What It Is

Memory is the storage substrate for all observations. It handles persistence, deduplication, and querying. Sensors perceive and transform; Memory remembers.

This separation is intentional. Sensing is about perception—converting external data into observations. Memory is about storage—keeping those observations durable and queryable. Different concerns, different packages.

## What Lives Here

- **Observation type** — the universal structure for all sensed data
- **Fingerprinting** — deterministic identity for deduplication
- **ObservationStore** — SQLite-backed memory with idempotent writes
- **Ingest runs** — audit trail for every data import

## Why Separate From Sensor

The sensor package now focuses purely on sensing:
- Sensor registration and discovery
- Ingest context and results
- Node sensor configuration

Memory handles everything about storage:
- Where observations live
- How they're deduplicated
- How they're queried

This makes the dependency graph cleaner. Memory is independent. Sensor depends on Memory. Domain sensors depend on both.

## Technical Details

See the code for API reference and schema details.
