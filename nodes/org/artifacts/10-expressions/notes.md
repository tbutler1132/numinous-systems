# Expressions — Notes

## The core idea
- Users provide preferences/style profile
- LLM takes about.md + notes.md from any artifact
- Generates a personalized expression tailored to that user
- Personal expressions are private and derivative, not canonical

## Why this matters
- Same concept can resonate differently with different people
- A scientific materialist and a contemplative theist need different entry points
- The notes already contain multiple frames — the tool pulls the right threads
- Personalization without fragmentation

## The fragmentation concern
- Don't want "1000 versions floating around"
- Solution: clear hierarchy
  - Canonical artifact (about.md + notes.md) = source of truth
  - Public expression (authored by Org) = the official take
  - Personal expressions = private, derivative, clearly marked
- Personal expressions don't pollute the public namespace
- The center holds

## User profile dimensions
- Influences (philosophical, aesthetic, cultural)
- Register preference (poetic, direct, academic, conversational)
- Relationship to the sacred (theist, naturalist, secular, agnostic)
- Professional/personal context (optional — "I work in X", "I'm a parent")
- What they're drawn to (logic, narrative, examples, abstractions)

## Technical approach
- Simple Next.js app living in this repo
- Reads markdown files directly from nodes/org/artifacts/
- No separate CMS — the repo IS the content source
- API route calls LLM with artifact content + user prefs
- User can iterate ("more grounded", "connect to my work in music")

## The prompt structure
- Artifact concept (from about.md) — stable, authoritative
- Working material (from notes.md) — the substance to draw from
- User profile — who they are, what resonates
- Task: generate expression shaped for this specific reader

## What the about.md + notes.md structure provides
- about.md gives the "what and why" — conceptual grounding
- notes.md gives the "substance" — arguments, examples, multiple frames, connections
- The looseness of notes is a feature — more material for LLM to work with
- Different users → different threads pulled

## Open questions
- What's the right granularity for user profiles? Too few options = no real personalization. Too many = friction.
- Should users be able to save/compare multiple expressions of the same artifact?
- Is there value in letting users share expressions with each other (while keeping them clearly derivative)?
- How do we handle artifacts that are thin on notes? Minimum viable content?
- Should expressions include citations/links back to the source material?

## Connection to other artifacts
- **Community**: enables connection between ideas and individuals
- **Hybrid Subject**: technology serving human experience
- **Capital-as-Medium**: directing technical capability toward beauty
- **Vital Systems**: the app is a living system that reads from the knowledge base

## Future possibilities
- Multiple expression formats (essay, dialogue, meditation, letter)
- Expression history — see how your understanding evolves
- Guided paths through multiple artifacts
- Community expressions (curated, not user-generated chaos)
