#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { ObservationStore, resolveDbPath } from "@numinous-systems/memory";
import { parseChaseCSV, type ParseResult } from "./chase-csv.js";

interface IngestOptions {
  node: string;
  dryRun: boolean;
  accountLabel: string;
}

function printUsage(): void {
  console.log(`
finance - Chase CSV to observation memory

Usage:
  finance ingest <path> [options]

Commands:
  ingest <path>    Ingest CSV files from path (file or directory)

Options:
  --node <name>         Node name (default: "private")
  --dry-run             Parse only, no writes
  --account-label <l>   Account label (default: "checking")

Examples:
  finance ingest nodes/org/private/raw/finance/chase-credit/
  finance ingest --node private --account-label savings statement.csv
  finance ingest --dry-run nodes/org/private/raw/finance/chase-credit/
`);
}

function parseArgs(args: string[]): {
  command: string | null;
  path: string | null;
  options: IngestOptions;
} {
  const options: IngestOptions = {
    node: "private",
    dryRun: false,
    accountLabel: "checking",
  };

  let command: string | null = null;
  let path: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--node") {
      options.node = args[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--account-label") {
      options.accountLabel = args[++i];
    } else if (arg === "ingest") {
      command = "ingest";
    } else if (!arg.startsWith("-") && command === "ingest" && !path) {
      path = arg;
    }
  }

  return { command, path, options };
}

function findCSVFiles(inputPath: string): string[] {
  const absolutePath = resolve(inputPath);

  if (!existsSync(absolutePath)) {
    console.error(`Error: Path does not exist: ${inputPath}`);
    process.exit(1);
  }

  const stat = statSync(absolutePath);

  if (stat.isFile()) {
    if (absolutePath.toLowerCase().endsWith(".csv")) {
      return [absolutePath];
    } else {
      console.error(`Error: File is not a CSV: ${inputPath}`);
      process.exit(1);
    }
  }

  if (stat.isDirectory()) {
    const files = readdirSync(absolutePath)
      .filter((f) => f.toLowerCase().endsWith(".csv"))
      .map((f) => join(absolutePath, f));

    if (files.length === 0) {
      console.error(`Error: No CSV files found in: ${inputPath}`);
      process.exit(1);
    }

    return files;
  }

  return [];
}

function ensureDataDirectory(dbPath: string): void {
  const dir = join(dbPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function runIngest(
  inputPath: string,
  options: IngestOptions
): Promise<void> {
  // Find workspace root (look for package.json or .git)
  let workspaceRoot = process.cwd();
  let current = workspaceRoot;
  while (current !== "/") {
    if (
      existsSync(join(current, ".git")) ||
      existsSync(join(current, "package.json"))
    ) {
      workspaceRoot = current;
      break;
    }
    current = join(current, "..");
  }

  const csvFiles = findCSVFiles(inputPath);

  console.log(`files: ${csvFiles.length}`);

  if (options.dryRun) {
    console.log("(dry-run mode - no writes)");
  }

  // Aggregate results across all files
  let totalRowsRead = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let globalMinObserved: string | null = null;
  let globalMaxObserved: string | null = null;
  const allWarnings: Array<{ file: string; row: number; message: string }> = [];

  // Parse all files
  const parseResults: Array<{ file: string; result: ParseResult }> = [];

  for (const file of csvFiles) {
    try {
      const result = parseChaseCSV(file, {
        accountLabel: options.accountLabel,
      });

      parseResults.push({ file, result });
      totalRowsRead += result.rowCount;

      // Track global date range
      if (result.minObserved) {
        if (!globalMinObserved || result.minObserved < globalMinObserved) {
          globalMinObserved = result.minObserved;
        }
      }
      if (result.maxObserved) {
        if (!globalMaxObserved || result.maxObserved > globalMaxObserved) {
          globalMaxObserved = result.maxObserved;
        }
      }
    } catch (err) {
      console.error(`Error parsing ${basename(file)}: ${err}`);
    }
  }

  console.log(`rows read: ${totalRowsRead}`);

  if (options.dryRun) {
    // In dry-run mode, just count what would be inserted
    const allObservations = parseResults.flatMap((p) => p.result.observations);
    console.log(`would insert: ${allObservations.length}`);
    if (globalMinObserved && globalMaxObserved) {
      console.log(`date range: ${globalMinObserved} to ${globalMaxObserved}`);
    }
    return;
  }

  // Initialize store
  const dbPath = resolveDbPath(workspaceRoot, options.node);
  ensureDataDirectory(dbPath);

  const store = await ObservationStore.create(dbPath);

  // Start ingest run
  const runId = store.startIngestRun(inputPath, "finance");

  try {
    // Insert observations from all files
    for (const { file, result } of parseResults) {
      // Source row hashes are in observation payloads; store extracts them automatically
      const appendResult = store.insertObservations(result.observations);

      totalInserted += appendResult.inserted;
      totalSkipped += appendResult.skipped;

      // Collect warnings
      for (const warning of appendResult.warnings) {
        allWarnings.push({
          file: basename(file),
          row: warning.row,
          message: warning.message,
        });
      }
    }

    // Finish ingest run
    store.finishIngestRun(runId, {
      rowsRead: totalRowsRead,
      rowsInserted: totalInserted,
      rowsSkipped: totalSkipped,
      minObserved: globalMinObserved,
      maxObserved: globalMaxObserved,
      status: "success",
    });

    console.log(`inserted: ${totalInserted}`);
    console.log(`skipped (duplicates): ${totalSkipped}`);

    if (globalMinObserved && globalMaxObserved) {
      console.log(`date range: ${globalMinObserved} to ${globalMaxObserved}`);
    }

    console.log(`run logged: ingest_runs.run_id = ${runId.substring(0, 8)}...`);

    // Print warnings
    for (const warning of allWarnings) {
      console.log(`warning: ${warning.message} at ${warning.file}:${warning.row}`);
    }
  } catch (err) {
    store.finishIngestRun(runId, {
      rowsRead: totalRowsRead,
      rowsInserted: totalInserted,
      rowsSkipped: totalSkipped,
      minObserved: globalMinObserved,
      maxObserved: globalMaxObserved,
      status: "failed",
    });
    throw err;
  } finally {
    store.close();
  }
}

// Main
const args = process.argv.slice(2);
const { command, path, options } = parseArgs(args);

if (!command || command !== "ingest" || !path) {
  printUsage();
  process.exit(1);
}

runIngest(path, options).catch((err) => {
  console.error(`Error: ${err}`);
  process.exit(1);
});
