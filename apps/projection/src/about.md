# src/

Application source code for the Projection app.

## Structure

```
src/
├── app/           # Next.js App Router (pages and API routes)
├── components/    # React components
├── lib/           # Shared utilities and data loading
└── services/      # Business logic (dashboard, observation store)
```

## Conventions

- **Client components** are marked with `'use client'` at the top
- **Server components** handle data fetching in the app/ directory
- **API routes** live in `app/api/` following Next.js conventions
- Shared types and utilities go in `lib/`
- Business logic that talks to external services goes in `services/`
