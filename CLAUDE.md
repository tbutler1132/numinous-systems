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
apps/            # Operational projections: landing/, expressions/, projection/
nodes/org/       # Knowledge base and artifacts
```

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

## Philosophy (abbreviated)

Four commitments drive the work:
1. **Beauty redeems** - the orienting purpose
2. **Living systems** - respect human organism, not optimization engine
3. **Love of fate** - presence requires closing the question of regret
4. **Capital as medium** - resources are materials to shape, not corruptions

This is not productivity culture or optimization. It's notes from someone figuring out how to live.
