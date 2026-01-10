# Expressions V1 — Implementation Spec

## Philosophy

Build the minimum thing that validates the core question: **do personalized expressions resonate with people?**

No framework. No build step. No database. No auth. Ship it this weekend.

## Architecture

```
apps/expressions/
├── index.html          # All UI (~150 lines)
├── api/
│   └── generate.js     # Single serverless function (~50 lines)
└── vercel.json         # Route config
```

Total: ~200 lines of code.

## The Flow

1. **Land** → See list of 9 artifacts (titles + one-liners)
2. **Select** → Click an artifact
3. **Profile** → Answer 4 questions (single-select each)
4. **Generate** → Loading state → LLM call → Display expression
5. **Done** → Read it. Optional markdown download. One regenerate allowed.

## Profile Questions

Four questions, all single-select:

| Question | Options |
|----------|---------|
| How do you prefer ideas presented? | Direct / Poetic / Analytical / Conversational |
| Your relationship to the sacred? | Theist / Secular but open / Materialist / Exploring |
| What draws you in? | Logic / Stories / Abstractions / Practical application |
| Which resonates most? | Ancient philosophy / Modern science / Art & aesthetics / Contemplative traditions |

## Technical Details

### Frontend (`index.html`)

- Vanilla JS, no dependencies except `marked.js` for markdown rendering
- State machine: `select` → `profile` → `loading` → `result`
- LocalStorage tracks generation count per artifact (max 2 per artifact)
- CSS inline or in `<style>` block — keep it minimal but not ugly

### Backend (`api/generate.js`)

- Vercel Edge Function or Cloudflare Worker
- Fetches `about.md` + `notes.md` from GitHub raw URLs
- Calls Claude API with artifact content + user profile
- Returns generated expression as JSON

### The Prompt

```
You are generating a personalized expression of a philosophical artifact.

## The Concept (authoritative)
{about.md contents}

## Working Material (substance to draw from)
{notes.md contents}

## Reader Profile
- Prefers: {register}
- Sacred orientation: {sacred}
- Drawn to: {mode}
- Influences: {influences}

Generate a ~600-word personalized expression of this artifact for this reader. 
Shape the presentation, examples, and emphasis to resonate with their specific sensibility. 
The core truth remains — only the presentation adapts.

Write in second person where appropriate. Be direct, not preachy. 
This is a gift, not a lecture.
```

## Deployment

1. Create Vercel project, connect to repo
2. Set `ANTHROPIC_API_KEY` in environment variables
3. Deploy — done

## Cost Model

- ~1500 tokens in, ~800 tokens out per generation
- ~$0.01-0.03 per generation (Claude Sonnet)
- 1000 users × 20 generations = $200-600
- Acceptable for validation

## What This Is NOT

- Not a CMS — the repo is the content source
- Not a user platform — no accounts, no persistence
- Not a content farm — limited generations, sit with what you get
- Not overengineered — if you're adding features, stop

## Success Criteria

After 50-100 users:
- Do people read the whole expression?
- Do they come back for other artifacts?
- Do they share it or mention it?
- Does the personalization feel meaningful or gimmicky?

If the answer is "yes, yes, yes, meaningful" — consider V2.
If not — learned something, move on.

## What V2 Might Add (only if V1 validates)

- LocalStorage for preferences (don't re-answer questions)
- Share links (still no server storage — encode in URL)
- Multiple formats (essay, dialogue, meditation)
- Accounts + history (only if there's real demand)
