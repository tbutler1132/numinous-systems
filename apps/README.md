# Apps

Deployable applications live here. Each subdirectory is a standalone Vite/Vercel project.

## Current Apps

- **landing/** — Personal brand hub and entry point ([artifact docs](../nodes/org/artifacts/apps/landing/about.md))
- **expressions/** — Personalized philosophical artifacts powered by Claude ([artifact docs](../nodes/org/artifacts/apps/expressions/about.md))

## Structure

```
apps/
  landing/        # Vercel project root
  expressions/    # Vercel project root
```

Each app is a node-specific artifact. The narrative documentation lives at `nodes/org/artifacts/apps/{name}/about.md`, while the deployable code lives here.

## Philosophy

1. **Narrative separate from deployment** — Artifact docs describe *what* and *why*; this directory holds the *how*
2. **Simple CI/CD** — Standard `apps/*` layout plays well with Vercel and monorepo tooling
3. **Minimal viable scope** — Build the smallest thing that answers the core question
4. **Artifacts as source** — Apps consume artifact content, they don't duplicate it
