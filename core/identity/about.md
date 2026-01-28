# Identity

The identity and access control layer. Who you are, what you can access.

## What It Is

This is the shared infrastructure for identity across the system: types for users, access levels, and grants. Apps are projections of the canon — this package defines how those projections know who's looking.

Identity is system-level, not per-app. A user authenticated to the system can access any projection that recognizes them. This is the foundation for eventual federation — your identity travels with you.

## Why It Exists

Without shared identity infrastructure, each app would implement its own auth. Users would have separate accounts everywhere. Access control would be inconsistent.

This package provides the contract. Every app follows it. The rest of the system trusts it.

## Relationship to Nodes

Identity depends on `core/node`. Every identity belongs to a node — it represents someone operating from within that node's boundary.

- An identity has a `nodeId` — which node it belongs to
- Grants flow from nodes to identities — a node grants an identity access to something

This means: "The org node grants this user access to the workshop surface."

## What Lives Here

- **Identity type** — who someone is, and which node they belong to
- **AccessLevel** — tiers of access (anonymous through collaborator)
- **Grant** — explicit permission from a node to an identity for a specific resource
- **AuthProvider interface** — contract for authentication implementations

## Access Model

Access works two ways:

1. **Level-based**: Your tier grants baseline access everywhere (supporters can access supporter-level surfaces)
2. **Grant-based**: Specific permissions for specific resources (you have access to this surface, specifically)

Levels are global standing. Grants are surgical exceptions. Both are valid.

## Technical Details

See the source files for type definitions and the AuthProvider interface.
