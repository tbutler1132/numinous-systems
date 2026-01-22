---
title: Calendar
status: draft
category: reference
relates_to:
  - calendar
created: 2026-01-17
updated: 2026-01-17
---

# Calendar

## Artifact Concept

This folder contains **Calendar** — a sensor that syncs Google Calendar events into the observation memory.

The purpose of this tool is not scheduling, not reminders, not productivity metrics. It is simply to **observe**. A normalized, append-only record of how time was allocated that can be queried later when questions arise.

## What This Artifact Addresses

- How do I remember what I actually did with my time?
- How do I correlate calendar data with other observations (finance, mood, health)?
- How do I build a longitudinal record without switching tools or habits?

## How It Works

1. Run `calendar sync`
2. Done

The tool authenticates with Google Calendar (one-time OAuth flow), fetches events within a configurable window (default: 7 days back, 30 days forward), normalizes them, and appends to the observation store. Re-running sync is safe — duplicates are detected and skipped, updates are handled.

Calendar is the third sensor after Finance and Thought. It uses the same observation infrastructure with zero schema changes.

## What This Is NOT

This system MUST NOT:

- Produce time reports or scorecards
- Calculate "productive hours"
- Trigger reminders or alerts
- Suggest schedule optimizations
- Tell you what's good or bad time usage

Those are downstream concerns. If it does any of that, it's too early.

## Why This Matters

Time is the one resource you can't recover. But most calendar tools are forward-looking (what's next?) rather than backward-looking (what happened?). This tool creates the record.

Even if you never analyze the data, you gain:

- A queryable history of calendar events
- Correlation with other domains (did I spend more when I had more meetings?)
- The ability to ask questions later about patterns
- A stable record independent of Google's UI or export format changes

## Why API Sync (Not ICS Export)

Calendar data is time-sensitive. Unlike finance (batch export every 2 weeks), calendar events:

- Change frequently (reschedules, cancellations)
- Have future events worth capturing early
- Are created/modified from multiple devices

API sync keeps the observation store current without manual export rituals.

The tradeoff is OAuth complexity, but it's one-time setup (~15 min) for ongoing automation.

## Connection to Broader Project

This tool extends the observation protocol to the time domain. Combined with Finance (money) and Thought (ideas/actions), it enables multi-domain queries:

- "What was happening when I felt X?"
- "Do certain calendar patterns correlate with spending patterns?"
- "What projects got the most time this quarter?"

These questions become answerable through queries, not dashboards.

## Status

This artifact is in design. v1 scope:

- OAuth flow for Google Calendar API
- Sync events within configurable time window
- Normalize and dedupe using Google event ID
- Handle event updates (same event ID, modified content)
- Basic CLI (`calendar sync`, `calendar auth`)

Future considerations (not v1):

- Multiple calendar selection
- Recurring event handling (materialize instances vs. store rule)
- Deleted event tracking
- Query CLI (`calendar query --since --until`)
