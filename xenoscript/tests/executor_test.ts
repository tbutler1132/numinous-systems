/**
 * Executor tests for XenoScript.
 */

import { assertEquals } from "@std/assert";
import { SemanticGraph } from "../src/core/graph.ts";
import { execute, type ExecutorState } from "../src/executor/executor.ts";

function createState(): ExecutorState {
  return {
    graph: new SemanticGraph("test"),
    provenance: "organic",
  };
}

Deno.test("Executor - creates node", () => {
  const state = createState();

  const result = execute(state, `node Foo { about: "test" }`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("created: Foo"), true);

  const node = state.graph.get("Foo");
  assertEquals(node?.name, "Foo");
  assertEquals(node?.fields.about, "test");
});

Deno.test("Executor - spawns child", () => {
  const state = createState();

  execute(state, `node Parent { about: "parent" }`);
  const result = execute(state, `Parent.spawn("Child")`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("created: Child"), true);
  assertEquals(result.output.includes("synthetic"), true);

  const child = state.graph.get("Child");
  assertEquals(child?.name, "Child");
  assertEquals(child?.provenance, "synthetic");
});

Deno.test("Executor - updates field", () => {
  const state = createState();

  execute(state, `node Foo { about: "old" }`);
  const result = execute(state, `Foo.about = "new"`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("updated"), true);

  const node = state.graph.get("Foo");
  assertEquals(node?.fields.about, "new");
});

Deno.test("Executor - updates focus field", () => {
  const state = createState();

  execute(state, `node Foo { focus: "meaning" }`);
  const result = execute(state, `Foo.focus = "speed"`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("updated"), true);
});

Deno.test("Executor - projects as list", () => {
  const state = createState();

  execute(state, `node Foo { about: "test" }`);
  execute(state, `Foo.spawn("SubTask1")`);
  execute(state, `Foo.spawn("SubTask2")`);

  const result = execute(state, `Foo → list`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("[list]"), true);
  assertEquals(result.output.includes("SubTask1"), true);
  assertEquals(result.output.includes("SubTask2"), true);
});

Deno.test("Executor - projects as tree", () => {
  const state = createState();

  execute(state, `node Foo { about: "test" }`);
  execute(state, `Foo.spawn("Child")`);

  const result = execute(state, `Foo → tree`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("Foo"), true);
  assertEquals(result.output.includes("Child"), true);
});

Deno.test("Executor - projects as questions", () => {
  const state = createState();

  execute(state, `node Foo { about: "test" }`);

  const result = execute(state, `Foo → questions`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("[questions]"), true);
});

Deno.test("Executor - queries node info", () => {
  const state = createState();

  execute(state, `node Foo { about: "test" }`);

  const result = execute(state, `?Foo`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("Foo"), true);
});

Deno.test("Executor - lists nodes", () => {
  const state = createState();

  execute(state, `node Foo { about: "test1" }`);
  execute(state, `node Bar { about: "test2" }`);

  const result = execute(state, `ls`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("Foo"), true);
  assertEquals(result.output.includes("Bar"), true);
});

Deno.test("Executor - handles unknown node", () => {
  const state = createState();

  const result = execute(state, `?Unknown`);

  assertEquals(result.success, false);
  assertEquals(result.output.includes("not found"), true);
});

Deno.test("Executor - handles parse error", () => {
  const state = createState();

  const result = execute(state, `{{{{`);

  assertEquals(result.success, false);
  assertEquals(result.output.includes("error"), true);
});

Deno.test("Executor - exit command", () => {
  const state = createState();

  const result = execute(state, `exit`);

  assertEquals(result.success, true);
  assertEquals(result.shouldExit, true);
});

Deno.test("Executor - help command", () => {
  const state = createState();

  const result = execute(state, `help`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("XenoScript"), true);
  assertEquals(result.output.includes("node"), true);
});
