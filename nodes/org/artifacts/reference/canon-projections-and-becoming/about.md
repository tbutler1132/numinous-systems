# Canon, Projections, and Becoming

## Artifact Concept

This folder contains **Canon, Projections, and Becoming** — an architectural philosophy for how this repository relates to truth, views, and change. It provides a meta-framework for understanding what the repo *is* and how other systems relate to it.

## What This Artifact IS

- A clarification of what "canonical" means within a node
- A vocabulary for distinguishing truth (canon) from views (projections) from transformation (editors)
- An articulation of boundaries: what counts, what proposes, what decides
- A reference for questions like "where does this belong?" and "what has authority?"

## What This Artifact Is NOT

- A specification to implement
- A requirement for any particular tooling
- A claim about metaphysical truth
- A federation protocol (though it gestures toward one)

## Key Concepts Worth Referencing

**Canon:**
- The repository is the authoritative map of the node's reality
- Reality can contradict the system; within the system, the canon decides
- If something isn't encoded, it doesn't count

**Encoded vs. Conceptual Ontology:**
- Conceptual ontology lives in conversation, notes, and intent
- Encoded ontology lives in files and is what the system actually knows
- Only the encoded ontology exists for the system

**Projections:**
- Projections are views of the canon, not separate truths
- Readable projections explain (docs, rendered content)
- Operational projections execute (apps, tools)
- Both derive from the same source

**Editors:**
- Code may propose changes to the canon
- Running code is never truth — only the result of applying changes is
- Safe write surfaces are narrow by design

**Observations (infra-canonical):**
- Observations are the raw substrate from which models and artifacts are derived
- They accumulate indefinitely as system memory
- They are not artifacts themselves, but necessary infrastructure for learning

## Connection to Broader Project

- **Ontology.md**: defines the primitives that populate the canon
- **XenoScript**: explicitly implements projections with declared lossiness
- **Sensors**: embody the "editor" pattern — they propose observations, they don't decide truth
- **Expressions**: a readable projection that personalizes artifact content

## Status

This artifact is **stable as reference**. It articulates operating assumptions that are unlikely to change fundamentally, though vocabulary may evolve.
