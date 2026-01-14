/**
 * Linter for XenoScript files.
 * Checks for semantic issues, style problems, and potential bugs.
 */

import { Parser } from "../parser/parser.ts";
import type { DeclarationStmt, Statement } from "../parser/ast.ts";
import type { Value } from "../core/node.ts";

export type Severity = "error" | "warning" | "hint";

export interface LintDiagnostic {
  severity: Severity;
  message: string;
  line?: number;
  rule: string;
}

export interface LintResult {
  file: string;
  diagnostics: LintDiagnostic[];
  nodeCount: number;
  relationCount: number;
}

interface ParsedFile {
  declarations: DeclarationStmt[];
  lineMap: Map<string, number>; // name -> line number
}

/**
 * Lint a XenoScript file.
 */
export async function lintFile(filePath: string): Promise<LintResult> {
  const content = await Deno.readTextFile(filePath);
  return lintContent(content, filePath);
}

/**
 * Lint XenoScript content directly.
 */
export function lintContent(content: string, file: string = "<input>"): LintResult {
  const diagnostics: LintDiagnostic[] = [];
  const parsed = parseFile(content, diagnostics);

  // Run all lint rules
  checkDuplicateNames(parsed, diagnostics);
  checkUndefinedReferences(parsed, diagnostics);
  checkMissingRequiredFields(parsed, diagnostics);
  checkOrphanNodes(parsed, diagnostics);
  checkNamingConventions(parsed, diagnostics);
  checkMissingAbout(parsed, diagnostics);

  return {
    file,
    diagnostics: diagnostics.sort((a, b) => (a.line ?? 0) - (b.line ?? 0)),
    nodeCount: parsed.declarations.filter((d) => d.kind === "node").length,
    relationCount: parsed.declarations.filter((d) => d.kind === "relation").length,
  };
}

/**
 * Parse file into declarations with line tracking.
 */
function parseFile(content: string, diagnostics: LintDiagnostic[]): ParsedFile {
  const declarations: DeclarationStmt[] = [];
  const lineMap = new Map<string, number>();
  const parser = new Parser();

  const lines = content.split("\n");
  let currentStmt = "";
  let stmtStartLine = 0;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments and empty lines at statement boundaries
    if (braceDepth === 0 && (trimmed.startsWith("#") || trimmed === "")) {
      if (currentStmt.trim()) {
        processStatement(currentStmt, stmtStartLine);
        currentStmt = "";
      }
      continue;
    }

    if (currentStmt === "") {
      stmtStartLine = i + 1; // 1-indexed
    }

    // Track brace depth
    for (const char of line) {
      if (char === "{") braceDepth++;
      if (char === "}") braceDepth--;
    }

    currentStmt += (currentStmt ? "\n" : "") + line;

    if (braceDepth === 0 && currentStmt.trim()) {
      processStatement(currentStmt, stmtStartLine);
      currentStmt = "";
    }
  }

  if (currentStmt.trim()) {
    processStatement(currentStmt, stmtStartLine);
  }

  function processStatement(stmt: string, line: number) {
    const result = parser.parse(stmt);
    
    if (!result.success) {
      diagnostics.push({
        severity: "error",
        message: result.error ?? "Parse error",
        line,
        rule: "parse-error",
      });
      return;
    }

    if (result.statement?.type === "declaration") {
      const decl = result.statement;
      declarations.push(decl);
      if (decl.name) {
        lineMap.set(decl.name, line);
      }
    }
  }

  return { declarations, lineMap };
}

/**
 * Check for duplicate node/constraint names.
 */
function checkDuplicateNames(parsed: ParsedFile, diagnostics: LintDiagnostic[]) {
  const seen = new Map<string, number>();

  for (const decl of parsed.declarations) {
    if (!decl.name) continue;
    
    const prevLine = seen.get(decl.name);
    if (prevLine !== undefined) {
      diagnostics.push({
        severity: "error",
        message: `Duplicate name "${decl.name}" (first defined at line ${prevLine})`,
        line: parsed.lineMap.get(decl.name),
        rule: "no-duplicate-names",
      });
    } else {
      seen.set(decl.name, parsed.lineMap.get(decl.name) ?? 0);
    }
  }
}

/**
 * Check for references to undefined nodes.
 */
function checkUndefinedReferences(parsed: ParsedFile, diagnostics: LintDiagnostic[]) {
  const definedNodes = new Set<string>();
  
  // Collect all defined node names
  for (const decl of parsed.declarations) {
    if (decl.kind === "node" && decl.name) {
      definedNodes.add(decl.name);
    }
  }

  // Check relations for undefined references
  for (const decl of parsed.declarations) {
    if (decl.kind === "relation" || decl.kind === "edge") {
      const from = decl.fields.from;
      const to = decl.fields.to;

      if (typeof from === "string" && !definedNodes.has(from)) {
        diagnostics.push({
          severity: "error",
          message: `Reference to undefined node "${from}"`,
          line: parsed.lineMap.get(decl.name) ?? undefined,
          rule: "no-undefined-references",
        });
      }

      if (typeof to === "string" && !definedNodes.has(to)) {
        diagnostics.push({
          severity: "error",
          message: `Reference to undefined node "${to}"`,
          line: parsed.lineMap.get(decl.name) ?? undefined,
          rule: "no-undefined-references",
        });
      }
    }
  }
}

