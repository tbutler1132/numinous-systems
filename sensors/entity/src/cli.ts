#!/usr/bin/env node

import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, join, basename } from "node:path";
import { ObservationStore, resolveDbPath } from "@numinous-systems/memory";
import { parseMarkdownTableContent } from "./parser.js";
import { listEntities } from "./derive.js";
import { formatMarkdownTable } from "./format.js";
import type { Observation } from "@numinous-systems/memory";
import type { EntityEventPayload } from "./types.js";

interface Options {
  node: string;
  dryRun: boolean;
}

function printUsage(): void {
  console.log(`
entity - Markdown tables to observation memory

Usage:
  entity ingest <path> [options]
  entity list <type> [options]
  entity project <type> [options]

Commands:
  ingest <path>    Ingest markdown table file (e.g., domains.md)
  list <type>      List current entities of a type (e.g., domain)
  project <type>   Output markdown table from derived entities

Options:
  --node <name>    Node name (default: "org")
  --dry-run        Parse only, no writes (ingest only)

Examples:
  entity ingest nodes/org/entities/domains.md
  entity ingest --dry-run nodes/org/entities/accounts.md
  entity list domain
  entity list account --node private
  entity project domain
`);
}

function parseArgs(args: string[]): {
  command: string | null;
  target: string | null;
  options: Options;
} {
  const options: Options = {
    node: "org",
    dryRun: false,
  };

  let command: string | null = null;
  let target: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--node") {
      options.node = args[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "ingest" || arg === "list" || arg === "project") {
      command = arg;
    } else if (!arg.startsWith("-") && command && !target) {
      target = arg;
    }
  }

  return { command, target, options };
}

function findWorkspaceRoot(): string {
  let current = process.cwd();
  while (current !== "/") {
    if (
      existsSync(join(current, ".git")) ||
      existsSync(join(current, "package.json"))
    ) {
      return current;
    }
    current = join(current, "..");
  }
  return process.cwd();
}

function ensureDataDirectory(dbPath: string): void {
  const dir = join(dbPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function runIngest(path: string, options: Options): Promise<void> {
  const absolutePath = resolve(path);

  if (!existsSync(absolutePath)) {
    console.error(`Error: File does not exist: ${path}`);
    process.exit(1);
  }

  const content = readFileSync(absolutePath, "utf8");
  const filename = basename(absolutePath);
  const workspaceRoot = findWorkspaceRoot();

  const parseResult = parseMarkdownTableContent(content, filename);

  console.log(`entity type: ${parseResult.entityType}`);
  console.log(`rows: ${parseResult.rowCount}`);

  if (options.dryRun) {
    console.log("(dry-run mode - no writes)");
    console.log(`would insert: ${parseResult.rowCount}`);
    if (parseResult.entities.length > 0) {
      console.log(`\nentities:`);
      for (const entity of parseResult.entities) {
        console.log(`  ${entity.key}`);
      }
    }
    return;
  }

  if (parseResult.entities.length === 0) {
    console.log("No entities found");
    return;
  }

  const dbPath = resolveDbPath(workspaceRoot, options.node);
  ensureDataDirectory(dbPath);

  const store = await ObservationStore.create(dbPath);
  const runId = store.startIngestRun(path, "entity");

  try {
    const ingestedAt = new Date().toISOString();
    const observedAt = ingestedAt.split("T")[0];

    const observations: Observation[] = parseResult.entities.map((entity) => {
      const payload: EntityEventPayload = {
        entity_type: parseResult.entityType,
        entity_key: entity.key,
        event_type: "registered",
        state: entity.state,
      };

      return {
        identity: {
          values: [parseResult.entityType, entity.key, observedAt, "registered"],
        },
        node_id: options.node,
        domain: "entity",
        source: "markdown_table",
        type: "event",
        observed_at: observedAt,
        schema_version: 1,
        payload,
        ingested_at: ingestedAt,
      };
    });

    const result = store.insertObservations(observations);

    store.finishIngestRun(runId, {
      rowsRead: parseResult.rowCount,
      rowsInserted: result.inserted,
      rowsSkipped: result.skipped,
      minObserved: observedAt,
      maxObserved: observedAt,
      status: "success",
    });

    console.log(`inserted: ${result.inserted}`);
    console.log(`skipped (duplicates): ${result.skipped}`);
    console.log(`run logged: ingest_runs.run_id = ${runId.substring(0, 8)}...`);

    for (const warning of result.warnings) {
      console.log(`warning: ${warning.message} at row ${warning.row}`);
    }
  } catch (err) {
    store.finishIngestRun(runId, {
      rowsRead: parseResult.rowCount,
      rowsInserted: 0,
      rowsSkipped: 0,
      minObserved: null,
      maxObserved: null,
      status: "failed",
    });
    throw err;
  } finally {
    store.close();
  }
}

async function runList(entityType: string, options: Options): Promise<void> {
  const workspaceRoot = findWorkspaceRoot();
  const dbPath = resolveDbPath(workspaceRoot, options.node);

  if (!existsSync(dbPath)) {
    console.error(`Error: No database found at ${dbPath}`);
    process.exit(1);
  }

  const store = await ObservationStore.create(dbPath);

  try {
    const entities = listEntities(store, entityType);

    if (entities.length === 0) {
      console.log(`No ${entityType} entities found`);
      return;
    }

    console.log(`${entityType} entities: ${entities.length}\n`);

    for (const entity of entities) {
      const status = entity.retired ? " [retired]" : "";
      console.log(`${entity.key}${status}`);
      console.log(`  first observed: ${entity.first_observed}`);
      console.log(`  last observed: ${entity.last_observed}`);
      for (const [key, value] of Object.entries(entity.state)) {
        if (key !== entityType) {
          console.log(`  ${key}: ${value}`);
        }
      }
      console.log();
    }
  } finally {
    store.close();
  }
}

async function runProject(entityType: string, options: Options): Promise<void> {
  const workspaceRoot = findWorkspaceRoot();
  const dbPath = resolveDbPath(workspaceRoot, options.node);

  if (!existsSync(dbPath)) {
    console.error(`Error: No database found at ${dbPath}`);
    process.exit(1);
  }

  const store = await ObservationStore.create(dbPath);

  try {
    const entities = listEntities(store, entityType);

    if (entities.length === 0) {
      console.log(`No ${entityType} entities found`);
      return;
    }

    // Filter out retired entities for projection
    const active = entities.filter((e) => !e.retired);
    const table = formatMarkdownTable(active);
    console.log(table);
  } finally {
    store.close();
  }
}

// Main
const args = process.argv.slice(2);
const { command, target, options } = parseArgs(args);

if (!command || !target) {
  printUsage();
  process.exit(1);
}

const run = async () => {
  switch (command) {
    case "ingest":
      await runIngest(target, options);
      break;
    case "list":
      await runList(target, options);
      break;
    case "project":
      await runProject(target, options);
      break;
    default:
      printUsage();
      process.exit(1);
  }
};

run().catch((err) => {
  console.error(`Error: ${err}`);
  process.exit(1);
});
