# Finance

## Artifact Concept

This folder contains **Finance** — a memory organ for personal financial data.

The purpose of this tool is not budgeting, not optimization, not decision-making. It is simply to **remember**. A normalized, append-only record of financial transactions that can be queried later when questions arise.

## What This Artifact Addresses

- How does this system observe itself over time?
- How do I create a stable, trustworthy record without building more than I need?
- How do I install a habit (the ritual) rather than a product?

## How It Works

1. Download CSV from Chase
2. Drop it in `nodes/personal/raw/finance/chase/`
3. Run `finance ingest`
4. Done

That's the ritual. The tool normalizes dates, amounts, and descriptions, then appends to an SQLite database. Re-running ingest is safe — duplicates are detected and skipped.

## What This Is NOT

This system MUST NOT:

- Produce scores
- Trigger alerts
- Recommend actions
- Enforce goals
- Tell you what's good or bad

Those are downstream concerns. If it does any of that, it's too early.

## Why This Matters

Cybernetic systems mature in order:

1. Sensing
2. Memory
3. Pattern recognition
4. Variable inference
5. Regulation

Most tools start at step 5. This tool is steps 1–2 only.

Even if you never build dashboards or automate decisions, you gain:

- A longitudinal record
- The ability to ask questions later
- A stable testbed for cybernetic ideas
- Infrastructure, not product

## Connection to Broader Project

This tool embodies the doctrine: **build only what reality asks for**.

The future vision (multi-domain sensors, projections, regulatory integration) is documented but not built. The memory organ comes first. Meaning emerges from observation, not from premature structure.

## Status

This artifact is in design. v1 scope is minimal: ingest CSVs, normalize, append, dedupe. Nothing more.
