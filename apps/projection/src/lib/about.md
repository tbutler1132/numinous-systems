# lib/

Shared utilities and data loading functions.

## Files

- **auth.ts** - Token-based authentication utilities (validation, cookies, timing-safe comparison)
- **data.ts** - Data loading for surfaces and Hero's Journey artifacts from generated JSON
- **workspace.ts** - Monorepo root detection for path resolution

## Usage Pattern

These utilities are imported throughout the app:

```ts
import { isAuthenticated, isValidToken } from '@/lib/auth'
import { getSurfaces, getHerosJourney } from '@/lib/data'
import { findWorkspaceRoot } from '@/lib/workspace'
```

## Notes

- `data.ts` types (Surface, Artifact) may eventually move to shared packages if other apps need them
- Auth utilities use timing-safe comparison to prevent timing attacks
