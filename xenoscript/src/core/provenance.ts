/**
 * Provenance tracking for XenoScript.
 * Provenance is descriptive, not moral.
 */

import type { Provenance, SemanticNode } from "./node.ts";

/**
 * Get the provenance symbol for display.
 */
export function provenanceSymbol(provenance: Provenance): string {
  switch (provenance) {
    case "organic":
      return "◉";
    case "synthetic":
      return "○";
    case "hybrid":
      return "◐";
    case "unknown":
      return "◌";
  }
}

/**
 * Determine provenance for a spawned node.
 * Spawned nodes are synthetic by default.
 */
export function spawnProvenance(_parent: SemanticNode): Provenance {
  return "synthetic";
}

/**
 * Determine provenance after a modification.
 * If an organic node is modified synthetically, it becomes hybrid.
 */
export function modifyProvenance(
  current: Provenance,
  modifierIsOrganic: boolean
): Provenance {
  if (modifierIsOrganic) {
    return current; // Organic modifications preserve provenance
  }

  switch (current) {
    case "organic":
      return "hybrid"; // Organic + synthetic = hybrid
    case "synthetic":
      return "synthetic"; // Stays synthetic
    case "hybrid":
      return "hybrid"; // Stays hybrid
    case "unknown":
      return "synthetic"; // Unknown + synthetic = synthetic
  }
}

/**
 * Calculate aggregate provenance for a set of nodes.
 */
export function aggregateProvenance(nodes: SemanticNode[]): Provenance {
  if (nodes.length === 0) return "unknown";

  const hasOrganic = nodes.some((n) => n.provenance === "organic");
  const hasSynthetic = nodes.some(
    (n) => n.provenance === "synthetic" || n.provenance === "hybrid"
  );

  if (hasOrganic && hasSynthetic) return "hybrid";
  if (hasOrganic) return "organic";
  if (hasSynthetic) return "synthetic";
  return "unknown";
}
