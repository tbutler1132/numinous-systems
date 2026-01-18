# Calendar Sensor — v1 Spec

> **"This tool syncs Google Calendar events into a normalized, append-only observation memory."**

---

## What This Is

A **memory organ** — not a calendar app, not a productivity tracker, not a time analytics platform.

You are not solving "time management" right now.
You are solving **"how does this system observe itself over time?"**

---

## What This Is NOT

**Design constraint** — this system MUST NOT:

- Calculate productive/unproductive time
- Produce time reports or scorecards
- Trigger reminders or alerts
- Suggest schedule changes
- Visualize calendar heatmaps
- Tell you what's good or bad

Those are downstream concerns. If it does any of that, it's too early.

---

## The Ritual

Unlike Finance (manual CSV drops), Calendar is automated:

1. One-time: `calendar auth` (opens browser, grants access)
2. Ongoing: `calendar sync` (fetches and stores events)

Could run on a cron, but manual invocation keeps you aware the sync happened.

---

## The Schema

Uses the shared observations table. A calendar event is stored as:

```json
{
  "id": "sha256...",
  "observed_at": "2026-01-17T14:00:00Z",
  "domain": "calendar",
  "source": "google_api",
  "type": "event",
  "schema_version": 1,
  "payload": {
    "title": "Weekly sync with Alex",
    "title_norm": "WEEKLY SYNC WITH ALEX",
    "description": "Discuss roadmap priorities",
    "location": "Zoom",
    "start_at": "2026-01-17T14:00:00Z",
    "end_at": "2026-01-17T15:00:00Z",
    "all_day": false,
    "calendar_id": "primary",
    "google_event_id": "abc123xyz",
    "status": "confirmed",
    "recurrence": null
  },
  "ingested_at": "2026-01-17T10:30:00Z"
}
```

**Notes:**

- `observed_at` = event start time (canonical time axis)
- `google_event_id` preserved for update detection
- `title_norm` for consistent querying (uppercase, trimmed)
- `status` captures confirmed/tentative/cancelled
- `recurrence` stores RRULE if present (for reference, not expansion)

---

## Fingerprinting Strategy

Calendar events have natural unique IDs from Google. Two strategies:

### Option A: Use Google Event ID Directly

```
fingerprint = hash(calendar | google_api | event | google_event_id)
```

**Pros:** Simple, always unique
**Cons:** Tied to Google's ID scheme

### Option B: Semantic Fingerprint (like Finance)

```
fingerprint = hash(calendar | google_api | event | start_at | end_at | title_norm | calendar_id)
```

**Pros:** Portable if switching providers
**Cons:** Collides on identical meetings (e.g., recurring "Daily Standup")

**Decision: Option A** — Google Event ID is stable and unique. If you switch providers later, migrate then. Don't over-engineer for hypotheticals.

---

## Update Handling

Events change (rescheduled, title edited, cancelled). Two strategies:

### Strategy 1: Upsert (Replace)

Same fingerprint → update the row with new payload.

**Pros:** Latest state always accurate
**Cons:** Loses history of changes

### Strategy 2: Append-Only with Versioning

Each change is a new observation with a version marker:

```json
{
  "payload": {
    "...": "...",
    "version": 2,
    "previous_id": "sha256..."
  }
}
```

**Pros:** Full history
**Cons:** More complex queries, storage growth

**Decision: Strategy 1 (Upsert)** for v1. Calendar events are mutable by nature. If change history becomes important, add versioning later.

---

## Sync Window

Default: 7 days back, 30 days forward.

```bash
calendar sync                           # default window
calendar sync --days-back 30            # last 30 days
calendar sync --days-forward 90         # next 90 days
```

Why include future events? They're commitments — worth observing even before they happen. The `observed_at` (start time) may be in the future, which is fine.

---

## OAuth Flow

Google Calendar API requires OAuth 2.0 (no API keys for user data).

### Setup (One-Time)

1. Create Google Cloud project
2. Enable Calendar API
3. Create OAuth credentials (Desktop app)
4. Download `credentials.json` to `~/.config/vital-systems/google/credentials.json`

### Auth Command

```bash
calendar auth
```

- Opens browser to Google consent screen
- User approves access
- Tokens saved to `~/.config/vital-systems/google/tokens.json`

### Token Refresh

Access tokens expire (~1 hour). The googleapis library handles refresh automatically using the stored refresh token.

---

## Normalization Rules

**Title:**

- `title` = unchanged from API
- `title_norm` = uppercase, trimmed, collapsed whitespace

