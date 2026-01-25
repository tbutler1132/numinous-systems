#!/usr/bin/env node

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { ObservationStore, resolveDbPath } from "./index.js";

function findWorkspaceRoot(): string {
  let current = process.cwd();
  while (current !== "/") {
    if (
      existsSync(join(current, ".git")) ||
      existsSync(join(current, "package.json"))
    ) {
      return current;
    }
    current = resolve(current, "..");
  }
  return process.cwd();
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  } else {
    return "just now";
  }
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const node = args.includes("--node")
    ? args[args.indexOf("--node") + 1]
    : "private";

  const workspaceRoot = findWorkspaceRoot();
  const dbPath = resolveDbPath(workspaceRoot, node);

  if (!existsSync(dbPath)) {
    console.log(`No database found at ${dbPath}`);
    console.log("Run an ingest first to create the observation store.");
    return;
  }

  const store = await ObservationStore.create(dbPath);
  const status = store.getStatus();

  console.log(`\nSensor Status (${node})\n${"─".repeat(40)}`);

  if (status.domains.length === 0) {
    console.log("\nNo observations yet.");
  } else {
    for (const domain of status.domains) {
      console.log(`\n${domain.domain}`);
      console.log(`  Observations: ${domain.count.toLocaleString()}`);

      if (domain.minObserved && domain.maxObserved) {
        const minDate = formatDate(domain.minObserved);
        const maxDate = formatDate(domain.maxObserved);
        if (minDate === maxDate) {
          console.log(`  Coverage: ${minDate}`);
        } else {
          console.log(`  Coverage: ${minDate} – ${maxDate}`);
        }
      }

      if (domain.lastIngest) {
        const relTime = formatRelativeTime(domain.lastIngest.finishedAt);
        const date = new Date(domain.lastIngest.finishedAt);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        console.log(`  Last ingest: ${relTime} (${dateStr})`);
        console.log(`  Status: ${domain.lastIngest.status}`);
      } else {
        console.log(`  Last ingest: unknown`);
      }
    }
  }

  console.log("");
  store.close();
}

main().catch((err) => {
  console.error(`Error: ${err}`);
  process.exit(1);
});
