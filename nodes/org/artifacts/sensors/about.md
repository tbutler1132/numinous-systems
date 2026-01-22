---
title: Sensors
status: draft
category: reference
relates_to:
  - observation-over-analysis
  - normalization
  - deduplication
  - fingerprinting
  - finance
  - thought
  - calendar
  - core
  - apps
  - reference
created: 2026-01-17
updated: 2026-01-17
---

# Sensors

## Category Concept

This folder contains **domain-specific sensors** — software that observes, remembers, and organizes information without analyzing or deciding.

Sensors are memory organs. They ingest raw data from various domains (finance, thought, calendar), normalize it into consistent form, and store it for later retrieval. They do not interpret, recommend, or act.

## What This Category Addresses

- How does a system maintain memory across time and context?
- What is the relationship between raw observation and structured knowledge?
- How do you build memory that serves reflection rather than optimization?
- What minimal processing preserves signal while enabling retrieval?

## Design Principles

Sensors here share certain commitments:

- **Observation over analysis** — sensors watch and remember, they don't conclude
- **Human-in-the-loop** — classification and meaning come from human judgment, not automation
- **Normalization** — raw inputs become consistent, queryable form
- **Deduplication** — the same event is not recorded twice
- **Fingerprinting** — each observation has a stable identity

## Current Sensors

| Sensor       | Domain                                              |
| ------------ | --------------------------------------------------- |
| **Finance**  | Bank transactions — ingest CSVs, normalize, dedupe  |
| **Thought**  | Inbox capture — bridge fuzzy notes to observations  |
| **Calendar** | Time allocation — sync events into memory           |

## Connection to Other Categories

- **Core** (The Living System) establishes why memory matters for hybrid beings
- **Apps** may surface sensor data for reflection
- **Reference** (Becoming Engine) provides guardrails for sensor design

## Implementation

Sensors have concept folders here but implementations in `sensors/` at the project root. The artifact describes what and why; the code lives where code belongs.

## Status

Finance and Thought are implemented. Calendar is specified. The sensor architecture continues to evolve.
