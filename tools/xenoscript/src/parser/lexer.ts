/**
 * Lexer for XenoScript.
 */

export type TokenType =
  | "KEYWORD"
  | "IDENT"
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "NULL"
  | "LBRACE"
  | "RBRACE"
  | "LBRACKET"
  | "RBRACKET"
  | "LPAREN"
  | "RPAREN"
  | "COLON"
  | "COMMA"
  | "DOT"
  | "EQUALS"
  | "ARROW"
  | "QUESTION"
  | "NEWLINE"
  | "EOF"
  | "ERROR";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

const KEYWORDS = new Set([
  "convergence",
  "relation",
  "constraint",
  "signal",
  "within",
  "assert",
  "true",
  "false",
  "null",
  "ls",
  "save",
  "load",
  "run",
  "exit",
  "help",
  "clear",
  "history",
  "drift",
]);

export class Lexer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.input.length) {
      const token = this.nextToken();
      if (token.type !== "NEWLINE" || tokens.length === 0 || tokens[tokens.length - 1].type !== "NEWLINE") {
        tokens.push(token);
      }
    }

    tokens.push({ type: "EOF", value: "", line: this.line, column: this.column });
    return tokens;
  }

  private nextToken(): Token {
    this.skipWhitespace();

    if (this.pos >= this.input.length) {
      return { type: "EOF", value: "", line: this.line, column: this.column };
    }

    const char = this.input[this.pos];
    const startColumn = this.column;

    // Newlines
    if (char === "\n") {
      this.pos++;
      this.line++;
      this.column = 1;
      return { type: "NEWLINE", value: "\n", line: this.line - 1, column: startColumn };
    }

    // Comments
    if (char === "#") {
      while (this.pos < this.input.length && this.input[this.pos] !== "\n") {
        this.pos++;
        this.column++;
      }
      return this.nextToken();
    }

    // Arrow →
    if (char === "→" || (char === "-" && this.peek() === ">")) {
      if (char === "→") {
        this.pos++;
        this.column++;
        return { type: "ARROW", value: "→", line: this.line, column: startColumn };
      } else {
        this.pos += 2;
        this.column += 2;
        return { type: "ARROW", value: "->", line: this.line, column: startColumn };
      }
    }

    // Single-character tokens
    const singleChars: Record<string, TokenType> = {
      "{": "LBRACE",
      "}": "RBRACE",
      "[": "LBRACKET",
      "]": "RBRACKET",
      "(": "LPAREN",
      ")": "RPAREN",
      ":": "COLON",
      ",": "COMMA",
      ".": "DOT",
      "=": "EQUALS",
      "?": "QUESTION",
    };

    if (singleChars[char]) {
      this.pos++;
      this.column++;
      return { type: singleChars[char], value: char, line: this.line, column: startColumn };
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.readString(char);
    }

    // Numbers
    if (this.isDigit(char) || (char === "-" && this.isDigit(this.peek()))) {
      return this.readNumber();
    }

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      return this.readIdentifier();
    }

    // Unknown character
    this.pos++;
    this.column++;
    return { type: "ERROR", value: char, line: this.line, column: startColumn };
  }

  private readString(quote: string): Token {
    const startColumn = this.column;
    this.pos++; // Skip opening quote
    this.column++;

    let value = "";
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === "\\") {
        this.pos++;
        this.column++;
        if (this.pos < this.input.length) {
          const escaped = this.input[this.pos];
          switch (escaped) {
            case "n":
              value += "\n";
              break;
            case "t":
              value += "\t";
              break;
            case "\\":
              value += "\\";
              break;
            case '"':
              value += '"';
              break;
            case "'":
              value += "'";
              break;
            default:
              value += escaped;
          }
        }
      } else {
        value += this.input[this.pos];
      }
      this.pos++;
      this.column++;
    }

    if (this.pos < this.input.length) {
      this.pos++; // Skip closing quote
      this.column++;
    }

    return { type: "STRING", value, line: this.line, column: startColumn };
  }

  private readNumber(): Token {
    const startColumn = this.column;
    let value = "";

    if (this.input[this.pos] === "-") {
      value += "-";
      this.pos++;
      this.column++;
    }

    while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
      value += this.input[this.pos];
      this.pos++;
      this.column++;
    }

    if (this.input[this.pos] === "." && this.isDigit(this.peek())) {
      value += ".";
      this.pos++;
      this.column++;
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        value += this.input[this.pos];
        this.pos++;
        this.column++;
      }
    }

    return { type: "NUMBER", value, line: this.line, column: startColumn };
  }

  private readIdentifier(): Token {
    const startColumn = this.column;
    let value = "";

    while (
      this.pos < this.input.length &&
      (this.isAlphaNumeric(this.input[this.pos]) || this.input[this.pos] === "_")
    ) {
      value += this.input[this.pos];
      this.pos++;
      this.column++;
    }

    // Check for @ suffix (history reference)
    if (this.input[this.pos] === "@") {
      value += "@";
      this.pos++;
      this.column++;
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        value += this.input[this.pos];
        this.pos++;
        this.column++;
      }
    }

    if (value === "true" || value === "false") {
      return { type: "BOOLEAN", value, line: this.line, column: startColumn };
    }

    if (value === "null") {
      return { type: "NULL", value, line: this.line, column: startColumn };
    }

    if (KEYWORDS.has(value)) {
      return { type: "KEYWORD", value, line: this.line, column: startColumn };
    }

    return { type: "IDENT", value, line: this.line, column: startColumn };
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (char === " " || char === "\t" || char === "\r") {
        this.pos++;
        this.column++;
      } else {
        break;
      }
    }
  }

  private peek(): string {
    return this.pos + 1 < this.input.length ? this.input[this.pos + 1] : "";
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAlpha(char: string): boolean {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_";
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
