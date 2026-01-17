/**
 * Semantic history tracking for XenoScript.
 */

import type { HistoryEntry, SemanticNode, Value } from "./node.ts";

/**
 * Record a field update in history.
 */
export function recordUpdate(
  node: SemanticNode,
  field: string,
  oldValue: Value,
  newValue: Value
): HistoryEntry {
  const entry: HistoryEntry = {
    timestamp: new Date(),
    action: "updated",
    field,
    oldValue,
    newValue,
  };
  node.history.push(entry);
  return entry;
}

/**
 * Record a spawn event in history.
 */
export function recordSpawn(
  node: SemanticNode,
  childName: string
): HistoryEntry {
  const entry: HistoryEntry = {
    timestamp: new Date(),
    action: "spawned",
    note: `spawned ${childName}`,
  };
  node.history.push(entry);
  return entry;
}

/**
 * Get history entries for a node.
 */
export function getHistory(node: SemanticNode): HistoryEntry[] {
  return node.history;
}

/**
 * Format a history entry for display.
 */
export function formatHistoryEntry(
  entry: HistoryEntry,
  index: number
): string {
  const time = entry.timestamp.toISOString();
  switch (entry.action) {
    case "created":
      return `[${index}] ${time} — created`;
    case "updated":
      return `[${index}] ${time} — ${entry.field}: ${JSON.stringify(entry.oldValue)} → ${JSON.stringify(entry.newValue)}`;
    case "spawned":
      return `[${index}] ${time} — ${entry.note}`;
  }
}
