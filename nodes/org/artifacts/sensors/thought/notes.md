# Thought — Working Notes

## Initial Tags

Starting set, expected to evolve:

- `action` — something to do
- `idea` — worth preserving, might develop later
- `episode` — relates to a specific project or episode
- `question` — open question, unresolved

Not including `noise` as a tag — noise just gets deleted, not stored.

## Inbox Format

Top of inbox.md should include tagging guide for LLM pre-pass:

```markdown
# Inbox

Raw notes. Process regularly.

## Tagging Guide

When pre-tagging, add one of these at the end of each item:
- [action] — something to do
- [idea] — worth preserving
- [episode] — relates to a project
- [question] — open question

Leave untagged if unclear.

---

- item one [action]
- item two
- item three [idea]
```

## CLI Design

```
$ thought process

[1/12] "Need to move all domains to cloudflare"
       Suggested: action

  (a) action ←
  (i) idea
  (e) episode
  (q) question
  (s) skip
  (d) delete

> a

✓ Saved with tag: action

[2/12] "feeling a little restless and antsy"
       No suggestion

  (a) action
  (i) idea
  (e) episode
  (q) question
  (s) skip
  (d) delete

> d

✗ Deleted

...

Done. 8 saved, 3 deleted, 1 skipped.
```

Keyboard shortcuts for speed:
- Single letter selects (a/i/e/q/s/d)
- Enter confirms suggested tag if present
- Could add number keys too (1-6)

## Fingerprinting

Thought entries fingerprint on:
- `domain` ("thought")
- `type` ("entry")
- `content` (the raw text)

Tags are NOT part of the fingerprint. If the same content is processed again (even with a different tag), the CLI should **warn and skip** — the thought already exists in the store.

## Decisions

- **observed_at**: Use processing timestamp. We don't know when the thought actually occurred.
- **Nested bullets**: Keep together as one entry. Sub-bullets are part of the parent thought.
- **Duplicates**: Warn and skip. Don't update, don't create duplicates.

## Open Questions

- Should processed items be archived somewhere or just deleted from inbox?

## Dependencies

- `@vital-systems/sensor` — for ObservationStore, fingerprinting
- `readline` or `enquirer` — for interactive CLI
- Standard Node fs for reading/writing inbox.md
