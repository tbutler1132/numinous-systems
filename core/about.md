# About Core

Core is the substrate—the shared foundation that makes the rest possible.

## Why Core Exists

Sensors need to store observations. Apps need to query them. Nodes need consistent structures. Without shared infrastructure, each piece would reinvent the wheel, and the wheels would not fit together.

Core provides the primitives that other parts depend on but should not have to think about.

## What Lives Here

Core contains domain-agnostic infrastructure:

- **dna/** — The genetic code. Invariants that do not change. `about.md` is the source of truth; `src/index.ts` is the code-level projection.
- **ontology.md** — Definitions of the system's fundamental concepts.
- **node/** — The boundary primitive. Types for nodes and node relationships.
- **identity/** — The access primitive. Types for identities, access levels, and grants.
- **memory/** — The observation memory layer. Types, fingerprinting, storage.
- **sensor/** — The sensor interface. Descriptor, ingest, and registry.
- **entities/** — Global entities shared across all nodes.

## The Principle

Core code is invisible when working well. It should feel like the system's natural capability, not an external dependency.

If something belongs in core, it is because:
- Multiple parts of the system need it
- It defines a contract others must follow
- Getting it wrong would ripple everywhere

If something does not meet these criteria, it belongs closer to where it is used.

## Stability

Core changes slowly and deliberately. The rest of the system trusts it.
