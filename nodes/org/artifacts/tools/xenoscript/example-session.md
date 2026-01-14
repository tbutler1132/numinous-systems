# XenoScript — Example Session

What it actually feels like to use.

---

```
$ xeno
XenoScript v0.3
namespace: vital-systems
provenance: organic

> 
```

## Starting a Project

```xeno
> convergence Expressions {
    focus: "communicate ideas through participation"
    horizon: 4
    context: ["AI generation", "reader engagement", "organic anchors"]
  }

◉ created: Expressions [organic, h4]

> Expressions

convergence Expressions {
  focus: "communicate ideas through participation"
  horizon: 4
  context: ["AI generation", "reader engagement", "organic anchors"]
  provenance: organic
  created: 2026-01-13T10:00:00Z
  children: []
}
```

## Breaking It Down

```xeno
> Expressions.spawn("Core essay")

○ created: Core_essay [synthetic, h3, ← Expressions]

> Expressions.spawn("App interface")

○ created: App_interface [synthetic, h3, ← Expressions]

> Expressions.spawn("Generation API")

○ created: Generation_API [synthetic, h3, ← Expressions]

> Expressions → graph

          ┌─────────────────┐
          │   Expressions   │
          │   [organic, h4] │
          └────────┬────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │Core_essay│ │App_iface│ │Gen_API  │
  │[syn, h3] │ │[syn, h3]│ │[syn, h3]│
  └─────────┘ └─────────┘ └─────────┘
```

## Refining Focus

```xeno
> Core_essay.focus = "explain the organic touchpoint"

○ updated: Core_essay.focus

> Core_essay.spawn("Level 1: Speed")
> Core_essay.spawn("Level 2: Participation") 
> Core_essay.spawn("Level 3: Anchoring")

○ created: Level_1_Speed [synthetic, h2, ← Core_essay]
○ created: Level_2_Participation [synthetic, h2, ← Core_essay]
○ created: Level_3_Anchoring [synthetic, h2, ← Core_essay]
```

## Checking Yourself

```xeno
> ?Expressions

Expressions is a convergence at horizon 4.
Focus: "communicate ideas through participation"
Provenance: organic

It has spawned 3 children (all synthetic).
Total descendants: 6

No drift detected.

> ?drift

Checking all objects in namespace...

◉ Expressions — stable
○ Core_essay — stable  
○ App_interface — stable
○ Generation_API — stable
○ Level_1_Speed — stable
○ Level_2_Participation — stable
○ Level_3_Anchoring — stable

0 telic drifts
0 structural anomalies
```

## Making a Telic Change

```xeno
> Expressions.focus = "ship content fast"

⚠ telic drift detected

  old: "communicate ideas through participation"
  new: "ship content fast"

  This changes the core intent of Expressions.
  6 descendants may be affected.

  proceed? (y/n/explain) > explain

  The original focus emphasized "participation" and "ideas."
  The new focus emphasizes "shipping" and "speed."
  
  These have different semantic orientations:
    - participation → engagement, reader agency
    - shipping → output, delivery
  
  This may misalign descendant convergences.

  proceed? (y/n) > n

cancelled.
```

## Projections

```xeno
> Core_essay → task

[tasks] Core_essay (horizon 3)

  □ explain the organic touchpoint
    ├── □ Level 1: Speed [h2]
    ├── □ Level 2: Participation [h2]
    └── □ Level 3: Anchoring [h2]

  3 actionable items

> Core_essay → reflection

[reflection] Core_essay

  Questions to consider:
  
  1. What makes speed destabilizing rather than enabling?
  2. How does participation preserve meaning without control?
  3. What qualifies something as an "organic anchor"?
  
  These questions arise from the focus and child structure.

> Core_essay → outline

[outline] Core_essay: "explain the organic touchpoint"

  I. Speed (Level 1)
     - [context needed]
  
  II. Participation (Level 2)
     - [context needed]
  
  III. Anchoring (Level 3)
     - [context needed]

  Outline generated from semantic structure.
  Add .context to children to enrich.
```

## Adding Context

```xeno
> Level_1_Speed.context = [
    "AI collapsed friction",
    "Production outpaced reflection",
    "Effort stopped filtering"
  ]

○ updated: Level_1_Speed.context

> Level_1_Speed → reflection

[reflection] Level_1_Speed

  Questions to consider:

  1. When friction collapsed, what signal was lost?
  2. If effort no longer filters, what does?
  3. Can reflection be restored without slowing production?
```

## Semantic History

```xeno
> history Expressions

[0] 2026-01-13T10:00:00Z — created [organic]
[1] 2026-01-13T10:01:00Z — spawned Core_essay
[2] 2026-01-13T10:01:05Z — spawned App_interface
[3] 2026-01-13T10:01:10Z — spawned Generation_API

> Expressions@0

convergence Expressions {
  focus: "communicate ideas through participation"
  horizon: 4
  context: ["AI generation", "reader engagement", "organic anchors"]
  provenance: organic
  children: []
}

[snapshot from 2026-01-13T10:00:00Z]
```

## Saving State

```xeno
> save

saved namespace "vital-systems" to ~/.xeno/vital-systems.graph
  7 objects
  6 relations
  0 unresolved refs

> exit

$
```

## Resuming Later

```
$ xeno vital-systems
XenoScript v0.3
loaded: vital-systems (7 objects)
provenance: hybrid

> ls

◉ Expressions          [organic, h4, 3 children]
○ Core_essay           [synthetic, h3, 3 children]
○ App_interface        [synthetic, h3]
○ Generation_API       [synthetic, h3]
○ Level_1_Speed        [synthetic, h2]
○ Level_2_Participation [synthetic, h2]
○ Level_3_Anchoring    [synthetic, h2]

> 
```

---

## What This Shows

1. **Objects are alive** — you create them, query them, modify them
2. **The graph builds itself** — spawn creates relations automatically
3. **Projections are instant** — `→ task`, `→ graph`, `→ reflection`
4. **Drift is interactive** — the system pushes back on telic changes
5. **History is semantic** — not files, but meaning over time
6. **Provenance is visible** — `◉` vs `○` everywhere

This is a language you can think in.
