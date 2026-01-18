# sensors/

Domain-specific sensors that convert external data into normalized observations.

## Philosophy

Sensors are the input organs of the system. Each sensor:

1. **Reads** a specific external data format (CSV, API, markdown)
2. **Normalizes** it into the universal `Observation` schema
3. **Fingerprints** each observation deterministically (for idempotency)
4. **Stores** observations in the shared SQLite memory layer

Sensors don't analyze, score, or recommend. They observe.

## Available Sensors

| Sensor | Domain | Input | Description |
|--------|--------|-------|-------------|
| `finance` | `finance` | Chase CSV | Bank transactions → observations |
| `thought` | `thought` | inbox.md | Interactive inbox processing → observations |

## Architecture

```
sensors/                    # Domain-specific implementations
  finance/                  # Chase CSV → finance observations
  thought/                  # inbox.md → thought observations

core/sensor/                # Shared infrastructure
  - ObservationStore        # SQLite persistence
  - fingerprint()           # Hash generation
  - resolveDbPath()         # Node path resolution
```

Each sensor depends on `@numinous-systems/sensor` for:
- The `Observation` type
- Generic `fingerprint()` and `sourceRowHash()` functions
- `ObservationStore` for persistence
- `resolveDbPath()` for locating the database

## Sensor Pattern

All sensors follow the same structure:

```
sensors/<domain>/
  src/
    types.ts        # Domain-specific payload types
    fingerprint.ts  # Domain fingerprint using generic fingerprint()
    <parser>.ts     # Parse raw format into observations
    cli.ts          # CLI interface
  package.json      # Depends on @numinous-systems/sensor
  README.md         # Usage and examples
```

### 1. Define types

```typescript
// types.ts
export interface MyDomainPayload extends Record<string, unknown> {
  field1: string;
  field2: number;
}
```

### 2. Create fingerprint function

```typescript
// fingerprint.ts
import { fingerprint } from "@numinous-systems/sensor";

export function myDomainFingerprint(params: {...}): string {
  return fingerprint([
    "my_domain",
    "my_source",
    "my_type",
    // ...semantic fields that define uniqueness
  ]);
}
```

### 3. Build parser

```typescript
// parser.ts
import type { Observation } from "@numinous-systems/sensor";
import { myDomainFingerprint } from "./fingerprint.js";

export function parseMyFormat(input: string): Observation[] {
  // Parse raw input
  // Generate fingerprints
  // Return observations
}
```

### 4. Wire up CLI

```typescript
// cli.ts
import { ObservationStore, resolveDbPath } from "@numinous-systems/sensor";

// Parse args, run parser, insert observations
```

## Adding a New Sensor

1. Create directory: `sensors/<domain>/`
2. Set up `package.json` with `@numinous-systems/sensor` dependency
3. Implement the sensor pattern (types → fingerprint → parser → CLI)
4. Add README with usage instructions
5. Document in this file

## Usage Examples

```bash
# Finance: ingest Chase CSV
npx finance ingest nodes/personal/raw/finance/chase/

# Thought: process inbox interactively
npx thought process
```

## Data Flow

```
Raw Data              Sensor                    Observation Store
─────────────────────────────────────────────────────────────────

Chase CSV    →   sensors/finance   →   nodes/personal/data/observations.db
                       │
                       └─ Parses, normalizes, fingerprints

inbox.md     →   sensors/thought   →   nodes/personal/data/observations.db
                       │
                       └─ Interactive tagging, fingerprints

(future)
Oura API     →   sensors/health    →   ...
Calendar     →   sensors/time      →   ...
```

## Testing

Each sensor has its own tests:

```bash
cd sensors/finance && npm test
cd sensors/thought && npm test
```

## Related

- `core/sensor/` — shared observation infrastructure
- `nodes/personal/data/observations.db` — where observations are stored
- `nodes/inbox.md` — input for thought sensor