**Times:**

- Convert to ISO-8601 with timezone
- All-day events: use date only (no time component), set `all_day: true`

**Description/Location:**

- Store as-is, null if empty

**Status:**

- `confirmed`, `tentative`, `cancelled`
- Cancelled events are stored (they happened, then were cancelled — that's data)

---

## CLI

```bash
# Auth flow
calendar auth

# Sync events
calendar sync [options]

# Options
--node <name>           # which node's observation store (default: "personal")
--days-back <n>         # how far back to sync (default: 7)
--days-forward <n>      # how far forward to sync (default: 30)
--calendars <ids>       # comma-separated calendar IDs (default: all)
--dry-run               # fetch and display, no writes
```

**Examples:**

```bash
# Default sync
calendar sync

# Sync more history
calendar sync --days-back 90

# Specific calendar only
calendar sync --calendars primary

# Preview without writing
calendar sync --dry-run
```

**Output:**

```
syncing: 2026-01-10 to 2026-02-16
calendars: 2 (primary, work)
events fetched: 47
inserted: 42
updated: 3
skipped (unchanged): 2
run logged: ingest_runs.run_id = abc123...
```

---

## Ingest Audit Log

Uses the shared `ingest_runs` table:

```json
{
  "run_id": "uuid",
  "source_file": "google_calendar_api",
  "domain": "calendar",
  "rows_read": 47,
  "rows_inserted": 42,
  "rows_skipped": 2,
  "min_observed": "2026-01-10T09:00:00Z",
  "max_observed": "2026-02-15T18:00:00Z",
  "status": "success"
}
```

---

## File Layout

```
sensors/
  calendar/
    package.json
    src/
      cli.ts            # entry point
      auth.ts           # OAuth flow
      sync.ts           # fetch and store
      types.ts          # CalendarEventPayload
      fingerprint.ts    # event fingerprinting

~/.config/vital-systems/google/
  credentials.json      # OAuth client credentials (user provides)
  tokens.json           # Access/refresh tokens (generated by auth flow)
```

Credentials/tokens stored outside repo for security. Never committed.

---

## Tech Stack

- Node.js + TypeScript
- `googleapis` (official Google API client, handles OAuth)
- `@numinous-systems/sensor` (shared observation infrastructure)

---

## Recurring Events

Recurring events have an RRULE and generate instances. Two approaches:

### Approach A: Store Rule Only

Store the master event with recurrence rule. Don't materialize instances.

**Pros:** Compact, true to source
**Cons:** Querying "what happened on date X" requires RRULE parsing

### Approach B: Materialize Instances

Fetch expanded instances (Google API supports this). Each instance is a separate observation.

**Pros:** Simple queries ("show me all events on 2026-01-17")
**Cons:** Storage growth, need to handle instance updates

**Decision: Approach B (Materialize)** — queries should be simple. Storage is cheap. Use Google's instance expansion; store `recurrence` field for reference only.

---

## Deleted Events

When an event is deleted in Google Calendar:

- It won't appear in future syncs
- Existing observation remains in store

This is intentional. The event happened (or was planned). Deletion in Google doesn't erase history in your observation store.

To mark deletions explicitly (future enhancement): could run a reconciliation pass that marks missing events as `status: deleted`.

---

## Acceptance Criteria

1. `calendar auth` completes OAuth flow, tokens stored
2. `calendar sync` fetches events from Google Calendar
3. Events stored in observations table with `domain='calendar'`, `type='event'`
4. Re-running sync doesn't create duplicates
5. Modified events are updated (upsert)
6. Cancelled events are stored with `status: cancelled`
7. Recurring events are materialized as instances
8. Sync run logged to `ingest_runs`

That's v1.

---

## Open Questions

1. **Multiple Google accounts?** — v1 assumes single account. Multi-account could use separate credentials files.

2. **Which calendars to sync?** — Default to all readable calendars. Flag to filter. Should probably exclude "Holidays" etc. by default.

3. **Private events?** — Google marks some events as private (visibility: private). Still sync them — it's your memory. Just don't share the database.

4. **Attendees?** — Could store attendee list in payload. Useful for "who do I meet with most?" queries. Consider for v1 or defer.

---

## Why This Is Not Wasted Effort

Even if you never analyze the data:

- You have a record independent of Google's retention policies
- You can correlate time usage with other domains (finance, mood)
- You can query "what was I doing when X happened?"
- You own your data, not just access to it

This is infrastructure, not product.

> The calendar tells you what's next.
> The observation store tells you what was.
