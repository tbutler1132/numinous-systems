# Sensor Core

The observation memory layer. The substrate that makes sensing possible.

## What It Is

This is the shared infrastructure all sensors depend on: types, fingerprinting, and storage. Sensors convert external data into observations. This package defines what an observation is and how to remember it.

A memory organ, not an analytics platform. It implements the first two stages: sensing (converting raw data into observations) and memory (storing them durably). Pattern recognition and regulation come later.

## Why It Exists

Without shared infrastructure, each sensor would reinvent the wheel. The wheels would not fit together. Data would be inconsistent. Memory would be fragmented.

This package provides the contract. Every sensor follows it. The rest of the system trusts it.

## What Lives Here

- **Observation type** — the universal structure for all sensed data
- **Fingerprinting** — deterministic identity for deduplication
- **ObservationStore** — SQLite-backed memory with idempotent writes
- **Ingest runs** — audit trail for every data import

## Technical Details

See [README.md](README.md) for installation, API reference, database schema, and how to build new sensors.
