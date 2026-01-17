#!/usr/bin/env node

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as readline from "node:readline";
import { ObservationStore, resolveDbPath } from "@vital-systems/sensor";
import { parseInbox, getDisplayText } from "./inbox-parser.js";
import { updateInbox, type ItemToMark } from "./inbox-writer.js";
import { thoughtFingerprint } from "./fingerprint.js";
import type { InboxItem, ValidTag, ProcessResult } from "./types.js";
import { VALID_TAGS } from "./types.js";

interface ProcessOptions {
  node: string;
  dryRun: boolean;
  inboxPath: string;
}

function printUsage(): void {
  console.log(`
thought - Process inbox items into observation memory

Usage:
  thought process [options]

Commands:
  process    Interactively process inbox items

Options:
  --node <name>      Node name (default: "personal")
  --inbox <path>     Path to inbox.md (default: nodes/inbox.md)
  --dry-run          Parse only, no writes

Examples:
  thought process
  thought process --node personal
  thought process --dry-run
  thought process --inbox nodes/work/inbox.md
`);
}

function parseArgs(args: string[]): {
  command: string | null;
  options: ProcessOptions;
} {
  const options: ProcessOptions = {
    node: "personal",
    dryRun: false,
    inboxPath: "",
  };

  let command: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (arg === "--node") {
      options.node = args[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--inbox") {
      options.inboxPath = args[++i];
    } else if (arg === "process") {
      command = "process";
    }
  }

  return { command, options };
}

function findWorkspaceRoot(): string {
  let current = process.cwd();
  // Look for .git first (the actual repo root)
  while (current !== "/") {
    if (existsSync(join(current, ".git"))) {
      return current;
    }
    current = join(current, "..");
  }
  // Fall back to cwd if no .git found
  return process.cwd();
}

function ensureDataDirectory(dbPath: string): void {
  const dir = join(dbPath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Prompt for a single keypress.
 */
function promptKey(rl: readline.Interface): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.once("data", (data) => {
      if (stdin.isTTY && wasRaw !== undefined) {
        stdin.setRawMode(wasRaw);
      }
      const key = data.toString();
      // Handle Ctrl+C
      if (key === "\x03") {
        console.log("\nAborted.");
        process.exit(1);
      }
      resolve(key.toLowerCase());
    });
  });
}

/**
 * Display an item and get user's choice.
 */
async function promptForItem(
  rl: readline.Interface,
  item: InboxItem,
  index: number,
  total: number,
  isDuplicate: boolean
): Promise<ProcessResult> {
  const displayText = getDisplayText(item, 70);

  console.log("");
  console.log(`[${index + 1}/${total}] "${displayText}"`);

  // Show sub-bullets if present
  const lines = item.content.split("\n");
  if (lines.length > 1) {
    for (let i = 1; i < Math.min(lines.length, 4); i++) {
      console.log(`       ${lines[i]}`);
    }
    if (lines.length > 4) {
      console.log(`       ... (${lines.length - 4} more lines)`);
    }
  }

  if (item.isProcessed) {
    console.log("");
    console.log("  ✓ Already processed (auto-skipping)");
    return { action: "duplicate" };
  }

  if (isDuplicate) {
    console.log("");
    console.log("  ⚠ Already in store (auto-skipping)");
    return { action: "duplicate" };
  }

  if (item.suggestedTag) {
    console.log(`       Suggested: ${item.suggestedTag}`);
  }

  console.log("");
  for (const tag of VALID_TAGS) {
    const shortcut = tag[0];
    const marker = item.suggestedTag === tag ? "  <--" : "";
    console.log(`  (${shortcut}) ${tag}${marker}`);
  }
  console.log(`  (s) skip`);
  console.log(`  (d) delete`);
  console.log(`  (x) exit & save`);
  console.log("");
  process.stdout.write("> ");

  while (true) {
    const key = await promptKey(rl);

    // Check for enter key - use suggested tag
    if (key === "\r" || key === "\n") {
      if (item.suggestedTag) {
        console.log(item.suggestedTag[0]);
        return { action: "saved", tag: item.suggestedTag };
      }
      // No suggested tag, need explicit choice
      continue;
    }

    // Check for tag shortcuts
    for (const tag of VALID_TAGS) {
      if (key === tag[0]) {
        console.log(key);
        return { action: "saved", tag };
      }
    }

    if (key === "s") {
      console.log(key);
      return { action: "skipped" };
    }

    if (key === "d") {
      console.log(key);
      return { action: "deleted" };
    }

    if (key === "x") {
      console.log(key);
      return { action: "exit" };
    }

    // Invalid key, wait for valid input
  }
}

