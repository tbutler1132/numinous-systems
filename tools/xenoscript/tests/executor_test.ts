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

Deno.test("Executor - creates convergence", () => {
  const state = createState();

  const result = execute(state, `convergence Foo { focus: "test", horizon: 3 }`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("created: Foo"), true);

  const node = state.graph.get("Foo");
  assertEquals(node?.name, "Foo");
  assertEquals(node?.fields.focus, "test");
});

Deno.test("Executor - spawns child", () => {
  const state = createState();

  execute(state, `convergence Parent { focus: "parent", horizon: 4 }`);
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

  execute(state, `convergence Foo { focus: "old", horizon: 3 }`);
  const result = execute(state, `Foo.focus = "new"`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("updated"), true);

  const node = state.graph.get("Foo");
  assertEquals(node?.fields.focus, "new");
});

Deno.test("Executor - warns on telic drift", () => {
  const state = createState();

  execute(state, `convergence Foo { focus: "meaning", horizon: 3 }`);
  const result = execute(state, `Foo.focus = "speed"`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("telic drift"), true);
});

Deno.test("Executor - projects as task", () => {
  const state = createState();

  execute(state, `convergence Foo { focus: "test", horizon: 3 }`);
  execute(state, `Foo.spawn("SubTask1")`);
  execute(state, `Foo.spawn("SubTask2")`);

  const result = execute(state, `Foo → task`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("[tasks]"), true);
  assertEquals(result.output.includes("SubTask1"), true);
  assertEquals(result.output.includes("SubTask2"), true);
});

Deno.test("Executor - projects as graph", () => {
  const state = createState();

  execute(state, `convergence Foo { focus: "test", horizon: 3 }`);
  execute(state, `Foo.spawn("Child")`);

  const result = execute(state, `Foo → graph`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("[Foo]"), true);
  assertEquals(result.output.includes("[Child]"), true);
  assertEquals(result.output.includes("spawned"), true);
});

Deno.test("Executor - projects as reflection", () => {
  const state = createState();

  execute(state, `convergence Foo { focus: "test", horizon: 3 }`);

  const result = execute(state, `Foo → reflection`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("[reflection]"), true);
  assertEquals(result.output.includes("Questions"), true);
});

Deno.test("Executor - queries node info", () => {
  const state = createState();

  execute(state, `convergence Foo { focus: "test", horizon: 3 }`);

  const result = execute(state, `?Foo`);

  assertEquals(result.success, true);
  assertEquals(result.output.includes("Foo"), true);
  assertEquals(result.output.includes("convergence"), true);
});

Deno.test("Executor - lists nodes", () => {
  const state = createState();

  execute(state, `convergence Foo { focus: "test1", horizon: 3 }`);
  execute(state, `convergence Bar { focus: "test2", horizon: 2 }`);

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
  assertEquals(result.output.includes("convergence"), true);
});
