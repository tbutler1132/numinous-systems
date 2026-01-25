---
title: Dashboard
status: working
category: app
relates_to:
  - sensors
  - the-living-system
created: 2026-01-25
updated: 2026-01-25
---

# Dashboard

## Artifact Concept

This folder contains **Dashboard** — the operational surface for the sensor system.

Dashboard makes the observation layer legible. It answers: what data exists, when was it last updated, and is anything stale?

## What This Artifact IS

- A status view for all sensor domains
- A quick way to see if data needs refreshing
- A drag-and-drop interface for ingesting new data
- A glanceable overview of recent observations

## What This Artifact Is NOT

- An analytics platform (pattern recognition comes later)
- A data editor (observations are append-only)
- A replacement for the CLI (both serve different contexts)

## Why It Exists

The sensor infrastructure stores observations reliably, but without a surface to view them, the system feels abstract. "Did it work?" requires querying SQLite. "Am I up to date?" has no answer.

Dashboard closes this gap. It makes the ritual of data collection tangible — you can see when you last ingested, whether domains are fresh or stale, and what's actually in the memory layer.

## Design Principles

- **Glanceability** — answer "do I need to update?" in seconds
- **Low friction** — drag-and-drop beats CLI for the common case
- **Domain-agnostic** — works across all observation types
- **Honest status** — show staleness clearly (green/yellow/red)

## Connection to Broader Project

This app serves **The Living System** by making the sensing layer operational. A system that observes but cannot report its own state is incomplete.

It also reduces friction in the "Download. Drop. Ingest." ritual — combining drop and ingest into a single gesture.

## Status

This artifact is **working**. Basic status display and drag-and-drop ingestion are functional. Future iterations may add richer data exploration.
