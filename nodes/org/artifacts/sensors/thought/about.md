---
title: Thought
status: draft
category: reference
relates_to:
  - thought
created: 2026-01-15
updated: 2026-01-17
---

# Thought

## Artifact Concept

This folder contains **Thought** — a tool for processing raw captures into the observation memory.

The purpose of this tool is to bridge the gap between the inbox (fuzzy, unstructured capture) and the observation store (durable, queryable memory). It implements the **legibility** step in the progression: fuzzy → legible → encoded → enforced.

## What This Artifact Addresses

- How do I preserve thought patterns without committing to rigid schemas too early?
- How do I triage raw captures efficiently while keeping a human in the loop?
- How do I create a queryable record of thoughts, actions, and ideas without over-engineering?

## How It Works

### Capture (manual)

Notes go into `nodes/inbox.md` as simple bullet points. No structure required.

```markdown
- Need to move all domains to cloudflare
- feeling a little restless and antsy
- Maybe the progression is fuzzy → legible → encoded
```

### Pre-tag (optional, LLM-assisted)

Run an LLM pass over the inbox to suggest tags inline. Tags are bracketed at the end of items:

```markdown
- Need to move all domains to cloudflare [action]
- feeling a little restless and antsy
- Maybe the progression is fuzzy → legible → encoded [idea]
```

The inbox includes a tagging guide at the top that instructs the LLM on available tags.

### Process (CLI, human-in-the-loop)

Run `thought process` to walk through each item:

- If pre-tagged, the suggested tag is shown but can be overridden
- If not pre-tagged, select a tag manually
- Items can be skipped (stay in inbox) or deleted (noise)
- Confirmed items are inserted into the observation store

### Observation Schema

Thought entries use a deliberately loose schema:

```typescript
{
  domain: "thought",
  type: "entry",
  source: "inbox",
  payload: {
    content: "the raw thought text",
    tags: ["action"]  // array allows multi-tagging later if needed
  }
}
```

Tags are just strings. No rigid action/idea/episode types — just lightweight categorization that can evolve organically.

## What This Is NOT

- Not a task manager — actions are tagged but not tracked, scheduled, or enforced
- Not journaling — this is triage, not prose
- Not AI-generated thoughts — the content is yours, LLM just helps with tagging
- Not a replacement for doing things — tagging something [action] doesn't make it happen

## Why This Matters

The inbox accumulates fast. Without processing, it becomes a graveyard. But committing to rigid schemas too early (Action with due dates, priorities, contexts) creates friction and often doesn't survive contact with reality.

This tool sits in the middle:

- Lightweight enough to actually use
- Structured enough to query later
- Human-in-the-loop so nothing slips through unexamined
- Tags can harden into types later if patterns emerge

The record itself has value. Even if you never build reports or dashboards, you gain:

- A longitudinal record of what you were thinking
- The ability to query by tag, time, or content
- Visibility into your own patterns (what becomes action vs what dies?)

## Connection to Broader Project

This tool embodies the doctrine of deliberate crystallization. The inbox is fuzzy. The observation store is encoded. This tool is the controlled moment of legibility — where you decide what's worth remembering and how to categorize it.

It uses the same observation infrastructure as Finance, demonstrating that the sensor architecture is truly domain-agnostic.

## Status

This artifact is in design. v1 scope:

- Parse inbox.md items (with optional inline tags)
- Interactive CLI to confirm/tag/skip/delete each item
- Insert confirmed items into observation store as thought entries
- Remove processed items from inbox

Future considerations (not v1):

- Query CLI (`thought query --tag action --since 2026-01`)
- Stats/patterns (`thought stats` — what tags dominate? what's the action→done ratio?)
- Integration with episode/project context
