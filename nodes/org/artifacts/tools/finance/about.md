# Finance

## Artifact Concept

This folder contains **Finance** — a local-first personal analytics pipeline for financial data.

The purpose of this tool is to provide a minimal, private, trustworthy sensor for personal financial activity. It ingests bank exports, stores them as generic observations (future-proof for other sensor domains), and provides basic analytics and system health signals.

## What This Artifact Addresses

- How do I understand my financial activity without surrendering data to third parties?
- How do I build personal infrastructure that I control and can trust?
- How do I detect when my observation systems are stale or degraded?

## How It Works

1. Export transaction data from Chase (CSV)
2. Drop the file into a raw folder
3. Run `finance ingest` to parse, normalize, and store
4. Query with `finance report` (monthly spend, merchant rollups)
5. Check system health with `finance status` (staleness detection)

The tool treats the human export process as part of the system loop — `finance status` is the feedback signal that prompts action when data goes stale.

## What This Is NOT

- Not automated bank login or scraping
- Not a budgeting app with categories and goals
- Not a multi-user system
- Not real-time sync

## Connection to Broader Project

This tool serves the central purpose by **removing friction from self-knowledge**.

- **The Living System** — treats personal data infrastructure as part of the hybrid condition; the human is in the loop
- **Capital as Medium** — uses technical capability for personal insight, not extraction
- **Cybernetic framing** — environment → sensor → memory → observer → health monitoring

The observation/projection architecture is intentionally generic. Future sensors (health, calendar, code activity) can emit their own observation types and projections without changing the core schema.

## Status

This artifact is in design. See `notes.md` for the full specification.
