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
category: core | essay | aesthetic | song | story | app | reference
order: 1  # display order within category (optional)

# Identity (optional)
id: "core/beauty-redeems"  # stable ID for wiki-links; overrides path-derived ID

# Connections
parent: null  # artifact this extends or serves
relates_to: ["the-living-system", "axioms"]  # sibling connections
story_fragment: "04-meeting-the-mentor"  # narrative counterpart (for album stages)

# Metadata
created: 2025-03-15
updated: 2026-01-10

# For apps with implementations in the artifact
implementation: impl/
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
| id | string | Stable ID for wiki-links; overrides the path-derived ID |
| parent | string | Slug of parent artifact (for hierarchy) |
| relates_to | array | Slugs of related artifacts (for graph edges) |
| story_fragment | string | Slug of corresponding story fragment (for album stages) |
| created | date | When artifact was created |
| updated | date | Last significant update |
| implementation | path | For artifacts with code (typically `impl/`) |

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
| story | Personal mythos and fictionalized narrative |
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
2. **Expressions app** — instead of maintaining a hardcoded artifact list in the app's `src/data/artifacts.ts`, the app could fetch and parse frontmatter directly from the source markdown

This makes frontmatter the single source of truth for artifact metadata, avoiding duplication between nodes and apps.

---

## ID System

Wiki-links use IDs to reference files without relying on relative paths.

**Default ID derivation:**
- Artifacts: `{category}/{slug}` (e.g., `core/beauty-redeems` for `artifacts/core/beauty-redeems/about.md`)
- Non-artifacts in nodes/org: path from `nodes/org/` (e.g., `process/models` for `nodes/org/process/models.md`)
- Root files: filename without `.md` (e.g., `ontology` for `ontology.md`)

**When to use the `id:` field:**
- When moving a file but keeping existing links stable
- When the derived ID would be awkward or confusing
- For category-level index files that need a simpler ID

Example: If `core/1-beauty-redeems` moves to `essays/beauty-redeems`, add `id: "core/1-beauty-redeems"` to preserve existing links.

---

## Notes

- Slugs use kebab-case derived from folder names
- The `relates_to` field creates edges in the visualization graph
- The `story_fragment` field links album stages to their narrative counterparts in `story/stages/`
- Not all artifacts need all fields — start minimal, add as needed
- This schema is descriptive, not enforced
