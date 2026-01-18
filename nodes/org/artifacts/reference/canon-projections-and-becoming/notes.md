# Canon, Projections, and Becoming — Reference Material

> An architectural philosophy for how the repository relates to truth, views, and change.

---

## 1. Ground Truth (Map vs. Territory)

Reality is the ultimate territory.

The system needs a canonical map of itself. That map is not metaphysical truth — it is authoritative *by convention*.

**Rules:**
- Reality can contradict the system.
- Within the system, the canon decides.

---

## 2. Ontology: Conceptual vs. Encoded

Two kinds of ontology are often conflated:

**A. Conceptual Ontology (Intent)**
- Lives in conversations, design notes, and the head
- Explains what you *mean*
- Not executable or enforceable

**B. Encoded Ontology (Formal)**
- Lives in files: schemas, markdown, rules, code
- Versioned, inspectable, enforceable
- This is the only ontology that exists for the system

**Rule:** If it's not encoded, it doesn't count.

---

## 3. The Repository as Canon

The repository is the canonical representation of the node's reality.

It contains:
- **Encoded ontology** — what concepts exist and how they relate
- **Content** — markdown, artifacts, entities
- **Processes** — code that transforms canon
- **History** — git as temporal record

**Principle:** The repo is the canon. Everything else is a projection or a process.

---

## 4. Projections

Projections are views of the same canon optimized for different purposes.

**A. Readable Projections**
- Aesthetic, legible renderings of repo content
- Optimized for reading and understanding
- Examples: rendered docs, the Expressions app

**B. Operational Projections**
- Runnable tools and applications
- Optimized for doing, not explaining
- Linked from the canon, not embedded within it

**Rule:**
- If something executes, it gets a link.
- If something explains, it lives in the projection.

---

## 5. README-First Is Valid

A well-written README is already a readable projection.

Markdown + links is sufficient until it strains. Platforms are earned, not required up front.

**Rule:** Until the README is insufficient, it is sufficient.

---

## 6. Editing the Canon

Over time, the system may become interactive. That means:
- Code may execute from or against the repo
- That code may validate intent, generate deltas, apply constrained edits

**Critical boundary:**
- Running code is never truth.
- It may only *propose* changes to truth.
- Truth is the repo state after changes are applied.

**Clean model:**

```
Canon (files)
   ↑ apply(delta)
Editor: f(canon, intent, constraints) → delta
Reader: g(canon) → projection
```

---

## 7. Guardrails

**Partition the canon:**
- **Content canon** — safe to edit via platform (artifacts, notes)
- **Code canon** — evolves via normal dev workflows
- **Ontology canon** — requires careful review for changes

**Start with narrow write surfaces.** Require stronger review for ontology or rule changes.

---

## 8. Observations as Infra-Canonical

Observations (from sensors) occupy a special position:

- They are not artifacts — they don't persist independently of process
- They are not ephemeral — they accumulate as durable memory
- They are *infra-canonical*: the substrate from which Models and Artifacts may be derived

Observations are to the system what sensory memory is to an organism: necessary infrastructure for learning, but not yet knowledge.

**Rule:** Observations feed learning. Models encode what was learned. Artifacts express it.

---

## 9. Federation and Multiple Nodes

What counts as "canonical" changes scope over time.

**Now:**
- The repository is canonical for this node
- This node is the current upstream

**Later:**
- Each node maintains local canon
- Network-level truth lives in protocol semantics
- Canonical becomes local; consensus becomes protocol-based

The repository may remain:
- A reference node
- A reference implementation
- Influential, but not absolute

**Principle:** Federation replaces singular canon with shared protocol.

---

## 10. Summary

| Concept | Role |
|---------|------|
| Reality | Territory — has veto power |
| Repository | Canon — authoritative map for the node |
| Encoded ontology | What exists for the system |
| Projections | Views of canon (readable or operational) |
| Editors | Propose changes to canon |
| Observations | Infra-canonical memory substrate |
| Artifacts | Durable outputs that persist in the canon |
| Federation | Future: shared protocol replaces singular canon |

---

## One Sentence

> The repo is the authoritative map of the system; projections explain it, editors transform it, observations feed it, and reality always has veto power.
