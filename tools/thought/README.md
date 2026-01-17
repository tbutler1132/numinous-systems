# @vital-systems/thought

Process inbox items into observation memory with interactive tagging.

## Philosophy

This tool bridges the gap between raw capture (inbox) and durable memory (observations). It implements the **legibility** step in the progression: fuzzy → legible → encoded → enforced.

The inbox is fuzzy. The observation store is encoded. This tool is the controlled moment of legibility — where you decide what's worth remembering and how to categorize it.

## Installation

```bash
# From the tools/ directory
npm install
npm run build
```

## Usage

### Process inbox interactively

```bash
# From workspace root
node tools/thought/dist/cli.js process

# Or if linked
thought process
```

The CLI walks through each inbox item:
- Shows the item content
- Shows suggested tag if pre-tagged
- Waits for single keypress (a/i/e/q/s/d)
- Saves, skips, or deletes based on choice

### Dry run (parse only)

```bash
thought process --dry-run
```

### Options

```
--node <name>      Node name for observations (default: "personal")
--inbox <path>     Custom path to inbox.md
--dry-run          Parse only, no writes
```

## Workflow

### 1. Capture (manual)

Add notes to `nodes/inbox.md`:

```markdown
- Need to move all domains to cloudflare
- feeling a little restless and antsy
- Maybe the progression is fuzzy → legible → encoded
```

### 2. Pre-tag (optional)

Run an LLM to suggest tags inline:

```markdown
- Need to move all domains to cloudflare [action]
- feeling a little restless and antsy
- Maybe the progression is fuzzy → legible → encoded [idea]
```

The inbox includes a tagging guide at the top for LLM reference.

### 3. Process

Run `thought process` to interactively confirm/tag each item:

```
[1/12] "Need to move all domains to cloudflare"
       Suggested: action

  (a) action  <--
  (i) idea
  (e) episode
  (q) question
  (s) skip
  (d) delete

> a
✓ Saved: action
```

- Press Enter to accept suggested tag
- Or press a letter to choose a different tag
- Items saved or deleted are removed from inbox
- Skipped items stay for next time

## Tags

- `action` — something to do
- `idea` — worth preserving
- `episode` — relates to a project
- `question` — open question

Tags can evolve. The observation payload stores them as an array.

## Observation Schema

```typescript
{
  domain: "thought",
  type: "entry",
  source: "inbox",
  payload: {
    content: "the raw thought text",
    tags: ["action"]
  }
}
```

Fingerprinted on content only — same thought won't duplicate.

## Querying

Use SQLite directly or the sensor package:

```typescript
const store = await ObservationStore.create(dbPath);
const thoughts = store.queryObservations({ domain: "thought" });
```

## Dependencies

- `@vital-systems/sensor` — observation store, fingerprinting
