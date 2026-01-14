/**
 * Command executor for XenoScript.
 */

import { SemanticGraph } from "../core/graph.ts";
import type { Provenance } from "../core/node.ts";
import { provenanceSymbol } from "../core/provenance.ts";
import type { Statement } from "../parser/ast.ts";
import { parse } from "../parser/parser.ts";
import {
  type CommandResult,
  executeAssignment,
  executeDriftQuery,
  executeHistoryQuery,
  executeInfoQuery,
  executeMethod,
} from "./commands.ts";

export interface ExecutorState {
  graph: SemanticGraph;
  provenance: Provenance; // Current session provenance
}

export interface ExecuteResult {
  success: boolean;
  output: string;
  shouldExit?: boolean;
}

/**
 * Execute a line of XenoScript input.
 */
export function execute(state: ExecutorState, input: string): ExecuteResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: true, output: "" };
  }

  // Parse the input
  const parseResult = parse(trimmed);
  if (!parseResult.success) {
    return { success: false, output: `Parse error: ${parseResult.error}` };
  }

  if (!parseResult.statement) {
    return { success: true, output: "" };
  }

  // Execute the statement
  return executeStatement(state, parseResult.statement);
}

/**
 * Execute a parsed statement.
 */
function executeStatement(state: ExecutorState, stmt: Statement): ExecuteResult {
  switch (stmt.type) {
    case "declaration":
      return executeDeclaration(state, stmt);

    case "command":
      return executeCommand(state, stmt);

    case "assignment":
      return executeAssignmentStmt(state, stmt);

    case "query":
      return executeQuery(state, stmt);

    case "projection":
      return executeProjection(state, stmt);

    case "builtin":
      return executeBuiltin(state, stmt);

    default:
      return { success: false, output: `Unknown statement type` };
  }
}

function executeDeclaration(
  state: ExecutorState,
  stmt: Extract<Statement, { type: "declaration" }>
): ExecuteResult {
  const node = state.graph.create(
    stmt.kind,
    stmt.name,
    stmt.fields,
    state.provenance
  );

  const symbol = provenanceSymbol(node.provenance);
  const horizon = node.fields.horizon ?? "?";

  return {
    success: true,
    output: `${symbol} created: ${node.name} [${node.provenance}, h${horizon}]`,
  };
}

function executeCommand(
  state: ExecutorState,
  stmt: Extract<Statement, { type: "command" }>
): ExecuteResult {
  const result = executeMethod(state.graph, stmt.target, stmt.method, stmt.args);
  return {
    success: result.success,
    output: result.output ?? result.error ?? "",
  };
}

function executeAssignmentStmt(
  state: ExecutorState,
  stmt: Extract<Statement, { type: "assignment" }>
): ExecuteResult {
  const result = executeAssignment(state.graph, stmt.target, stmt.field, stmt.value);
  return {
    success: result.success,
    output: result.output ?? result.error ?? "",
  };
}

function executeQuery(
  state: ExecutorState,
  stmt: Extract<Statement, { type: "query" }>
): ExecuteResult {
  let result: CommandResult;

  switch (stmt.queryType) {
    case "info":
      result = executeInfoQuery(state.graph, stmt.target);
      break;
    case "drift":
      result = executeDriftQuery(state.graph, stmt.target);
      break;
    case "history":
      result = executeHistoryQuery(state.graph, stmt.target);
      break;
    default:
      result = { success: false, error: "Unknown query type" };
  }

  return {
    success: result.success,
    output: result.output ?? result.error ?? "",
  };
}

function executeProjection(
  state: ExecutorState,
  stmt: Extract<Statement, { type: "projection" }>
): ExecuteResult {
  // Import projectors dynamically to avoid circular deps
  // For now, inline basic projections
  const node = state.graph.get(stmt.target);
  if (!node) {
    return { success: false, output: `Node not found: ${stmt.target}` };
  }

  switch (stmt.projector) {
    case "task":
      return projectTask(state.graph, node.id);
    case "graph":
      return projectGraph(state.graph, node.id);
    case "reflection":
      return projectReflection(state.graph, node.id);
    default:
      return { success: false, output: `Unknown projector: ${stmt.projector}` };
  }
}

