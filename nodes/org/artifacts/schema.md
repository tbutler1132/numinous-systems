# Artifact Frontmatter Schema

This documents the optional YAML frontmatter that artifacts can include for machine-readable metadata.

Frontmatter is not required. It exists to support visualization and navigation tools.

---

## Fields

```yaml
---
# Required for public artifacts
title: "Beauty Redeems"
status: published | draft | private

# Categorization
category: core | essay | aesthetic | song | app | reference
order: 1  # display order within category (optional)

# Connections
parent: null  # artifact this extends or serves
relates_to: ["the-living-system", "axioms"]  # sibling connections

# Metadata
created: 2025-03-15
updated: 2026-01-10

# For apps with implementations elsewhere
implementation: apps/expressions/
---
```

---

## Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| title | string | Display name (can differ from filename) |
| status | enum | `published` (public), `draft` (WIP), `private` (internal only) |
| category | enum | Grouping for navigation |
| order | number | Sort order within category (1 = first) |
| parent | string | Slug of parent artifact (for hierarchy) |
| relates_to | array | Slugs of related artifacts (for graph edges) |
| created | date | When artifact was created |
| updated | date | Last significant update |
| implementation | path | For artifacts with code elsewhere |

---

## Status Values

- **published** — ready to be seen, part of the public visualization
- **draft** — work in progress, may or may not be shown
- **private** — internal only, never visualized

---

## Categories

Current categories (add as needed):

| Category | Description |
|----------|-------------|
| core | Foundational philosophy (the 5 essays) |
| essay | Supporting arguments |
| aesthetic | Sensory vocabulary |
| song | Musical expressions |
| app | User-facing applications |
| reference | Frameworks for consultation |

---

## Example

```yaml
---
title: "Beauty Redeems"
status: published
category: core
order: 1
parent: null
relates_to: ["the-living-system", "love-of-fate", "capital-as-medium", "axioms"]
created: 2025-02-01
updated: 2025-11-20
---
```

---

## Consumers

This frontmatter can be consumed by:

1. **Visualization site** — parse all `about.md` files, build navigation and graph from frontmatter
2. **Expressions app** — instead of maintaining a hardcoded artifact list in `apps/expressions/src/data/artifacts.ts`, the app could fetch and parse frontmatter directly from the source markdown

This makes frontmatter the single source of truth for artifact metadata, avoiding duplication between nodes and apps.

---

## Notes

- Slugs use kebab-case derived from folder names
- The `relates_to` field creates edges in the visualization graph
- Not all artifacts need all fields — start minimal, add as needed
- This schema is descriptive, not enforced
