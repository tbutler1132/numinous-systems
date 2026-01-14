/**
 * Graph projector for XenoScript.
 * 
 * Projects a semantic graph into ASCII visualization.
 * Lossless: preserves nodes and edges.
 */

import type { SemanticGraph } from "../core/graph.ts";
import type { SemanticNode } from "../core/node.ts";
import { type ProjectionResult, type Projector, registerProjector } from "./projector.ts";

const graphProjector: Projector = {
  name: "graph",
  description: "Project as visual graph",
  lossiness: "lossless",

  project(graph: SemanticGraph, nodeId: string): ProjectionResult {
    const node = graph.get(nodeId);
    if (!node) {
      return {
        output: `Node not found: ${nodeId}`,
        lossiness: "lossless",
      };
    }

    const lines: string[] = [];
    
    // Build tree structure
    renderNode(graph, node, lines, "", true);

    return {
      output: lines.join("\n"),
      lossiness: "lossless",
    };
  },
};

function renderNode(
  graph: SemanticGraph,
  node: SemanticNode,
  lines: string[],
  prefix: string,
  isRoot: boolean
): void {
  const provSymbol = node.provenance === "organic" ? "◉" : 
                     node.provenance === "hybrid" ? "◐" : "○";
  const horizon = node.fields.horizon ?? "?";
  const label = `[${node.name}]`;
  const meta = `${provSymbol} h${horizon}`;

  if (isRoot) {
    lines.push(`  ${label} ${meta}`);
  }

  if (node.children.length > 0) {
    for (let i = 0; i < node.children.length; i++) {
      const childId = node.children[i];
      const child = graph.get(childId);
      if (!child) continue;

      const isLast = i === node.children.length - 1;
      const connector = isLast ? "└" : "├";
      const childProvSymbol = child.provenance === "organic" ? "◉" : 
                              child.provenance === "hybrid" ? "◐" : "○";
      const childHorizon = child.fields.horizon ?? "?";
      const childLabel = `[${child.name}]`;
      const childMeta = `${childProvSymbol} h${childHorizon}`;

      lines.push(`${prefix}  ${connector}──spawned──▶ ${childLabel} ${childMeta}`);

      if (child.children.length > 0) {
        const nextPrefix = prefix + (isLast ? "              " : "  │           ");
        renderNode(graph, child, lines, nextPrefix, false);
      }
    }
  }
}

// Register the projector
registerProjector(graphProjector);

export { graphProjector };
