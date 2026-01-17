# XenoScript v0.3 — A Language You Can Live In

## The Problem with v0.2

v0.2 is a specification for a format. You write `.xeno` files, then some external tool processes them. That's YAML with philosophy.

A cool language is something you **inhabit**. You type, things happen, you discover.

---

## Core Shift: From "Consulted" to "Inhabited"

v0.2 said: "XenoScript files are consulted, not executed."

v0.3 says: **XenoScript is a live environment where meaning and action coexist.**

You don't write files and run tools. You enter a space where declarations *are* actions.

---

## What Makes It Weird (Good Weird)

### 1. Convergences Are Alive

A `convergence` isn't just a declaration. It's a **live semantic object** that:
- Exists in the runtime
- Can be queried
- Can spawn other convergences
- Tracks its own history
- Knows its provenance

```xeno
convergence Becoming {
  focus: "make meaning persist"
  horizon: 3
}

> Becoming.focus
"make meaning persist"

> Becoming.spawn("Draft outline") 
convergence Draft_outline {
  focus: "Draft outline"
  horizon: 1
  parent: Becoming
  provenance: synthetic
}
```

The system remembers that `Draft_outline` came from `Becoming`. The graph builds itself as you work.

### 2. Projection Is a Verb, Not a Pipeline

You don't run `xeno project --as=task`. You **say** it:

```xeno
> Becoming → task

[task] Becoming (horizon 3)
  - no immediate actions
  - refine focus to generate vectors

> Becoming → graph

  [Becoming] ──spawned──▶ [Draft_outline]
                              │
                              └── horizon: 1, focus: "Draft outline"
```

Projections happen live. You see the artifact immediately.

### 3. The Oracle

XenoScript has a built-in way to ask questions about meaning:

```xeno
> ?Becoming

Becoming is a convergence at horizon 3.
It has spawned 1 child.
It has not drifted from its original focus.
Provenance: organic.

> ?drift Becoming

No telic drift detected.
1 structural change: spawned Draft_outline.
```

The `?` operator queries the semantic graph. This is how you check yourself.

### 4. Provenance Is Visible

Everything shows its weight:

```xeno
> ls

◉ Becoming          [organic, h3]
○ Draft_outline     [synthetic, h1]
```

`◉` = organic (human-costly)  
`○` = synthetic (generated)  
`◐` = hybrid

You always know what came from where.

### 5. Drift Is Felt, Not Reported

When you modify something in a way that changes intent, the system pushes back:

```xeno
> Becoming.focus = "ship fast"

⚠ telic drift detected
  "make meaning persist" → "ship fast"
  
  proceed? (y/n/explain)
```

You can override it. But you have to acknowledge the change.

### 6. Time Is Semantic

```xeno
> Becoming@0

convergence Becoming {
  focus: "make meaning persist"
  horizon: 3
}
[created 2026-01-13T14:22:00Z, organic]

> Becoming@1

convergence Becoming {
  focus: "make meaning persist"
  horizon: 3
  children: [Draft_outline]
}
[modified 2026-01-13T14:25:00Z, spawn]
```

History is part of identity. You can always go back to any semantic state.

---

## Syntax Personality

### Arrows Mean Transformation

```xeno
X → task       # project X as task
X → Y          # X flows into Y (relation)
X ← note       # attach note to X
```

### Blocks Are Semantic Scopes

```xeno
within Becoming {
  # everything here is implicitly related to Becoming
  convergence Outline { ... }
  convergence Draft { ... }
}
```

### Constraints Are Assertions

```xeno
assert Becoming.horizon >= 2
assert Becoming.focus contains "meaning"

# violations are caught live
> Becoming.horizon = 1
✗ assertion failed: Becoming.horizon >= 2
```

### Signals Are Read-Only Context

```xeno
signal now = 2026-01-13
signal author = "tim"

# signals can't be modified from inside XenoScript
# they come from the host environment
```

---

## The REPL Experience

You start XenoScript like this:

```bash
$ xeno
XenoScript v0.3
namespace: default
provenance: organic

>
```

Everything you type is live. Declarations create objects. Queries show state. Projections render views.

```xeno
> convergence Essay {
    focus: "reflect on expressions"
    horizon: 4
  }

created: Essay [organic, h4]

> Essay → task

[task] Essay (horizon 4)
  - too abstract for direct action
  - suggest: spawn horizon 3 refinements

> Essay.spawn("What is a work?")

created: What_is_a_work [synthetic, h3, parent: Essay]

> Essay → graph

  [Essay] ──spawned──▶ [What_is_a_work]
```

---

## What You Can Build

1. **Living documents** — essays that know their own structure and can be projected into different forms
2. **Intent-tracking systems** — software that remembers why decisions were made
3. **Drift-aware workflows** — task systems that notice when you're straying from purpose
4. **Semantic notebooks** — like Jupyter, but for meaning, not just code

---

## What Makes It Cool

| v0.2 (Format) | v0.3 (Language) |
|---------------|-----------------|
| Write files, run tools | Type and see |
| Projections are build steps | Projections are verbs |
| Drift is reported | Drift is felt |
| Provenance is metadata | Provenance is visible |
| Semantic graph is IR | Semantic graph is the world |
| Philosophy | Experience |

---

## Implementation Direction

1. **Core runtime** — a semantic graph engine that supports live objects
2. **REPL** — the primary interface
3. **Projectors** — pluggable renderers (task, graph, reflection, etc.)
4. **Persistence** — save/load semantic state (not files, graphs)
5. **Host bindings** — signals from external systems

The language is small. The runtime is the interesting part.

---

## Open Questions

1. **Can convergences have behavior?** Or are they purely declarative with projection doing the work?
2. **How do you handle parallelism?** Multiple convergences in flight?
3. **What's the module/namespace story?** How do you share semantic graphs?
4. **What's the relationship to files?** Can you read `.xeno` files into a live session?

---

## The Vibe

HolyC was weird because Terry built an entire OS to run it. The language and the world were inseparable.

XenoScript should feel like that: **a world where meaning is the primitive, not bytes.**

You don't write programs that manipulate data. You inhabit a semantic space where things exist because you declared them, and you navigate by asking questions and projecting views.

It's strange. It's personal. It's usable.

That's the goal.
