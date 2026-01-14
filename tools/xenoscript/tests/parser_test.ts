/**
 * Parser tests for XenoScript.
 */

import { assertEquals, assertExists } from "@std/assert";
import { Lexer } from "../src/parser/lexer.ts";
import { parse } from "../src/parser/parser.ts";

Deno.test("Lexer - tokenizes declaration", () => {
  const lexer = new Lexer(`convergence Foo { focus: "test" }`);
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "KEYWORD");
  assertEquals(tokens[0].value, "convergence");
  assertEquals(tokens[1].type, "IDENT");
  assertEquals(tokens[1].value, "Foo");
  assertEquals(tokens[2].type, "LBRACE");
  assertEquals(tokens[3].type, "IDENT");
  assertEquals(tokens[3].value, "focus");
  assertEquals(tokens[4].type, "COLON");
  assertEquals(tokens[5].type, "STRING");
  assertEquals(tokens[5].value, "test");
  assertEquals(tokens[6].type, "RBRACE");
});

Deno.test("Lexer - tokenizes arrow", () => {
  const lexer = new Lexer("Foo → task");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "IDENT");
  assertEquals(tokens[0].value, "Foo");
  assertEquals(tokens[1].type, "ARROW");
  assertEquals(tokens[2].type, "IDENT");
  assertEquals(tokens[2].value, "task");
});

Deno.test("Lexer - tokenizes ASCII arrow", () => {
  const lexer = new Lexer("Foo -> task");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "IDENT");
  assertEquals(tokens[1].type, "ARROW");
  assertEquals(tokens[2].type, "IDENT");
});

Deno.test("Lexer - tokenizes query", () => {
  const lexer = new Lexer("?Foo");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "QUESTION");
  assertEquals(tokens[1].type, "IDENT");
  assertEquals(tokens[1].value, "Foo");
});

Deno.test("Lexer - tokenizes method call", () => {
  const lexer = new Lexer(`Foo.spawn("Bar")`);
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "IDENT");
  assertEquals(tokens[0].value, "Foo");
  assertEquals(tokens[1].type, "DOT");
  assertEquals(tokens[2].type, "IDENT");
  assertEquals(tokens[2].value, "spawn");
  assertEquals(tokens[3].type, "LPAREN");
  assertEquals(tokens[4].type, "STRING");
  assertEquals(tokens[4].value, "Bar");
  assertEquals(tokens[5].type, "RPAREN");
});

Deno.test("Parser - parses declaration", () => {
  const result = parse(`convergence Foo { focus: "test", horizon: 3 }`);

  assertEquals(result.success, true);
  assertExists(result.statement);
  assertEquals(result.statement.type, "declaration");

  if (result.statement.type === "declaration") {
    assertEquals(result.statement.kind, "convergence");
    assertEquals(result.statement.name, "Foo");
    assertEquals(result.statement.fields.focus, "test");
    assertEquals(result.statement.fields.horizon, 3);
  }
});

Deno.test("Parser - parses multiline declaration", () => {
  const result = parse(`convergence Foo {
    focus: "test"
    horizon: 3
    context: ["a", "b"]
  }`);

  assertEquals(result.success, true);
  assertExists(result.statement);

  if (result.statement.type === "declaration") {
    assertEquals(result.statement.fields.focus, "test");
    assertEquals(result.statement.fields.horizon, 3);
    assertEquals(result.statement.fields.context, ["a", "b"]);
  }
});

Deno.test("Parser - parses projection", () => {
  const result = parse("Foo → task");

  assertEquals(result.success, true);
  assertExists(result.statement);
  assertEquals(result.statement.type, "projection");

  if (result.statement.type === "projection") {
    assertEquals(result.statement.target, "Foo");
    assertEquals(result.statement.projector, "task");
  }
});

Deno.test("Parser - parses query", () => {
  const result = parse("?Foo");

  assertEquals(result.success, true);
  assertExists(result.statement);
  assertEquals(result.statement.type, "query");

  if (result.statement.type === "query") {
    assertEquals(result.statement.queryType, "info");
    assertEquals(result.statement.target, "Foo");
  }
});

Deno.test("Parser - parses drift query", () => {
  const result = parse("?drift Foo");

  assertEquals(result.success, true);
  assertExists(result.statement);

  if (result.statement.type === "query") {
    assertEquals(result.statement.queryType, "drift");
    assertEquals(result.statement.target, "Foo");
  }
});

Deno.test("Parser - parses method call", () => {
  const result = parse(`Foo.spawn("Bar")`);

  assertEquals(result.success, true);
  assertExists(result.statement);
  assertEquals(result.statement.type, "command");

  if (result.statement.type === "command") {
    assertEquals(result.statement.target, "Foo");
    assertEquals(result.statement.method, "spawn");
    assertEquals(result.statement.args, ["Bar"]);
  }
});

Deno.test("Parser - parses assignment", () => {
  const result = parse(`Foo.focus = "new focus"`);

  assertEquals(result.success, true);
  assertExists(result.statement);
  assertEquals(result.statement.type, "assignment");

  if (result.statement.type === "assignment") {
    assertEquals(result.statement.target, "Foo");
    assertEquals(result.statement.field, "focus");
    assertEquals(result.statement.value, "new focus");
  }
});

Deno.test("Parser - parses builtin commands", () => {
  const result = parse("ls");

  assertEquals(result.success, true);
  assertExists(result.statement);
  assertEquals(result.statement.type, "builtin");

  if (result.statement.type === "builtin") {
    assertEquals(result.statement.command, "ls");
  }
});