/**
 * Check for missing required fields.
 */
function checkMissingRequiredFields(parsed: ParsedFile, diagnostics: LintDiagnostic[]) {
  for (const decl of parsed.declarations) {
    if (decl.kind === "relation" || decl.kind === "edge") {
      if (!decl.fields.from) {
        diagnostics.push({
          severity: "error",
          message: `${decl.kind} is missing required field "from"`,
          line: parsed.lineMap.get(decl.name),
          rule: "required-fields",
        });
      }
      if (!decl.fields.to) {
        diagnostics.push({
          severity: "error",
          message: `${decl.kind} is missing required field "to"`,
          line: parsed.lineMap.get(decl.name),
          rule: "required-fields",
        });
      }
    }

    if (decl.kind === "constraint") {
      if (!decl.fields.rule) {
        diagnostics.push({
          severity: "warning",
          message: `constraint "${decl.name}" should have a "rule" field`,
          line: parsed.lineMap.get(decl.name),
          rule: "required-fields",
        });
      }
    }
  }
}

/**
 * Check for orphan nodes (no connections).
 */
function checkOrphanNodes(parsed: ParsedFile, diagnostics: LintDiagnostic[]) {
  const connectedNodes = new Set<string>();

  // Collect all nodes referenced in relations
  for (const decl of parsed.declarations) {
    if (decl.kind === "relation" || decl.kind === "edge") {
      const from = decl.fields.from;
      const to = decl.fields.to;
      if (typeof from === "string") connectedNodes.add(from);
      if (typeof to === "string") connectedNodes.add(to);
    }
  }

  // Check for orphans
  const nodes = parsed.declarations.filter((d) => d.kind === "node");
  
  // Only warn if there are relations (otherwise everything is "orphan")
  const hasRelations = parsed.declarations.some(
    (d) => d.kind === "relation" || d.kind === "edge"
  );

  if (hasRelations && nodes.length > 1) {
    for (const node of nodes) {
      if (!connectedNodes.has(node.name)) {
        diagnostics.push({
          severity: "hint",
          message: `Node "${node.name}" is not connected to any other node`,
          line: parsed.lineMap.get(node.name),
          rule: "no-orphan-nodes",
        });
      }
    }
  }
}

/**
 * Check naming conventions.
 */
function checkNamingConventions(parsed: ParsedFile, diagnostics: LintDiagnostic[]) {
  const pascalCase = /^[A-Z][a-zA-Z0-9_]*$/;

  for (const decl of parsed.declarations) {
    if (decl.kind === "node" && decl.name && !pascalCase.test(decl.name)) {
      diagnostics.push({
        severity: "hint",
        message: `Node name "${decl.name}" should use PascalCase`,
        line: parsed.lineMap.get(decl.name),
        rule: "naming-convention",
      });
    }
  }
}

/**
 * Check for missing "about" fields on nodes.
 */
function checkMissingAbout(parsed: ParsedFile, diagnostics: LintDiagnostic[]) {
  for (const decl of parsed.declarations) {
    if (decl.kind === "node" && !decl.fields.about) {
      diagnostics.push({
        severity: "hint",
        message: `Node "${decl.name}" is missing an "about" field`,
        line: parsed.lineMap.get(decl.name),
        rule: "require-about",
      });
    }
  }
}

/**
 * Format diagnostics for terminal output.
 */
export function formatDiagnostics(result: LintResult): string {
  if (result.diagnostics.length === 0) {
    return `✓ ${result.file}: ${result.nodeCount} nodes, ${result.relationCount} relations — no issues`;
  }

  const lines: string[] = [];
  const errors = result.diagnostics.filter((d) => d.severity === "error");
  const warnings = result.diagnostics.filter((d) => d.severity === "warning");
  const hints = result.diagnostics.filter((d) => d.severity === "hint");

  lines.push(`${result.file}:`);

  for (const d of result.diagnostics) {
    const icon = d.severity === "error" ? "✗" : d.severity === "warning" ? "⚠" : "·";
    const lineInfo = d.line ? `:${d.line}` : "";
    lines.push(`  ${icon} ${d.message} [${d.rule}]${lineInfo}`);
  }

  const summary = [
    errors.length ? `${errors.length} error(s)` : null,
    warnings.length ? `${warnings.length} warning(s)` : null,
    hints.length ? `${hints.length} hint(s)` : null,
  ]
    .filter(Boolean)
    .join(", ");

  lines.push(`  → ${summary}`);

  return lines.join("\n");
}
