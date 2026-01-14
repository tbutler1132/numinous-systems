/**
 * AST types for XenoScript parser.
 */

import type { Value } from "../core/node.ts";

export type Statement =
  | DeclarationStmt
  | CommandStmt
  | QueryStmt
  | ProjectionStmt
  | AssignmentStmt
  | BuiltinStmt;

export interface DeclarationStmt {
  type: "declaration";
  kind: "convergence" | "relation" | "constraint" | "signal";
  name: string;
  fields: Record<string, Value>;
}

export interface CommandStmt {
  type: "command";
  target: string;
  method: string;
  args: Value[];
}

export interface AssignmentStmt {
  type: "assignment";
  target: string;
  field: string;
  value: Value;
}

export interface QueryStmt {
  type: "query";
  queryType: "info" | "drift" | "history";
  target?: string;
}

export interface ProjectionStmt {
  type: "projection";
  target: string;
  projector: string;
}

export interface BuiltinStmt {
  type: "builtin";
  command: "ls" | "save" | "load" | "run" | "exit" | "help" | "clear";
  args: string[];
}

export interface ParseResult {
  success: boolean;
  statement?: Statement;
  error?: string;
}