function executeBuiltin(
  state: ExecutorState,
  stmt: Extract<Statement, { type: "builtin" }>
): ExecuteResult {
  switch (stmt.command) {
    case "ls": {
      const nodes = state.graph.list();
      if (nodes.length === 0) {
        return { success: true, output: "No objects in namespace." };
      }
      const lines = nodes.map((n) => {
        const symbol = provenanceSymbol(n.provenance);
        const horizon = n.fields.horizon ?? "?";
        const children = n.children.length > 0 ? `, ${n.children.length} children` : "";
        return `${symbol} ${n.name.padEnd(20)} [${n.provenance}, h${horizon}${children}]`;
      });
      return { success: true, output: lines.join("\n") };
    }

    case "save": {
      // Save will be handled by persistence layer
      return { success: true, output: `saved namespace "${state.graph.namespace}"` };
    }

    case "load": {
      // Load will be handled by persistence layer
      const namespace = stmt.args[0] ?? "default";
      return { success: true, output: `loaded: ${namespace}` };
    }

    case "run": {
      // Run is handled by REPL layer, just acknowledge here
      const file = stmt.args[0] ?? "";
      if (!file) {
        return { success: false, output: "Usage: run <file.xeno>" };
      }
      return { success: true, output: `run: ${file}` };
    }

    case "exit":
      return { success: true, output: "Goodbye.", shouldExit: true };

    case "help":
      return { success: true, output: HELP_TEXT };

    case "clear":
      return { success: true, output: "\x1b[2J\x1b[H" }; // ANSI clear screen

    default:
      return { success: false, output: `Unknown command: ${stmt.command}` };
  }
}

// Basic inline projectors (will be moved to projectors module)

function projectTask(graph: SemanticGraph, nodeId: string): ExecuteResult {
  const node = graph.get(nodeId);
  if (!node) {
    return { success: false, output: "Node not found" };
  }

  const lines: string[] = [];
  lines.push(`[tasks] ${node.name} (horizon ${node.fields.horizon ?? "?"})`);
  lines.push("");

  if (node.children.length === 0) {
    const horizon = (node.fields.horizon as number) ?? 3;
    if (horizon > 2) {
      lines.push("  - too abstract for direct action");
      lines.push("  - suggest: spawn horizon " + (horizon - 1) + " refinements");
    } else {
      lines.push(`  □ ${node.fields.focus ?? node.name}`);
    }
  } else {
    lines.push(`  □ ${node.fields.focus ?? node.name}`);
    for (const childId of node.children) {
      const child = graph.get(childId);
      if (child) {
        lines.push(`    ├── □ ${child.name} [h${child.fields.horizon ?? "?"}]`);
      }
    }
  }

  lines.push("");
  lines.push(`  ${node.children.length || 1} actionable item${node.children.length !== 1 ? "s" : ""}`);

  return { success: true, output: lines.join("\n") };
}

function projectGraph(graph: SemanticGraph, nodeId: string): ExecuteResult {
  const node = graph.get(nodeId);
  if (!node) {
    return { success: false, output: "Node not found" };
  }

  const lines: string[] = [];

  // Simple ASCII tree
  const nodeLabel = `[${node.name}]`;
  lines.push(`  ${nodeLabel}`);

  if (node.children.length > 0) {
    const childLabels = node.children.map((childId) => {
      const child = graph.get(childId);
      return child ? `[${child.name}]` : `[unknown]`;
    });

    // Draw connections
    for (let i = 0; i < childLabels.length; i++) {
      const isLast = i === childLabels.length - 1;
      const prefix = isLast ? "  └──spawned──▶ " : "  ├──spawned──▶ ";
      lines.push(prefix + childLabels[i]);
    }
  }

  return { success: true, output: lines.join("\n") };
}

function projectReflection(graph: SemanticGraph, nodeId: string): ExecuteResult {
  const node = graph.get(nodeId);
  if (!node) {
    return { success: false, output: "Node not found" };
  }

  const lines: string[] = [];
  lines.push(`[reflection] ${node.name}`);
  lines.push("");
  lines.push("  Questions to consider:");
  lines.push("");

  const focus = (node.fields.focus as string) ?? node.name;
  const context = (node.fields.context as string[]) ?? [];

  // Generate questions based on focus
  lines.push(`  1. What would success look like for "${focus}"?`);
  lines.push(`  2. What obstacles might prevent progress?`);
  lines.push(`  3. What must be true for this to matter?`);

  if (context.length > 0) {
    lines.push("");
    lines.push("  Context-specific questions:");
    context.slice(0, 2).forEach((ctx, i) => {
      lines.push(`  ${i + 4}. How does "${ctx}" affect the approach?`);
    });
  }

  return { success: true, output: lines.join("\n") };
}

const HELP_TEXT = `
XenoScript v0.3

Commands:
  convergence Name { fields }   Create a convergence
  Name.spawn("child")           Spawn a child convergence
  Name.field = value            Update a field
  Name → task                   Project as task list
  Name → graph                  Project as graph
  Name → reflection             Project as questions
  ?Name                         Query node info
  ?drift                        Check for drift
  history Name                  Show node history
  ls                            List all nodes
  run file.xeno                 Load a .xeno file
  save                          Save namespace
  exit                          Exit REPL

Provenance symbols:
  ◉  organic (human-created)
  ○  synthetic (generated)
  ◐  hybrid (mixed)

Files:
  Write .xeno files with declarations and run them.
  Example: run examples/hello.xeno
`.trim();
