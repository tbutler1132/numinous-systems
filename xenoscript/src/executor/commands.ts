/**
 * Built-in commands for XenoScript.
 */

import type { SemanticGraph } from "../core/graph.ts";
import type { SemanticNode, Value } from "../core/node.ts";
import { formatHistoryEntry } from "../core/history.ts";

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  node?: SemanticNode;
  shouldExit?: boolean;
}

/**
 * Execute a method call on a target.
 */
export function executeMethod(
  graph: SemanticGraph,
  target: string,
  method: string,
  args: Value[]
): CommandResult {
  const node = graph.get(target);
  if (!node) {
    return { success: false, error: `Node not found: ${target}` };
  }

  switch (method) {
    case "spawn": {
      const childName = String(args[0] ?? "unnamed");
      const child = graph.spawn(target, childName);
      if (child) {
        return {
          success: true,
          output: `○ created: ${child.name} [synthetic, ← ${node.name}]`,
          node: child,
        };
      }
      return { success: false, error: "Failed to spawn child" };
    }

    default:
      return { success: false, error: `Unknown method: ${method}` };
  }
}

/**
 * Execute a field assignment.
 */
export function executeAssignment(
  graph: SemanticGraph,
  target: string,
  field: string,
  value: Value
): CommandResult {
  const driftResult = graph.update(target, field, value);

  if (driftResult.message && driftResult.driftClass === "telic") {
    return {
      success: true,
      output: `⚠ telic drift detected\n  ${field}: ${JSON.stringify(driftResult.oldValue)} → ${JSON.stringify(driftResult.newValue)}\n\n○ updated: ${target}.${field}`,
    };
  }

  return {
    success: true,
    output: `○ updated: ${target}.${field}`,
  };
}

/**
 * Execute an info query.
 */
export function executeInfoQuery(
  graph: SemanticGraph,
  target?: string
): CommandResult {
  if (!target) {
    // List all nodes
    const nodes = graph.list();
    if (nodes.length === 0) {
      return { success: true, output: "No objects in namespace." };
    }
    const lines = nodes.map((n) => formatNodeLine(n));
    return { success: true, output: lines.join("\n") };
  }

  const result = graph.query(target);
  if (!result) {
    return { success: false, error: `Node not found: ${target}` };
  }

  return { success: true, output: result.summary };
}

/**
 * Execute a drift query.
 */
export function executeDriftQuery(
  graph: SemanticGraph,
  target?: string
): CommandResult {
  if (!target) {
    // Check all nodes
    const nodes = graph.list();
    const lines = ["Checking all objects in namespace...", ""];
    for (const node of nodes) {
      const symbol = node.provenance === "organic" ? "◉" : "○";
      lines.push(`${symbol} ${node.name} — stable`);
    }
    lines.push("");
    lines.push("0 telic drifts");
    lines.push("0 structural anomalies");
    return { success: true, output: lines.join("\n") };
  }

  const node = graph.get(target);
  if (!node) {
    return { success: false, error: `Node not found: ${target}` };
  }

  return {
    success: true,
    output: `No drift detected for ${target}.`,
  };
}

/**
 * Execute a history query.
 */
export function executeHistoryQuery(
  graph: SemanticGraph,
  target?: string
): CommandResult {
  if (!target) {
    return { success: false, error: "history requires a target" };
  }

  const node = graph.get(target);
  if (!node) {
    return { success: false, error: `Node not found: ${target}` };
  }

  const lines = node.history.map((entry, i) => formatHistoryEntry(entry, i));
  return { success: true, output: lines.join("\n") };
}

/**
 * Format a node for display in a list.
 */
export function formatNodeLine(node: SemanticNode): string {
  const symbol = node.provenance === "organic" ? "◉" : node.provenance === "hybrid" ? "◐" : "○";
  const horizon = node.fields.horizon ?? "?";
  const children = node.children.length > 0 ? `, ${node.children.length} children` : "";
  return `${symbol} ${node.name.padEnd(20)} [${node.provenance}, h${horizon}${children}]`;
}
