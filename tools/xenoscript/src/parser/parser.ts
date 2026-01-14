/**
 * Recursive descent parser for XenoScript.
 */

import type { Value } from "../core/node.ts";
import type {
  AssignmentStmt,
  BuiltinStmt,
  CommandStmt,
  DeclarationStmt,
  ParseResult,
  ProjectionStmt,
  QueryStmt,
  Statement,
} from "./ast.ts";
import { Lexer, type Token, type TokenType } from "./lexer.ts";

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;

  parse(input: string): ParseResult {
    const lexer = new Lexer(input);
    this.tokens = lexer.tokenize();
    this.pos = 0;

    // Skip leading newlines
    this.skipNewlines();

    if (this.check("EOF")) {
      return { success: true };
    }

    try {
      const statement = this.parseStatement();
      return { success: true, statement };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  private parseStatement(): Statement {
    // Query: ?target or ?drift target
    if (this.check("QUESTION")) {
      return this.parseQuery();
    }

    // Builtin commands
    if (this.check("KEYWORD")) {
      const keyword = this.current().value;
      if (["ls", "save", "load", "run", "exit", "help", "clear"].includes(keyword)) {
        return this.parseBuiltin();
      }
      // Declaration: convergence, relation, constraint, signal
      if (["convergence", "relation", "constraint", "signal"].includes(keyword)) {
        return this.parseDeclaration();
      }
      // History command
      if (keyword === "history") {
        return this.parseHistoryQuery();
      }
    }

    // Identifier: could be command, assignment, or projection
    if (this.check("IDENT")) {
      return this.parseIdentifierStatement();
    }

    throw new Error(`Unexpected token: ${this.current().value}`);
  }

  private parseDeclaration(): DeclarationStmt {
    const kindToken = this.expect("KEYWORD");
    const kind = kindToken.value as DeclarationStmt["kind"];

    const nameToken = this.expect("IDENT");
    const name = nameToken.value;

    const fields: Record<string, Value> = {};

    this.expect("LBRACE");
    this.skipNewlines();

    while (!this.check("RBRACE") && !this.check("EOF")) {
      const fieldName = this.expect("IDENT").value;
      this.expect("COLON");
      const value = this.parseValue();
      fields[fieldName] = value;

      // Optional comma or newline
      if (this.check("COMMA")) {
        this.advance();
      }
      this.skipNewlines();
    }

    this.expect("RBRACE");

    return { type: "declaration", kind, name, fields };
  }

  private parseQuery(): QueryStmt {
    this.expect("QUESTION");

    // ?drift [target]
    if (this.check("KEYWORD") && this.current().value === "drift") {
      this.advance();
      const target = this.check("IDENT") ? this.advance().value : undefined;
      return { type: "query", queryType: "drift", target };
    }

    // ?target
    if (this.check("IDENT")) {
      const target = this.advance().value;
      return { type: "query", queryType: "info", target };
    }

    // Just ?
    return { type: "query", queryType: "info" };
  }

  private parseHistoryQuery(): QueryStmt {
    this.expect("KEYWORD"); // history
    const target = this.check("IDENT") ? this.advance().value : undefined;
    return { type: "query", queryType: "history", target };
  }

  private parseBuiltin(): BuiltinStmt {
    const command = this.expect("KEYWORD").value as BuiltinStmt["command"];
    const args: string[] = [];

    while (this.check("IDENT") || this.check("STRING")) {
      args.push(this.advance().value);
    }

    return { type: "builtin", command, args };
  }

  private parseIdentifierStatement(): Statement {
    const target = this.expect("IDENT").value;

    // Projection: target → projector
    if (this.check("ARROW")) {
      return this.parseProjection(target);
    }

    // Method or field access
    if (this.check("DOT")) {
      this.advance();
      const memberToken = this.expect("IDENT");
      const member = memberToken.value;

      // Assignment: target.field = value
      if (this.check("EQUALS")) {
        this.advance();
        const value = this.parseValue();
        return {
          type: "assignment",
          target,
          field: member,
          value,
        } as AssignmentStmt;
      }

      // Method call: target.method(args)
      if (this.check("LPAREN")) {
        this.advance();
        const args: Value[] = [];

        while (!this.check("RPAREN") && !this.check("EOF")) {
          args.push(this.parseValue());
          if (this.check("COMMA")) {
            this.advance();
          }
        }

        this.expect("RPAREN");

        return {
          type: "command",
          target,
          method: member,
          args,
        } as CommandStmt;
      }

      // Just target.member (treat as query)
      return {
        type: "query",
        queryType: "info",
        target: `${target}.${member}`,
      } as QueryStmt;
    }

    // Just an identifier - treat as query
    return { type: "query", queryType: "info", target } as QueryStmt;
  }

  private parseProjection(target: string): ProjectionStmt {
    this.expect("ARROW");
    const projector = this.expect("IDENT").value;
    return { type: "projection", target, projector };
  }

  private parseValue(): Value {
    // String
    if (this.check("STRING")) {
      return this.advance().value;
    }

    // Number
    if (this.check("NUMBER")) {
      const value = this.advance().value;
      return value.includes(".") ? parseFloat(value) : parseInt(value, 10);
    }

    // Boolean
    if (this.check("BOOLEAN")) {
      return this.advance().value === "true";
    }

    // Null
    if (this.check("NULL")) {
      this.advance();
      return null;
    }

    // Array
    if (this.check("LBRACKET")) {
      return this.parseArray();
    }

    // Object
    if (this.check("LBRACE")) {
      return this.parseObject();
    }

    // Identifier (reference)
    if (this.check("IDENT")) {
      return this.advance().value;
    }

    throw new Error(`Expected value, got: ${this.current().value}`);
  }

  private parseArray(): Value[] {
    this.expect("LBRACKET");
    const values: Value[] = [];

    while (!this.check("RBRACKET") && !this.check("EOF")) {
      values.push(this.parseValue());
      if (this.check("COMMA")) {
        this.advance();
      }
      this.skipNewlines();
    }

    this.expect("RBRACKET");
    return values;
  }

  private parseObject(): Record<string, Value> {
    this.expect("LBRACE");
    const obj: Record<string, Value> = {};

    this.skipNewlines();
    while (!this.check("RBRACE") && !this.check("EOF")) {
      const key = this.expect("IDENT").value;
      this.expect("COLON");
      obj[key] = this.parseValue();

      if (this.check("COMMA")) {
        this.advance();
      }
      this.skipNewlines();
    }

    this.expect("RBRACE");
    return obj;
  }

  private current(): Token {
    return this.tokens[this.pos] ?? { type: "EOF", value: "", line: 0, column: 0 };
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private advance(): Token {
    const token = this.current();
    this.pos++;
    return token;
  }

  private expect(type: TokenType): Token {
    if (!this.check(type)) {
      throw new Error(
        `Expected ${type}, got ${this.current().type} "${this.current().value}" at line ${this.current().line}`
      );
    }
    return this.advance();
  }

  private skipNewlines(): void {
    while (this.check("NEWLINE")) {
      this.advance();
    }
  }
}

/**
 * Convenience function to parse a string.
 */
export function parse(input: string): ParseResult {
  const parser = new Parser();
  return parser.parse(input);
}
