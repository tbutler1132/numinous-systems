---
title: Atrium
status: active
category: home
relates_to:
  - projection
created: 2026-01-18
updated: 2026-01-29
implementation: /apps/projection/src/app/page.tsx
about: |
  # Home (Atrium)
  
  ## Artifact Concept
  
  This is the **home artifact** for the org node — the default entry point when visiting this node.
  
  Every node has a `home` artifact. It serves as the front door, the first thing encountered when someone visits. For the org node, this home is called the "Atrium."
  
  ## What This Artifact IS
  
  - The default entry point for the node
  - A minimal surface presenting identity and navigation
  - The canonical place to encounter the node's presence
  
  ## What This Artifact Is NOT
  
  - A portfolio or content dump
  - A blog or feed
  - An app with complex functionality
  
  ## Design Principles
  
  - **Restraint** — show only what matters
  - **Beauty** — the first impression should resonate
  - **Navigation** — clear pathways to actual work
  
  ## Implementation
  
  The home artifact renders at the root path (`/`) within the Projection app. Implementation lives at `apps/projection/src/app/page.tsx` and reads from `page.md` in this folder.
  
  ## Node Pattern
  
  This artifact follows the node home convention:
  - Every node MUST have an `artifacts/home/` folder
  - The home artifact MUST have `about.md` and `page.md`
  - A corresponding surface entry MUST exist in `entities/surfaces.md`
  
  See `nodes/about.md` for the full specification.
---

Timothy Butler