async function runProcess(options: ProcessOptions): Promise<void> {
  const workspaceRoot = findWorkspaceRoot();

  // Determine inbox path
  const inboxPath = options.inboxPath || join(workspaceRoot, "nodes", "inbox.md");

  if (!existsSync(inboxPath)) {
    console.error(`Error: Inbox not found: ${inboxPath}`);
    process.exit(1);
  }

  // Parse inbox
  const { items, originalContent } = parseInbox(inboxPath);

  if (items.length === 0) {
    console.log("No items to process.");
    return;
  }

  console.log(`Processing inbox: ${items.length} items found`);

  if (options.dryRun) {
    console.log("(dry-run mode - no writes)");
    console.log("");
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const displayText = getDisplayText(item, 70);
      const tagInfo = item.suggestedTag ? ` [${item.suggestedTag}]` : "";
      console.log(`  ${i + 1}. ${displayText}${tagInfo}`);
    }
    return;
  }

  // Initialize store for duplicate checking
  const dbPath = resolveDbPath(workspaceRoot, options.node);
  ensureDataDirectory(dbPath);
  const store = await ObservationStore.create(dbPath);

  // Set up readline for interactive prompts
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Track results
  const itemsToMark: ItemToMark[] = [];
  const itemsToDelete: InboxItem[] = [];
  let savedCount = 0;
  let deletedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;

  // Observations to insert (batch at end)
  const observationsToInsert: Array<{
    item: InboxItem;
    tag: ValidTag;
  }> = [];

  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check for duplicate
      const id = thoughtFingerprint(item.content);
      const existing = store.queryObservations({ domain: "thought", limit: 1 });
      const isDuplicate = existing.some((obs) => obs.id === id);

      const result = await promptForItem(rl, item, i, items.length, isDuplicate);

      switch (result.action) {
        case "saved":
          console.log(`✓ Saved: ${result.tag}`);
          observationsToInsert.push({ item, tag: result.tag });
          itemsToMark.push({ item, tag: result.tag });
          savedCount++;
          break;

        case "deleted":
          console.log("✗ Deleted");
          itemsToDelete.push(item);
          deletedCount++;
          break;

        case "skipped":
          console.log("→ Skipped");
          skippedCount++;
          break;

        case "duplicate":
          duplicateCount++;
          // Already processed or in store - leave as is
          break;

        case "exit":
          console.log("→ Exiting early, saving progress...");
          break;
      }

      // Break out of loop if user chose to exit
      if (result.action === "exit") {
        break;
      }
    }

    // Insert all observations
    if (observationsToInsert.length > 0) {
      const now = new Date().toISOString();

      for (const { item, tag } of observationsToInsert) {
          store.insertObservations(
          [
            {
              id: thoughtFingerprint(item.content),
              observed_at: now,
              domain: "thought",
              source: "inbox",
              type: "entry",
              schema_version: 1,
              payload: {
                content: item.content,
                tags: [tag],
              },
              ingested_at: now,
            },
          ],
          { saveOnInsert: false }
        );
      }

      // Save once at end
      store.save();
    }

    // Update inbox: mark saved items, delete deleted items
    const removalResult = updateInbox(inboxPath, originalContent, itemsToMark, itemsToDelete);

    // Print summary
    console.log("");
    if (!removalResult.success) {
      console.log(`⚠ Warning: ${removalResult.error}`);
      console.log("  Observations were saved, but inbox was not modified.");
      console.log("  You may need to manually remove processed items.");
    } else {
      console.log("Done.");
      if (removalResult.backupPath) {
        console.log(`  Backup: ${removalResult.backupPath}`);
      }
    }
    console.log(`  Saved: ${savedCount}`);
    console.log(`  Deleted: ${deletedCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    if (duplicateCount > 0) {
      console.log(`  Duplicates: ${duplicateCount}`);
    }
  } finally {
    rl.close();
    store.close();
  }
}

// Main
const args = process.argv.slice(2);
const { command, options } = parseArgs(args);

if (!command || command !== "process") {
  printUsage();
  process.exit(1);
}

runProcess(options).catch((err) => {
  console.error(`Error: ${err}`);
  process.exit(1);
});
