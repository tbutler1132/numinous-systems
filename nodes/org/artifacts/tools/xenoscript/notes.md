# XenoScript — Development Notes

## Design Principles

### From v0.2 (keep)
- Meaning precedes behavior
- Projections declare lossiness
- Provenance is descriptive, not moral
- Semantic diff over text diff

### New in v0.3
- Live objects, not static declarations
- REPL-first experience
- Drift is interactive (push back, not just report)
- History is semantic, not file-based

---

## Open Design Questions

### 1. Can convergences have behavior?

v0.2 said no — pure declaration, projections do the work.

But what if convergences could have **reactions**?

```xeno
convergence Task {
  focus: "..."
  on complete {
    parent.progress += 1
  }
}
```

This makes the language more powerful but blurs the "meaning vs behavior" line.

**Current stance**: Start pure. Add behavior if needed.

### 2. What's the execution model?

Options:
- **Immediate**: everything happens as you type
- **Staged**: declarations accumulate, then resolve
- **Lazy**: nothing happens until queried

Current design leans **immediate** (REPL-first). But projections might be lazy (only computed when requested).

### 3. How do you share semantic graphs?

- Export/import entire namespaces?
- Reference remote objects?
- Federated graphs?

```xeno
import "lucidness.core" as core

convergence MyWork {
  refines: core.Becoming
}
```

### 4. File format vs runtime format

Do `.xeno` files exist? Or is everything in the graph?

Options:
- Files are just serialized graph snapshots
- Files are source, graph is compiled
- No files, only persisted graphs

**Current stance**: Graphs are primary. Files are optional serialization.

### 5. Relation syntax

How do you express edges between objects?

```xeno
# Option A: explicit relation declarations
relation { from: A, to: B, type: depends_on }

# Option B: inline arrow syntax
A → B  # what type?

# Option C: typed arrows
A --depends_on--> B
A ==refines==> B

# Option D: property-based
A.depends_on = [B, C]
```

Current draft uses spawn (parent-child) as the main relation. Need to think about arbitrary edges.

---

## Implementation Notes

### Runtime

The core is a **semantic graph engine**:
- Nodes = convergences, constraints, relations
- Edges = spawned, depends_on, refines, etc.
- Every node has identity, history, provenance

### REPL

Primary interface. Features:
- Object creation/modification
- Queries (`?`, `?drift`, etc.)
- Projections (`→ task`, `→ graph`, etc.)
- History navigation (`@0`, `@1`, etc.)

### Persistence

Save/load entire graphs:
- Binary format for efficiency
- JSON for interop
- Maybe: append-only log for history

### Projectors

Pluggable renderers:
- `task` — actionable task list
- `graph` — visual node/edge diagram
- `reflection` — questions for thought
- `outline` — hierarchical text structure
- Custom projectors via host bindings

---

- [x] Immediate feedback (REPL)
- [ ] No separation between shell and language
- [x] Weird but coherent
- [ ] You can build real things
- [x] Personal vision
- [ ] Self-hosting (language defined in itself?)

XenoScript is about meaning, not hardware.

---

## Name Thoughts

"XenoScript" works because:
- "Xeno" = foreign/strange (it's weird)
- "Script" = you write it (it's a language)

Alternative names considered:
- IntentLang (too literal)
- SemanticScript (too academic)
- Drift (cool but unclear)
- Converge (okay but generic)

Sticking with XenoScript for now.

---

## Next Steps

1. Finalize core syntax
2. Prototype REPL in TypeScript or Rust
3. Implement basic graph engine
4. Build 2-3 projectors (task, graph, reflection)
5. Use it to track this project (dogfooding)
