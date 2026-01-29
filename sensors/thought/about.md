# Thought Sensor

Captures inbox entries as observations. No semantic analysis - just parse, fingerprint, store.

## What It Does

Parses `inbox.md` files containing weekly thought entries in markdown bullet format. Each top-level bullet (with its sub-bullets) becomes one observation.

## Observation Structure

- **domain**: `thought`
- **source**: `inbox_md`
- **type**: `entry`
- **observed_at**: Derived from `## Week of Jan 12` headers (falls back to ingest date)

## Payload

```typescript
interface ThoughtEntryPayload {
  text: string;           // Full text including sub-bullets
  text_normalized: string; // Lowercase, trimmed for fingerprinting
  tags: string[];         // Extracted [action], [idea], etc.
  week_context: string;   // "Week of Jan 12" header text
}
```

## Fingerprint Identity

`["thought", "inbox_md", "entry", text_normalized]`

Text content is the identity since thoughts don't have natural unique keys like transactions do.

## CLI Usage

```bash
# Ingest from file
thought ingest nodes/inbox.md

# Dry run (parse only, no writes)
thought ingest --dry-run nodes/inbox.md

# Read from stdin
cat nodes/inbox.md | thought ingest --stdin

# Specify node
thought ingest --node private nodes/inbox.md
```

## What It Does NOT Do

- No semantic tagging or categorization
- No LLM analysis
- No interpretation of meaning

Analysis and pattern recognition happen elsewhere, later.

## Input Format

Expects markdown with:
- `## Week of <Month> <Day>` headers for date context
- Top-level bullets (`- `) as entries
- Optional sub-bullets (indented `- `) included in entry
- Optional `[tag]` markers extracted but not processed

Example:
```markdown
## Week of Jan 12

- First thought here
  - A sub-point
  - Another sub-point
- Second thought [action]
- Third thought with some longer text
```
