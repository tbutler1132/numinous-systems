---
title: Apps
status: draft
category: app
relates_to:
  - personalization-without-dilution
  - organic-touchpoints
  - beauty-as-goal
  - restraint
  - landing
  - expressions
  - projection
  - sensors-ui
  - core
  - aesthetic
  - sensors
created: 2026-01-17
updated: 2026-01-18
---

# Apps

## Category Concept

This folder contains **user-facing applications** — software that enables engagement with the philosophy without requiring someone to read the essays.

Apps are interfaces. They translate the worldview into interaction, making it accessible through experience rather than exposition.

## What This Category Addresses

- How can someone engage with these ideas without reading philosophy?
- What interactions embody the principles?
- How does software become a medium for meaning?
- What does it look like to build tools that serve beauty rather than engagement metrics?

## Design Principles

Apps here share certain commitments:

- **Personalization without dilution** — meet people where they are without compromising what matters
- **Organic touchpoints** — natural moments of contact rather than manufactured engagement
- **Beauty as goal** — the experience should itself be beautiful, not just functional
- **Restraint** — do less, better

## Current Apps

| App             | Function                                                   |
| --------------- | ---------------------------------------------------------- |
| **Expressions** | Personalized engagement with artifacts via organic prompts |
| **Projection**  | Unified interface containing landing, sensors UI, and canon navigation |

Projection consolidates what were previously separate apps:
- **Landing** → root route (`/`) — personal brand hub and entry point
- **Sensors UI** → `/sensors` — operational status and ingest interface

## Connection to Other Categories

- **Core** provides the ideas apps embody
- **Aesthetic** provides the visual and interaction language
- **Sensors** may feed data that apps surface

## Implementation

Org-specific apps live entirely within their artifact folders — concept (`about.md`, `notes.md`) and implementation (`impl/`) together. System-level apps that serve the entire repository belong in `apps/` at project root.

## Status

Expressions and Projection are the two active apps. Projection contains what were previously separate landing and dashboard apps.
