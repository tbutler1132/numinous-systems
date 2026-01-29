# Sensor Core

The shared infrastructure for sensing. The contract that makes perception uniform.

## What It Is

This package provides the registration and discovery system for sensors. It defines what a sensor is, how sensors are registered, and how nodes declare which sensors they use.

Sensors perceive. Memory stores. This package bridges them.

## Why It Exists

Without shared infrastructure, each sensor would be an island. Discovery would be ad-hoc. Node configuration would be inconsistent.

This package provides the contract. Every sensor registers itself. Every node declares its sensors. The system knows what perception is available.

## What Lives Here

- **Sensor type** — the interface all sensors implement
- **SensorDescriptor** — metadata for sensor discovery
- **Registry** — sensor registration and lookup
- **IngestContext/IngestResult** — standard interface for ingestion
- **Node sensor config** — how nodes declare which sensors they use

## Relationship to Memory

Memory (the separate `@numinous-systems/memory` package) handles:
- Observation types and identity
- Fingerprint computation
- Storage and deduplication
- Query interface

This package re-exports Memory types for convenience, but new code should import directly from `@numinous-systems/memory`.

## Technical Details

See [README.md](README.md) for installation, API reference, and how to build new sensors.
