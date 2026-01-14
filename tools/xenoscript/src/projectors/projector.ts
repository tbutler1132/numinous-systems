/**
 * Projector interface for XenoScript.
 * 
 * A projection is a lawful mapping: SemanticGraph → Artifact
 * Projections must declare their lossiness.
 */

import type { SemanticGraph } from "../core/graph.ts";
import type { SemanticNode } from "../core/node.ts";

export interface ProjectionResult {
  output: string;
  lossiness: "lossless" | "lossy";
  discardedFields?: string[];
  discardedEdges?: string[];
}

export interface Projector {
  name: string;
  description: string;
  lossiness: "lossless" | "lossy";
  
  /**
   * Project a node (and optionally its descendants) into an artifact.
   */
  project(graph: SemanticGraph, nodeId: string): ProjectionResult;
}

/**
 * Registry of available projectors.
 */
const projectors: Map<string, Projector> = new Map();

/**
 * Register a projector.
 */
export function registerProjector(projector: Projector): void {
  projectors.set(projector.name, projector);
}

/**
 * Get a projector by name.
 */
export function getProjector(name: string): Projector | undefined {
  return projectors.get(name);
}

/**
 * List all registered projectors.
 */
export function listProjectors(): Projector[] {
  return Array.from(projectors.values());
}

/**
 * Format a node for display in projections.
 */
export function formatNodeCompact(node: SemanticNode): string {
  const horizon = node.fields.horizon ?? "?";
  return `${node.name} [h${horizon}]`;
}
