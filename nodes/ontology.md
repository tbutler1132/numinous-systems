# Ontology

This file describes the fundamental concepts of the system.

These are universal primitives — they apply regardless of which node (Org, Personal) is using them.

---

## Observation

A record of something that occurred.

Observations are the core data primitive. They are domain-agnostic, append-only, and immutable once recorded.

| Field | Description |
|-------|-------------|
| id | Deterministic fingerprint (SHA-256 of semantic fields) |
| observed_at | When the observation occurred |
| domain | Namespace: `finance`, `health`, `time`, `thought`, etc. |
| source | Data source: `chase_csv`, `oura_api`, `manual`, etc. |
| type | Type within domain: `transaction`, `sleep_session`, etc. |
| payload | Domain-specific data |
| ingested_at | When this observation entered the system |

Observations answer: *what happened?*

---

## Entity

A thing with persistent identity that is owned or managed.

Entities persist over time and need to be tracked — domains, accounts, contracts, etc. Unlike observations, entities can be updated.

Each node maintains its own entities (e.g., `org/entities/`, `personal/entities/`).

Entities answer: *what exists?*

---

## Node

A bounded context within the system.

Currently:
- **Org** — the organization and its artifacts
- **Personal** — private life and data

Each node has its own entities, models, and observations.

---

*Add new primitives here as they emerge.*
