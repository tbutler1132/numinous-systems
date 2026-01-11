# Expressions

## I. The Core Idea

Users provide a preferences/style profile. The system takes the `about.md` + `notes.md` from any artifact and generates a personalized expression tailored to that user.

Personal expressions are private and derivative, not canonical.

---

## II. Why This Matters

The same concept can resonate differently with different people. A scientific materialist and a contemplative theist need different entry points.

The notes contain multiple frames. The tool pulls the right threads for each person.

**Personalization without fragmentation.**

---

## III. The Fragmentation Concern

The worry: "1000 versions floating around."

**Solution:** Clear hierarchy.

| Level | Status |
|-------|--------|
| **Canonical artifact** (about.md + notes.md) | Source of truth |
| **Public expression** (authored by Org) | The official take |
| **Personal expressions** | Private, derivative, clearly marked |

Personal expressions don't pollute the public namespace. The center holds.

---

## IV. User Profile Dimensions

| Dimension | Examples |
|-----------|----------|
| **Influences** | Philosophical, aesthetic, cultural |
| **Register preference** | Poetic, direct, academic, conversational |
| **Relationship to the sacred** | Theist, naturalist, secular, agnostic |
| **Professional/personal context** | "I work in X," "I'm a parent" |
| **What they're drawn to** | Logic, narrative, examples, abstractions |

---

## V. Technical Approach

- Simple app living in `apps/expressions/`
- Reads markdown files directly from `nodes/org/artifacts/`
- No separate CMS—the repo IS the content source
- API route calls LLM with artifact content + user preferences

---

## VI. V1 Approach

### Principles
- No auth, no accounts, no friction
- Zero storage—nothing saved server-side, privacy-preserving
- The expression is a mirror, not a slot machine—sit with what you get

### Flow
1. Land on the page
2. Pick an artifact
3. Answer 3-5 questions
4. Generate expression
5. Done

### Constraints
- One generation per artifact, one regenerate allowed (2 max per artifact)
- Display in UI with optional markdown download
- Possible later: localStorage for preferences so returning users don't re-answer
- Accounts/persistence only if V1 validates the core experience

---

## VII. Bounded Artifact Set

Pick a contained, complete set of artifacts for V1 (e.g., the 5 core essays + key supporting artifacts).

| Metric | Value |
|--------|-------|
| **Expressions per artifact** | 2 max |
| **Total cap per user** | ~10-12 generations |
| **Cost per fully-engaged user** | ~$0.30-0.40 (high-tier model) |
| **1,000 users × 12 generations** | ~$400-500 total |

Creates a sense of journey/completeness: "I've engaged with them all."

Track via localStorage (not bulletproof, but good enough for V1).

---

## VIII. Prompt Structure

| Component | Source |
|-----------|--------|
| **Artifact concept** | From about.md—stable, authoritative |
| **Working material** | From notes.md—the substance to draw from |
| **User profile** | Who they are, what resonates |
| **Task** | Generate expression shaped for this specific reader |

---

## IX. What the Structure Provides

- `about.md` gives the "what and why"—conceptual grounding
- `notes.md` gives the "substance"—arguments, examples, multiple frames, connections

The structure of notes is a feature—more material for the LLM to work with. Different users → different threads pulled.

---

## X. Connection to Philosophy

| Artifact | How Expressions Serves It |
|----------|---------------------------|
| **What We Are** | Technology serving human experience, respecting hybrid condition |
| **Capital as Medium** | Directing technical capability toward beauty, not extraction |
| **Beauty Redeems** | Enabling moments of resonance between ideas and individuals |

---

## XI. Future Possibilities

- Multiple expression formats (essay, dialogue, meditation, letter)
- Expression history—see how your understanding evolves
- Guided paths through multiple artifacts
- Community expressions (curated, not user-generated chaos)
