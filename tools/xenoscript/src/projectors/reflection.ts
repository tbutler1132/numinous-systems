/**
 * Reflection projector for XenoScript.
 * 
 * Projects a convergence into reflective questions.
 * Lossy: transforms structure into prose prompts.
 */

import type { SemanticGraph } from "../core/graph.ts";
import type { SemanticNode } from "../core/node.ts";
import { type ProjectionResult, type Projector, registerProjector } from "./projector.ts";

const reflectionProjector: Projector = {
  name: "reflection",
  description: "Project as reflective questions",
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
    lines.push(`[reflection] ${node.name}`);
    lines.push("");
    lines.push("  Questions to consider:");
    lines.push("");

    const questions = generateQuestions(graph, node);
    questions.forEach((q, i) => {
      lines.push(`  ${i + 1}. ${q}`);
    });

    return {
      output: lines.join("\n"),
      lossiness: "lossy",
      discardedFields: ["horizon", "children"],
    };
  },
};

function generateQuestions(graph: SemanticGraph, node: SemanticNode): string[] {
  const questions: string[] = [];
  const focus = (node.fields.focus as string) ?? node.name;
  const context = (node.fields.context as string[]) ?? [];
  const horizon = (node.fields.horizon as number) ?? 3;

  // Core questions based on focus
  questions.push(`What would success look like for "${focus}"?`);
  questions.push(`What obstacles might prevent progress on this?`);
  questions.push(`What must be true for "${focus}" to matter?`);

  // Horizon-based questions
  if (horizon >= 4) {
    questions.push(`Is this the right level of abstraction, or should it be more concrete?`);
  } else if (horizon <= 2) {
    questions.push(`What immediate action would move this forward?`);
  }

  // Context-based questions
  for (const ctx of context.slice(0, 2)) {
    questions.push(`How does "${ctx}" affect your approach?`);
  }

  // Child-based questions
  if (node.children.length > 0) {
    const childNames = node.children
      .map(id => graph.get(id)?.name)
      .filter(Boolean)
      .slice(0, 3);
    
    if (childNames.length > 0) {
      questions.push(`Are ${childNames.join(", ")} the right breakdown of this work?`);
    }
  } else if (horizon > 2) {
    questions.push(`What sub-convergences would help make this more actionable?`);
  }

  // Provenance-based questions
  if (node.provenance === "synthetic") {
    questions.push(`Does this synthetic convergence still align with the organic anchor?`);
  }

  return questions;
}

// Register the projector
registerProjector(reflectionProjector);

export { reflectionProjector };
