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

---

## XVI. Evolution: Surfaces Replace Layers

The layered model (Sections VI–VIII) was the original framing. It has been superseded by a **surfaces model**.

**Why the change:**

The layer metaphor implies hierarchy — Surface is "above" Source, finished is "better than" in-progress. But if the Process layer is where the actual life of the project is, calling it a "deeper layer" underneath a Surface that doesn't yet exist is misleading.

Multiple surfaces — different projections of the same canon — is more consistent with the projection concept itself. A projection isn't a layer. It's a view. Multiple projections of one canon is already the design principle in `canon-projections-and-becoming`.

**What surfaces means:**

Each surface is a way of encountering the canon. A listener encounters it as music. A reader encounters it as philosophy. A collaborator encounters it as a workshop. None of these is "deeper" than the others — they're different angles on the same underlying work.

**What's preserved from the layer model:**

- The content distinctions still hold (finished work, context, process, source)
- The idea that different depths of engagement exist
- The principle that you don't need everything finished to ship — each surface presents what's real
- Descent can still exist *within* a surface (a music surface can go from finished track → lyrics → production notes → stems) rather than between surfaces

**What's lost:**

The Dante/Inferno descent metaphor as a UX concept. The feeling of passing through thresholds. This was compelling but forced a linear progression that doesn't match how people actually want to engage. A musician might not care about the philosophy surface but wants the production surface. Surfaces allow access that matches the person, not a predetermined path.

---

## XVII. The Map

Navigation is a **map**, not a funnel or a tier list.

The map implies space rather than hierarchy. You're somewhere, and you can see other places exist. Some doors are open and some aren't. This is fundamentally different from a tier list where everything above you is grayed out with a price tag.

The entry point is a landing page — the finished work surface. From there, you can navigate to other surfaces. The map shows the whole space. Gated areas are visible but clearly places you haven't accessed yet, not things being dangled in front of you.

---

## XVIII. Three Surfaces Now

**Surface 1: Finished Work**
The landing page. Where polished, completed work lives. The single goes here when it's done. Until then, it's the front door that routes you elsewhere. Maximum beauty, minimum explanation.

**Surface 2: Workshop**
WIPs, songs in progress, notes, context. This is what the current Projection app scaffold is already close to doing — rendering the repo's markdown and song artifacts in a navigable way. Honest about being unfinished. "You're in the workshop, not the gallery." This is also where the trunk model becomes visible.

**Surface 3: Collaboration**
Doesn't need to be built as software yet. It's a documented process — the trunk model is the framework. A collaborator gets repo access, works within trunk/branch, the org owns integration. The "surface" here is the repo plus the trunk model document plus direct communication.

These are the current surfaces. More emerge as the work grows.

---

## XIX. External Platforms as Surfaces

Spotify, YouTube, GitHub — these are also surfaces. They're projections of the canon optimized for their respective contexts. The org doesn't control the presentation on external surfaces, but they're still views of the same underlying work.

**External surfaces** are for reach. **Owned surfaces** are for depth and relationship. Both are valid, and this distinction strengthens the case for a custom platform long-term — owned surfaces are projections you control.

---

## XX. Gating Principles

Some surfaces (or areas within surfaces) require access. The design must avoid feeling like a freemium app constantly upselling.

**Core principles:**

1. **Show that gated areas exist, but don't advertise them.** On a map, you can see a building you can't enter. That creates curiosity, not resentment. Don't remind users on every interaction that they're on the free tier.

2. **Gate at the boundary, not inside the experience.** If you have access to the workshop surface, everything in it is available. No individual items behind additional gates within a surface. Access is per-surface or per-area, not per-item.

3. **Make the "why" of the gate obvious without being preachy.** "This is the production space — contributors and supporters have access" is honest and clear. The gate should feel like a natural property of the space, not a monetization strategy.

4. **The contribution path should be as visible as the payment path.** If the only option on a locked area is "pay $10/month," that's Patreon. If "pay or contribute" have equal weight, the space signals community with an economy, not a product with a paywall.

**Access model:**

| Surface | Access | Rationale |
|---------|--------|-----------|
| Finished work | Open | This is how people find you |
| Philosophy/essays | Open or low gate | Ideas spread; gatekeeping them is counterproductive |
| Production (stems, sessions, WIP) | Paid or contribution | Genuinely valuable to practitioners |
| Workshop (active process) | Contribution | You're in the room; you should be adding value |
| Canon (full repo, fork rights) | Relationship | This is the node-creation threshold |

Payment and contribution are both valid forms of access. The platform should treat them with equal weight.

---

## XXI. Updated Open Questions

Previous open questions (Section XIV) are partially resolved:

- ~~What's the right V1 scope?~~ → Start with workshop surface (Surface 2). The finished work surface is a landing page until completed work exists.
- ~~What's the "something crazy" descent mechanism?~~ → Replaced by map navigation between surfaces. Descent can exist within a surface.
- How do songs get marked as "finished" (eligible for the finished work surface)?
- Static generation or dynamic? (Probably static for V1)
- How does the story weave through — is it its own surface?
- How does gating work technically? Auth, payments, contribution tracking?
- What's the minimum viable version of the map UX?
