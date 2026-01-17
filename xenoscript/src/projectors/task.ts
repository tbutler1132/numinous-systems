/**
 * Task projector for XenoScript.
 * 
 * Projects a convergence into an actionable task list.
 * Lossy: collapses graph richness, discards some relation details.
 */

import type { SemanticGraph } from "../core/graph.ts";
import type { SemanticNode } from "../core/node.ts";
import { type ProjectionResult, type Projector, registerProjector } from "./projector.ts";

const taskProjector: Projector = {
  name: "task",
  description: "Project as actionable task list",
  lossiness: "lossy",

  project(graph: SemanticGraph, nodeId: string): ProjectionResult {
    const node = graph.get(nodeId);
    if (!node) {
      return {
        output: `Node not found: ${nodeId}`,
        lossiness: "lossy",
      };
    }

    const lines: string[] = [];
    const horizon = (node.fields.horizon as number) ?? 3;

    lines.push(`[tasks] ${node.name} (horizon ${horizon})`);
    lines.push("");

    if (node.children.length === 0) {
      if (horizon > 2) {
        lines.push("  - too abstract for direct action");
        lines.push(`  - suggest: spawn horizon ${horizon - 1} refinements`);
      } else {
        lines.push(`  □ ${node.fields.focus ?? node.name}`);
      }
    } else {
      lines.push(`  □ ${node.fields.focus ?? node.name}`);
      renderChildren(graph, node, lines, "    ");
    }

    lines.push("");
    const actionableCount = countActionable(graph, node);
    lines.push(`  ${actionableCount} actionable item${actionableCount !== 1 ? "s" : ""}`);

    return {
      output: lines.join("\n"),
      lossiness: "lossy",
      discardedFields: ["context", "provenance"],
      discardedEdges: ["refines", "contradicts"],
    };
  },
};

function renderChildren(
  graph: SemanticGraph,
  parent: SemanticNode,
  lines: string[],
  indent: string
): void {
  for (let i = 0; i < parent.children.length; i++) {
    const childId = parent.children[i];
    const child = graph.get(childId);
    if (!child) continue;

    const isLast = i === parent.children.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    const horizon = child.fields.horizon ?? "?";

    lines.push(`${indent}${prefix}□ ${child.name} [h${horizon}]`);

    if (child.children.length > 0) {
      const nextIndent = indent + (isLast ? "    " : "│   ");
      renderChildren(graph, child, lines, nextIndent);
    }
  }
}

function countActionable(graph: SemanticGraph, node: SemanticNode): number {
  const horizon = (node.fields.horizon as number) ?? 3;
  
  if (node.children.length === 0) {
    return horizon <= 2 ? 1 : 0;
  }

  let count = 0;
  for (const childId of node.children) {
    const child = graph.get(childId);
    if (child) {
      count += countActionable(graph, child);
    }
  }
  return count || 1; // At least 1 if we have children
}

// Register the projector
registerProjector(taskProjector);

export { taskProjector };
