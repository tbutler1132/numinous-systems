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

  return {
    success: true,
    output: `${symbol} created: ${node.name} [${node.provenance}]`,
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
    case "tree":
    case "graph":
      return projectTree(state.graph, node.id);
    case "list":
    case "task":
      return projectList(state.graph, node.id);
    case "questions":
    case "reflection":
      return projectQuestions(state.graph, node.id);
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
        const children = n.children.length > 0 ? `, ${n.children.length} children` : "";
        return `${symbol} ${n.name.padEnd(20)} [${n.provenance}${children}]`;
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

// Basic inline projectors

function projectList(graph: SemanticGraph, nodeId: string): ExecuteResult {
  const node = graph.get(nodeId);
  if (!node) {
    return { success: false, output: "Node not found" };
  }

  const lines: string[] = [];
  lines.push(`[list] ${node.name}`);
  lines.push("");

  // Show this node
  lines.push(`  □ ${node.name}`);
  
  // Show children as sub-items
  for (const childId of node.children) {
    const child = graph.get(childId);
    if (child) {
      lines.push(`    └── □ ${child.name}`);
    }
  }

  const count = node.children.length + 1;
  lines.push("");
  lines.push(`  ${count} item${count !== 1 ? "s" : ""}`);

  return { success: true, output: lines.join("\n") };
}

function projectTree(graph: SemanticGraph, nodeId: string): ExecuteResult {
  const node = graph.get(nodeId);
  if (!node) {
    return { success: false, output: "Node not found" };
  }

  const lines: string[] = [];
  const symbol = node.provenance === "organic" ? "◉" : "○";

  // Render tree recursively
  lines.push(`  ${symbol} ${node.name}`);
  renderTreeChildren(graph, node, lines, "    ");

  return { success: true, output: lines.join("\n") };
}

function renderTreeChildren(
  graph: SemanticGraph,
  parent: { children: string[] },
  lines: string[],
  indent: string
): void {
  for (let i = 0; i < parent.children.length; i++) {
    const childId = parent.children[i];
    const child = graph.get(childId);
    if (!child) continue;

    const isLast = i === parent.children.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const symbol = child.provenance === "organic" ? "◉" : "○";

    lines.push(`${indent}${connector}${symbol} ${child.name}`);

    if (child.children.length > 0) {
      const nextIndent = indent + (isLast ? "    " : "│   ");
      renderTreeChildren(graph, child, lines, nextIndent);
    }
  }
}

function projectQuestions(graph: SemanticGraph, nodeId: string): ExecuteResult {
  const node = graph.get(nodeId);
  if (!node) {
    return { success: false, output: "Node not found" };
  }

  const lines: string[] = [];
  lines.push(`[questions] ${node.name}`);
  lines.push("");

  // Generate questions based on fields
  const fields = Object.keys(node.fields);
  
  lines.push(`  1. What is the purpose of ${node.name}?`);
  lines.push(`  2. What would success look like?`);
  lines.push(`  3. What might prevent progress?`);

  if (fields.length > 0) {
    lines.push("");
    lines.push("  Based on fields:");
    fields.slice(0, 3).forEach((field, i) => {
      const value = node.fields[field];
      lines.push(`  ${i + 4}. Why is ${field} set to "${value}"?`);
    });
  }

  if (node.children.length > 0) {
    lines.push("");
    lines.push(`  ${node.name} has ${node.children.length} children — is this the right breakdown?`);
  }

  return { success: true, output: lines.join("\n") };
}

const HELP_TEXT = `
XenoScript v0.3

Commands:
  node Name { fields }          Create a node
  Name.spawn("child")           Spawn a child node
  Name.field = value            Update a field
  Name → tree                   Project as tree view
  Name → list                   Project as flat list
  Name → questions              Project as questions
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
