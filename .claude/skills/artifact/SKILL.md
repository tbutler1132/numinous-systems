---
name: artifact
description: Navigate between code and concept layers. Find the artifact for code you're working on, or the implementation for an artifact.
---

# Artifact Navigation

This project has two documentation layers:
- **Code layer**: `xenoscript/`, `core/sensor/`, `sensors/`, `apps/` — implementation
- **Concept layer**: `nodes/org/artifacts/` — philosophy, purpose, design principles

## Your task

Help the user navigate between these layers.

## When invoked

1. **Determine context**: What file/folder is the user working in?

2. **Find the counterpart**:
   - If in code (e.g., `sensors/finance/`), find the artifact (`nodes/org/artifacts/sensors/finance/`)
   - If in artifact, find the implementation
   - Some artifacts have no code (core essays, aesthetic)
   - Some code has no artifact yet

3. **Show both about.md files** if they exist — the technical one and the conceptual one

4. **Summarize the relationship**: What does the concept doc say about intent? How does the code implement it?

## Mapping

| Code location | Artifact location |
|--------------|-------------------|
| `sensors/finance/` | `nodes/org/artifacts/sensors/finance/` |
| `sensors/thought/` | `nodes/org/artifacts/sensors/thought/` |
| `core/sensor/` | `nodes/org/artifacts/sensors/` (general) |
| `xenoscript/` | `nodes/org/artifacts/xenoscript/` |
| `apps/expressions/` | `nodes/org/artifacts/apps/expressions/` |
| `apps/projection/` | `nodes/org/artifacts/apps/projection/` |
| `apps/projection/src/app/page.tsx` | `nodes/org/artifacts/home/` |
| `apps/projection/src/app/sensors/` | `nodes/org/artifacts/apps/sensors-ui/` |

## Artifact folder structure

Every artifact folder follows this pattern:
- **about.md** — The concept (stable, abstract)
- **notes.md** — Working material (drafts, ideas, questions)
- **page.md** — The encounter (composed surface for engagement)
- **manifest.md** — Structure tracking (for artifacts with source files)

## If no counterpart exists

Tell the user. Ask if they want to create one. If creating an artifact, use the standard folder structure.
