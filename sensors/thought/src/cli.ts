#!/usr/bin/env node

import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { ObservationStore, resolveDbPath } from "@numinous-systems/memory";
import { parseInboxContent } from "./inbox-parser.js";
import { thoughtEntryFingerprint } from "./fingerprint.js";
import type { ThoughtEntryPayload } from "./types.js";
import type { Observation } from "@numinous-systems/memory";

interface IngestOptions {
  node: string;
  dryRun: boolean;
  stdin: boolean;
}

function printUsage(): void {
  console.log(`
thought - Inbox markdown to observation memory

Usage:
  thought ingest <path> [options]
  thought ingest --stdin [options]

Commands:
  ingest <path>    Ingest inbox.md file from path
  ingest --stdin   Read content from stdin

Options:
  --node <name>    Node name (default: "private")
  --dry-run        Parse only, no writes

Examples:
  thought ingest nodes/inbox.md
  thought ingest --node private nodes/inbox.md
  thought ingest --dry-run nodes/inbox.md
  cat nodes/inbox.md | thought ingest --stdin
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
    stdin: false,
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
    } else if (arg === "--stdin") {
      options.stdin = true;
    } else if (arg === "ingest") {
      command = "ingest";
    } else if (!arg.startsWith("-") && command === "ingest" && !path) {
      path = arg;
    }
  }

  return { command, path, options };
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function ensureDataDirectory(dbPath: string): void {
  const dir = join(dbPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function runIngest(
  inputPath: string | null,
  options: IngestOptions
): Promise<void> {
  // Get content
  let content: string;
  let filename: string;

  if (options.stdin) {
    content = await readStdin();
    filename = "stdin";
  } else if (inputPath) {
    const absolutePath = resolve(inputPath);
    if (!existsSync(absolutePath)) {
      console.error(`Error: File does not exist: ${inputPath}`);
      process.exit(1);
    }
    content = readFileSync(absolutePath, "utf8");
    filename = basename(absolutePath);
  } else {
    console.error("Error: Must provide a file path or use --stdin");
    process.exit(1);
  }

  // Find workspace root
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

  // Parse content
  const parseResult = parseInboxContent(content);

  console.log(`entries: ${parseResult.entryCount}`);

  if (options.dryRun) {
    console.log("(dry-run mode - no writes)");
    console.log(`would insert: ${parseResult.entryCount}`);
    if (parseResult.minObserved && parseResult.maxObserved) {
      console.log(
        `date range: ${parseResult.minObserved} to ${parseResult.maxObserved}`
      );
    }
    return;
  }

  if (parseResult.entries.length === 0) {
    console.log("No entries found");
    return;
  }

  // Initialize store
  const dbPath = resolveDbPath(workspaceRoot, options.node);
  ensureDataDirectory(dbPath);

  const store = await ObservationStore.create(dbPath);

  // Start ingest run
  const runId = store.startIngestRun(filename, "thought");

  try {
    const ingestedAt = new Date().toISOString();

    // Convert entries to observations
    const observations: Observation[] = parseResult.entries.map((entry) => {
      const payload: ThoughtEntryPayload = {
        text: entry.text,
        text_normalized: entry.text_normalized,
        tags: entry.tags,
        week_context: entry.week_context,
      };

      return {
        id: thoughtEntryFingerprint(entry.text_normalized),
        node_id: options.node,
        domain: "thought",
        source: "inbox_md",
        type: "entry",
        observed_at: entry.observed_at,
        schema_version: 1,
        payload,
        ingested_at: ingestedAt,
      };
    });

    // Insert observations
    const result = store.insertObservations(observations);

    // Finish ingest run
    store.finishIngestRun(runId, {
      rowsRead: parseResult.entryCount,
      rowsInserted: result.inserted,
      rowsSkipped: result.skipped,
      minObserved: parseResult.minObserved,
      maxObserved: parseResult.maxObserved,
      status: "success",
    });

    console.log(`inserted: ${result.inserted}`);
    console.log(`skipped (duplicates): ${result.skipped}`);

    if (parseResult.minObserved && parseResult.maxObserved) {
      console.log(
        `date range: ${parseResult.minObserved} to ${parseResult.maxObserved}`
      );
    }

    console.log(`run logged: ingest_runs.run_id = ${runId.substring(0, 8)}...`);

    // Print warnings
    for (const warning of result.warnings) {
      console.log(`warning: ${warning.message} at row ${warning.row}`);
    }
  } catch (err) {
    store.finishIngestRun(runId, {
      rowsRead: parseResult.entryCount,
      rowsInserted: 0,
      rowsSkipped: 0,
      minObserved: parseResult.minObserved,
      maxObserved: parseResult.maxObserved,
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

if (!command || command !== "ingest" || (!path && !options.stdin)) {
  printUsage();
  process.exit(1);
}

runIngest(path, options).catch((err) => {
  console.error(`Error: ${err}`);
  process.exit(1);
});
