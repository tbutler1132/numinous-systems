# scripts/

Build-time scripts for data generation and CLI utilities.

## Build Scripts

### generateSurfaces.ts

Generates JSON data files from canonical markdown sources:

- **Input**: `nodes/org/artifacts/stages/` and `nodes/org/entities/surfaces.md`
- **Output**: `public/data/heros-journey.json` and `public/data/surfaces.json`

Run manually: `npm run generate`
Runs automatically before: `npm run dev` and `npm run build`

### lib.ts

Utilities for artifact reading and reference resolution:
- Reading about.md + page.md artifact structure
- Parsing markdown links and wiki links
- Resolving cross-references between artifacts
- Parsing markdown tables

## CLI Utilities

### dashboard-ingest.ts

Manual CSV ingestion from command line.

```bash
npx tsx scripts/dashboard-ingest.ts path/to/statement.csv
```

### dashboard-status.ts

Check observation database status.

```bash
npx tsx scripts/dashboard-status.ts
```

## Testing

```bash
npm run test
```

Runs `lib.test.ts` which tests the artifact parsing utilities.
