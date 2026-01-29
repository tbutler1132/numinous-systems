# CLAUDE.md

This is a philosophical-technical system exploring what it means to organize life around beauty. Code here is a "projection" of ideas, not traditional software engineering.

## Key Concepts

- **Projections**: Apps, views, and code are different ways of encountering the same underlying meaning. They derive from the canon; they don't create truth.
- **Observations**: Sensors perceive external data (transactions, thoughts) and store them without judgment. Analysis comes later.
- **Nodes**: The knowledge base in `nodes/`. `nodes/org/` is shared; `nodes/personal/` is gitignored for private use.

## Structure

```
xenoscript/      # Semantic language (Deno) - meaning as primitive
core/sensor/     # Shared observation infrastructure (npm workspace)
sensors/         # Domain sensors: finance/, thought/ (npm workspaces)
apps/            # Operational projections: expressions/, projection/
nodes/org/       # Knowledge base and artifacts
```

## Two Documentation Layers

This repo has two parallel documentation systems:

1. **Technical docs** — `about.md` files in code folders (`xenoscript/`, `core/sensor/`, `sensors/`, `apps/`) explain implementation: what the code does, how to use it, technical details.

2. **Concept docs** — `nodes/org/artifacts/` contains the philosophy, essays, aesthetic, and meaning behind the work. These describe *what* and *why*; the code describes *how*.

**The split is intentional.** Concepts are stable; implementations change. The artifact for "Finance Sensor" in `nodes/org/artifacts/sensors/finance/` describes its purpose and design principles. The implementation in `sensors/finance/` is the working code. Both have their own `about.md`.

When working on code, check if there's a corresponding artifact in `nodes/org/artifacts/` for context on intent.

## Artifact Folder Structure

Every artifact in `nodes/org/artifacts/` follows a consistent pattern:

- **about.md** — The concept. What this artifact IS, its purpose, how it connects to the project. Stable and abstract.
- **notes.md** — Working material. Drafts, arguments, examples, open questions. Changes freely.
- **page.md** — The encounter. A composed surface for someone engaging the work (not all artifacts have this yet).
- **manifest.md** — Structure tracking. For artifacts with source material, records what exists in trunk/branches.

This separates concept (about.md) from content (notes.md) from encounter (page.md) from structure (manifest.md).

## Commands

**Node.js (root):**
```bash
npm run check        # lint + build + test all workspaces
npm run lint         # eslint core and sensors
npm run setup        # install + pull assets
```

**XenoScript (Deno):**
```bash
cd xenoscript
deno task dev        # run the REPL/runtime
deno task test       # run tests
deno task lint:xeno  # lint .xeno files
```

## XenoScript Basics

XenoScript treats meaning as the primitive. Files use `.xeno` extension.

```xeno
# Comments use hash
node Example {
  about: "what this node is"
  status: "in progress"
}
```

Key ideas:
- **Provenance**: Every node knows if it's organic (human) or synthetic (generated)
- **Semantic drift**: System detects meaning changes, not just text changes
- **Projections**: Same semantic graph viewed different ways (tree, list, questions)

XenoScript is experimental. Syntax may change.

## Verification

After any non-trivial change, run `npm run check` from the repo root. This lints, builds, and tests all workspaces. It runs in ~13 seconds — always run it, don't skip.

## Conventions

- Each major directory has an `about.md` explaining its purpose
- Core artifacts live in `nodes/org/artifacts/core/` (Beauty Redeems, Living System, etc.)
- Sensors follow a pattern: parse → fingerprint → store observations
- Apps are minimal - "a single gesture, made well"
- Structure is added only when needed; changes reflect use, not planning

## Core Philosophy

Five foundational essays in `nodes/org/artifacts/core/`. Reading order matters:

| # | Essay | Role |
|---|-------|------|
| 1 | **Beauty Redeems** | The telos — moments of beauty redeem existence |
| 2 | **The Living System** | The subject — hybrid beings, viable range, biology over optimization |
| 3 | **Love of Fate** | The posture — clearing regret to enable presence |
| 4 | **Capital as Medium** | The practice — orchestrating resources toward beauty at scale |
| 5 | **Axioms** | The distillation — what is affirmed without argument |

**Reading order: Purpose → Subject → Posture → Practice → Distillation**

How they connect:
- Everything serves **Beauty Redeems** (the telos)
- **The Living System** defines what must be preserved for someone to experience beauty
- **Love of Fate** clears regret so presence is possible
- **Capital as Medium** enables creation at scale
- **Axioms** distills it all into ground-level affirmations

Supporting artifacts branch from these: essays develop themes, practice provides operational frameworks, aesthetic defines the sensory vocabulary, songs are musical expressions, sensors observe and remember.

This is not productivity culture or optimization. It's notes from someone figuring out how to live.
