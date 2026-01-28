# services/

Business logic layer for dashboard and observation management.

## Files

- **store.ts** - ObservationStore factory and database path resolution
- **dashboard.ts** - Dashboard status queries and CSV ingestion
- **index.ts** - Re-exports for convenient importing

## Architecture

Services encapsulate interactions with:
- The observation SQLite database (via `@numinous-systems/sensor`)
- Domain-specific parsers (via `@numinous-systems/finance`)

## Usage

```ts
import { getDashboardStatus, ingestChaseCSV } from '@/services'
```

## Database Location

The observation database lives at:
```
{workspaceRoot}/nodes/personal/observations.db
```

This file is gitignored as it contains personal data.
