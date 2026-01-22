# Projection — Working Notes

> The surface is art. Depth reveals how it's made.

---

## I. The Core Insight

An app can cover content that spans the entire system while still belonging to a single node.

**The distinction:**
- What the app is **about** (subject matter) — can be anything
- Who **authored** the app (ownership) — determines where it lives

This app is *about* the creative work (and the system behind it) but *by* the org. It lives in the top-level `apps/` folder.

---

## II. Why This Matters

The system anticipates federation — multiple nodes, each with their own canon. When that happens:

- System-level apps (in `apps/`) become shared infrastructure
- Node-specific apps travel with their node
- This app would travel with the org

If the org node becomes its own repo someday, this projection goes with it. It's the org's view of whatever system it's part of.

---

## III. The Mental Model

```
Canon (repo-wide)
      ↓
   Projection (authored by org)
      ↓
   Layered Experience
      ├── Surface (art)
      ├── Context (meaning)
      ├── Process (making)
      └── Source (canon itself)
```

The org interprets the canon. The interpretation is the org's artifact. The layers allow different depths of engagement.

---

## IV. Relationship to System-Level Apps

The top-level `apps/` folder is for **system-level platforms** — generic tools that serve the entire repository without authorial perspective.

This app is different:
- It has an author (the org)
- It makes curatorial decisions
- It embeds an aesthetic
- It's a perspective, not a platform

If we later build a generic "render any markdown repo" tool, *that* would go in `apps/`. This app uses the org's judgment about what to show and how.

---

## V. Songs at the Center

The songs are the primary objects. Everything else — philosophy, story, ontology, infrastructure — exists as context around them.

This means:
- Songs are first-class navigable items, not buried under categories
- Song pages need special rendering: audio player, cover art, lyrics, notes
- The entry experience should lead toward songs, not away from them
- Related artifacts (essays, philosophy) connect *to* songs, not the other way around

The work is music. The rest is explanation.

---

## VI. The Layered Model

The projection has depth. Not everything is shown at once.

**Layer 1: The Surface**
Pure experience. Finished songs. Cover art. Audio. Maybe a single line of context. Maximum beauty, minimum explanation. The album as a stranger encounters it.

**Layer 2: The Context**
Songs with lyrics, notes, related philosophy. You can see what a song connects to. Still curated, still beautiful, but more to explore.

**Layer 3: The Process**
Work-in-progress versions, branches, commentary on decisions. The trunk model made visible. How things were made, what was tried and discarded.

**Layer 4: The Source**
GitHub. The raw repo. Everything. No curation. The canonical truth.

Each layer down reveals more but surrenders some of the authored experience. Someone can stay at the surface forever and just listen. Or they can descend and see how it's made.

This solves a practical problem: you don't have to finish everything to ship. Layer 1 can have 5 songs. Layer 2 can have 15. Layer 3 has everything. The work is always presentable at some depth.

---

## VII. Entry and Descent

The entry experience matters. What happens in the first 10 seconds?

**Not this:**
- Land on a list of sections
- See a table of contents
- Read an explanation

**Something like this:**
- An atmospheric, abstract entry that draws you in before you see content
- Then opens into something navigable where songs are the primary objects
- The atmosphere prepares you for what's inside

The descent mechanism — how you move between layers — should be "something crazy." Not just a toggle or a link. Possibilities:

- **Literal depth**: Z-axis interface. Scrolling or zooming takes you deeper. Surface is bright and sparse; deeper is denser and darker.
- **Frequency**: Musical metaphor. Surface is the master. Deeper reveals stems, tracks, MIDI, the Ableton project.
- **Time**: Surface is now. Deeper is history. Git history as archaeology.
- **Revelation**: Surface shows almost nothing. Descent makes things appear — text fades in, connections become visible, structure reveals itself.

The mechanism should match what the layers represent.

---

## VIII. The Inferno Parallel

The layered structure borrows from Dante's Inferno — concentric circles, each with its own character, descended through by choice.

**The parallel:**
- You pass through thresholds
- Each level has a distinct atmosphere
- Descent reveals more specificity, more truth about what's really there
- The journey is deliberate, not accidental

**The inversion:**
- In Dante, descent = punishment. The bottom is Satan frozen in ice.
- Here, descent = revelation. The bottom is raw source — GitHub, the canonical truth.
- In Dante, the surface world is neutral; depth is suffering.
- Here, the surface is maximally beautiful; depth is honest but less curated.

Descent isn't falling into hell. It's choosing to see behind the curtain. You give up some of the authored beauty in exchange for seeing how things are made.

This framing could guide the descent mechanism: the feeling of passing through thresholds, each one a choice to go further. The atmosphere shifts. The aesthetic changes. Not punishment — but transformation.

---

## IX. Starting from Depth

The polished surface (Layer 1) doesn't exist yet. Don't pretend it does.

V1 of Projection should present from Layer 2 or 3 — the work with context, the process visible. The aesthetic reflects that: not raw like GitHub, but not pretending to be a finished album either.

This is honest. "You're in the workshop, not the gallery."

When Layer 1 exists — when songs are truly finished — it emerges above. Until then, the deeper layers are what's real.

---

## X. What Each Layer Covers

The content shifts as you descend:

| Layer | Content Focus |
|-------|---------------|
| Surface | Finished songs, cover art, atmosphere |
| Context | Lyrics, notes, essays, philosophy, story |
| Process | WIP versions, trunk/branches, decisions, commentary |
| Source | Full repo: ontology, infrastructure, sensors, everything |

Not everything needs to be visible at every layer. Curation is the point.

---

## XI. Design Considerations

### Navigation
- The work has depth; the interface should make that depth explorable without overwhelming
- Songs are nodes; everything else is context
- Descent should feel intentional, not accidental

### Aesthetic
- Should embody the org's visual language
- Reference the aesthetic artifacts for guidance
- Beauty is a requirement, not a nice-to-have
- Each layer has its own appropriate aesthetic — surface is polished, process is raw

### Canon as Source
- Read directly from markdown files
- The repo IS the CMS
- No duplication, no drift

---

## XII. Connection to Expressions

Expressions and Projection are complementary:

| App | Purpose |
|-----|---------|
| **Expressions** | Personalized engagement with individual artifacts |
| **Projection** | The layered experience of the whole work |

Expressions goes deep on one artifact for one person. Projection provides the navigable surface and structure.

They could link to each other: Projection surfaces artifacts, Expressions lets you engage with them personally.

---

## XIII. Why "Projection"

The name comes directly from the philosophy in `canon-projections-and-becoming`:

> Projections are views of the same canon optimized for different purposes.

This app is literally "the org's projection" — a view of the canon, authored by the org, optimized for *experiencing* the creative work.

---

## XIV. Open Questions

- What's the right V1 scope? Start at Layer 2 or 3?
- What's the "something crazy" descent mechanism?
- How do songs get marked as "finished" (eligible for Layer 1)?
- Static generation or dynamic? (Probably static for V1)
- How does the story weave through — is it its own layer, or context around songs?

---

## XV. Evolution Note

This concept evolved from an earlier framing where Projection was "the org's documentary about the system" — a navigable interface for understanding how things work.

That function still exists but has moved to the deeper layers (Process, Source). The surface is now about experiencing the art, not explaining the system.

The core insight (authorship distinction) and design principles (canon as source, authored perspective, beauty as goal) remain unchanged. What changed is *what sits at the top* — art, not documentation.
