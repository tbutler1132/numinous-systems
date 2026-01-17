/**
 * Tab completion for XenoScript REPL.
 */

import type { SemanticGraph } from "../core/graph.ts";

const KEYWORDS = [
  "convergence",
  "relation",
  "constraint",
  "signal",
  "ls",
  "save",
  "load",
  "exit",
  "help",
  "clear",
  "history",
];

const PROJECTORS = ["task", "graph", "reflection", "outline"];

/**
 * Get completions for a partial input.
 */
export function getCompletions(input: string, graph: SemanticGraph): string[] {
  const trimmed = input.trim();
  const completions: string[] = [];

  // Empty or starts with keyword prefix
  if (!trimmed || KEYWORDS.some(k => k.startsWith(trimmed))) {
    completions.push(...KEYWORDS.filter(k => k.startsWith(trimmed)));
  }

  // After → for projector names
  if (trimmed.includes("→") || trimmed.includes("->")) {
    const parts = trimmed.split(/→|->/);
    const projectorPrefix = parts[parts.length - 1].trim();
    completions.push(...PROJECTORS.filter(p => p.startsWith(projectorPrefix)));
    return completions;
  }

  // Node names
  const nodeNames = graph.list().map(n => n.name);
  const lastWord = trimmed.split(/\s+/).pop() ?? "";
  
  // If we're after a ?, complete with node names
  if (trimmed.startsWith("?")) {
    const target = trimmed.slice(1);
    completions.push(...nodeNames.filter(n => n.startsWith(target)));
    return completions;
  }

  // Complete node names that match the last word
  if (lastWord) {
    completions.push(...nodeNames.filter(n => n.startsWith(lastWord)));
  }

  return [...new Set(completions)];
}

/**
 * Apply completion to input.
 */
export function applyCompletion(input: string, completion: string): string {
  const trimmed = input.trim();
  const lastWord = trimmed.split(/\s+/).pop() ?? "";
  
  if (lastWord && completion.startsWith(lastWord)) {
    return input.slice(0, -lastWord.length) + completion;
  }
  
  return input + completion;
}
