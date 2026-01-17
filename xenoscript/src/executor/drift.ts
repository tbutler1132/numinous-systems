/**
 * Drift detection for XenoScript.
 */

import type { DriftResult, SemanticGraph } from "../core/graph.ts";

export interface DriftWarning {
  nodeId: string;
  nodeName: string;
  driftResult: DriftResult;
  requiresConfirmation: boolean;
}

/**
 * Check if a drift result requires user confirmation.
 */
export function requiresConfirmation(driftResult: DriftResult): boolean {
  return driftResult.driftClass === "telic";
}

/**
 * Format a drift warning for display.
 */
export function formatDriftWarning(warning: DriftWarning): string {
  const { nodeName, driftResult } = warning;
  const lines: string[] = [];

  lines.push("⚠ telic drift detected");
  lines.push("");
  lines.push(`  old: ${JSON.stringify(driftResult.oldValue)}`);
  lines.push(`  new: ${JSON.stringify(driftResult.newValue)}`);
  lines.push("");
  lines.push(`  This changes the core intent of ${nodeName}.`);
  lines.push("");
  lines.push("  proceed? (y/n/explain)");

  return lines.join("\n");
}

/**
 * Analyze drift across the entire graph.
 */
export function analyzeGraphDrift(graph: SemanticGraph): DriftWarning[] {
  const warnings: DriftWarning[] = [];

  // For now, just return empty - full drift analysis would compare
  // against a baseline or previous snapshot
  void graph; // Mark as used

  return warnings;
}

/**
 * Classify a set of changes.
 */
export function summarizeDrift(warnings: DriftWarning[]): string {
  const telic = warnings.filter((w) => w.driftResult.driftClass === "telic").length;
  const structural = warnings.filter((w) => w.driftResult.driftClass === "structural").length;
  const cosmetic = warnings.filter((w) => w.driftResult.driftClass === "cosmetic").length;

  const lines: string[] = [];
  lines.push(`${telic} telic drift${telic !== 1 ? "s" : ""}`);
  lines.push(`${structural} structural change${structural !== 1 ? "s" : ""}`);
  lines.push(`${cosmetic} cosmetic update${cosmetic !== 1 ? "s" : ""}`);

  return lines.join("\n");
}
