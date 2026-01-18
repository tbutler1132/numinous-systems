# Projection — Working Notes

> The org is making a documentary about the whole system, but the documentary is still an org artifact.

---

## I. The Core Insight

An app can cover content that spans the entire system while still belonging to a single node.

**The distinction:**
- What the app is **about** (subject matter) — can be anything
- Who **authored** the app (ownership) — determines where it lives

This app is *about* the system but *by* the org. That's why it lives in `nodes/org/artifacts/apps/`, not in the top-level `apps/` folder.

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
   App (lives in org/artifacts/apps/)
```

The org interprets the canon. The interpretation is the org's artifact.

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

## V. What It Should Cover

The projection should make the system legible:

| Content | Source |
|---------|--------|
| Core philosophy | `nodes/org/artifacts/core/` |
| Reference material | `nodes/org/artifacts/reference/` |
| System ontology | `ontology.md` |
| How nodes work | `nodes/README.md`, node docs |
| Essays and practice | `nodes/org/artifacts/essays/`, `practice/` |
| Infrastructure (for those who care) | `core/`, `sensors/`, `xenoscript/` |

Not everything needs equal prominence. Curation is the point.

---

## VI. Design Considerations

### Navigation
- The system has depth; the interface should make that depth explorable without overwhelming
- Hierarchy matters: core ideas → supporting material → implementation details

### Aesthetic
- Should embody the org's visual language
- Reference the aesthetic artifacts for guidance
- Beauty is a requirement, not a nice-to-have

### Canon as Source
- Read directly from markdown files
- The repo IS the CMS
- No duplication, no drift

---

## VII. Open Questions

- What's the right scope for V1? Start with reference material? Core essays?
- How much infrastructure detail to expose? (Probably: link to it, don't explain it)
- Static generation or dynamic? (Probably static for V1 — simpler, matches "README-first is valid")
- What framework? (TBD — implementation decisions come later)

---

## VIII. Connection to Expressions

Expressions and Projection are complementary:

| App | Purpose |
|-----|---------|
| **Expressions** | Personalized engagement with individual artifacts |
| **Projection** | Navigable overview of the whole system |

Expressions goes deep on one artifact for one person. Projection goes wide across the system for anyone.

They could link to each other: Projection surfaces artifacts, Expressions lets you engage with them personally.

---

## IX. The Documentary Metaphor

The app is like a documentary:
- It has a subject (the system)
- It has an author (the org)
- It makes choices about framing, pacing, emphasis
- It's one interpretation, not the only possible one

Other nodes could make their own documentaries about the same system. Those would be their artifacts, not ours.

---

## X. Why "Projection"

The name comes directly from the philosophy in `canon-projections-and-becoming`:

> Projections are views of the same canon optimized for different purposes.

This app is literally "the org's projection" — a view of the canon, authored by the org, optimized for reading and understanding.
