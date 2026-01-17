/**
 * File loader for XenoScript.
 * Load and execute .xeno files.
 */

import { SemanticGraph } from "../core/graph.ts";
import { execute, type ExecutorState } from "../executor/executor.ts";

export interface LoadResult {
  success: boolean;
  graph: SemanticGraph;
  errors: string[];
  nodesCreated: number;
}

/**
 * Load and execute a .xeno file.
 */
export async function loadFile(
  filePath: string,
  existingGraph?: SemanticGraph
): Promise<LoadResult> {
  const graph = existingGraph ?? new SemanticGraph("default");
  const errors: string[] = [];
  let nodesCreated = 0;

  const content = await Deno.readTextFile(filePath);
  const statements = splitStatements(content);

  const state: ExecutorState = {
    graph,
    provenance: "organic", // File content is organic
  };

  for (const stmt of statements) {
    if (!stmt.trim()) continue;

    const result = execute(state, stmt);
    
    if (!result.success) {
      errors.push(result.output);
    } else if (result.output.includes("created:")) {
      nodesCreated++;
    }
  }

  return {
    success: errors.length === 0,
    graph,
    errors,
    nodesCreated,
  };
}

/**
 * Split file content into individual statements.
 * Handles multi-line blocks.
 */
function splitStatements(content: string): string[] {
  const statements: string[] = [];
  const lines = content.split("\n");
  
  let current = "";
  let braceDepth = 0;

  for (const line of lines) {
    // Skip comments and empty lines at statement boundaries
    const trimmed = line.trim();
    if (braceDepth === 0 && (trimmed.startsWith("#") || trimmed === "")) {
      if (current.trim()) {
        statements.push(current);
        current = "";
      }
      continue;
    }

    // Track brace depth
    for (const char of line) {
      if (char === "{") braceDepth++;
      if (char === "}") braceDepth--;
    }

    current += (current ? "\n" : "") + line;

    // Statement complete when braces balance
    if (braceDepth === 0 && current.trim()) {
      statements.push(current);
      current = "";
    }
  }

  // Don't forget trailing statement
  if (current.trim()) {
    statements.push(current);
  }

  return statements;
}

/**
 * Load multiple .xeno files into a single graph.
 */
export async function loadFiles(
  filePaths: string[],
  graph?: SemanticGraph
): Promise<LoadResult> {
  const combined = graph ?? new SemanticGraph("default");
  const allErrors: string[] = [];
  let totalNodes = 0;

  for (const path of filePaths) {
    const result = await loadFile(path, combined);
    allErrors.push(...result.errors);
    totalNodes += result.nodesCreated;
  }

  return {
    success: allErrors.length === 0,
    graph: combined,
    errors: allErrors,
    nodesCreated: totalNodes,
  };
}
