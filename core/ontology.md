---
id: ontology
---

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

## Sensor

A perception organ that converts external data into observations.

Sensors implement the first stage of the cybernetic loop: sensing. They take raw input (CSV files, API responses, manual entries) and transform it into domain-agnostic observations that can be stored, queried, and learned from.

Sensors are shared infrastructure — any node can use any sensor. The node determines where observations land; the sensor determines how they're produced.

| Relationship | Description |
|--------------|-------------|
| Sensor → Observation | Sensors produce observations |
| Node → Observation | Nodes store observations |
| Sensor ← Node | Nodes choose which sensors to use |

Current sensors:
- **finance** — parses bank statements (Chase CSV) into transaction observations

Sensors answer: *how does the system perceive?*

---

## Entity

A thing with persistent identity that is owned or managed.

Entities persist over time and need to be tracked — domains, accounts, contracts, etc. Unlike observations, entities can be updated.

Each node maintains its own entities (e.g., `org/entities/`, `personal/entities/`).

Entities answer: *what exists?*

---

## Artifact

A durable output that persists independently of the process that created it.

Artifacts leave traces in the world. They can be referenced, shared, or encountered without requiring access to the context or person that produced them. The artifact persists; the maker may not.

Unlike observations (which record what happened) or entities (which track what exists), artifacts are things that were made.

Each node maintains its own artifacts with its own conventions (e.g., `org/artifacts/`, `personal/artifacts/`).

Artifacts answer: *what was produced?*

---

## Page

A durable, referenceable artistic object that represents a coherent unit of meaning.

A Page is not identical to its files, layout, or media assets—it is an abstract work that appears through them and points beyond any single rendering. Pages are encountered through rendered surfaces (text, audio, image, video, or interactive elements), may evolve over time, and retain identity across revisions and instantiations.

Songs, essays, visual works, and applications are all genres of Pages. A Song and a Page live on the same ontological layer—both are abstract works whose digital instantiation consists of rendered media assembled on a surface. Calling a Song a genre of Page is not a reduction, but a recognition of shared structure.

A Page exists to make meaning legible, preserve memory, and allow engagement without requiring access to the processes or people that produced it.

Pages are compositional. A Page may embed other Pages, creating hierarchies of encounter (an album Page containing track Pages, a collection Page containing essay Pages). Each level is itself a coherent unit of meaning.

The relationship between Artifact and Page:

- **Artifact** is a retention concept — what the system preserves
- **Page** is an encounter concept — how preserved things are met

Every Page is an Artifact. Not every Artifact must be surfaced as a Page immediately, but anything meant to be encountered as a work becomes one.

Pages answer: *how is the work encountered?*

---

## Node

A bounded context within the system.

Currently:
- **Org** — the organization and its artifacts
- **Personal** — private life and data

Each node has its own entities, models, and observations.

---

## Model

A provisional belief that guides action.

Models represent what a node is acting *as if* is true. They compress reality into something actionable. Models are not claims of truth - they are useful assumptions that shape behavior until feedback demands revision.

This is a core cybernetic concept: systems regulate themselves through feedback, but they need internal models to interpret feedback and decide how to act.

| Field | Description |
|-------|-------------|
| status | `assumption` (untested), `emerging` (being validated), `learned` (confirmed by feedback) |
| why | The reason this model is being used |
| revision_signal | What would cause this model to be reconsidered |
| created | When the model was established |
| updated | When the model was last revised |

Models fall into two broad categories:

- **Operational models** — how the node works (processes, protocols, tone)
- **Strategic models** — what the node believes will work (hypotheses, bets)

Operational models are revised when processes fail. Strategic models are revised when reality disproves them.

Each node maintains its own models (e.g., `org/process/models.md`, `personal/process/models.md`).

Models answer: *what does the system believe?*

---

*Add new primitives here as they emerge.*
