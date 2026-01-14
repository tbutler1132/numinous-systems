/**
 * Graph tests for XenoScript.
 */

import { assertEquals, assertExists } from "@std/assert";
import { SemanticGraph } from "../src/core/graph.ts";
import { provenanceSymbol } from "../src/core/provenance.ts";

Deno.test("SemanticGraph - creates node", () => {
  const graph = new SemanticGraph();

  const node = graph.create("convergence", "Foo", { focus: "test" });

  assertExists(node);
  assertEquals(node.kind, "convergence");
  assertEquals(node.name, "Foo");
  assertEquals(node.fields.focus, "test");
  assertEquals(node.provenance, "organic");
});

Deno.test("SemanticGraph - gets node by name", () => {
  const graph = new SemanticGraph();

  graph.create("convergence", "Foo", { focus: "test" });

  const node = graph.get("Foo");
  assertExists(node);
  assertEquals(node.name, "Foo");
});

Deno.test("SemanticGraph - spawns child", () => {
  const graph = new SemanticGraph();

  const parent = graph.create("convergence", "Parent", {
    focus: "parent focus",
    horizon: 4,
  });

  const child = graph.spawn("Parent", "Child");

  assertExists(child);
  assertEquals(child.name, "Child");
  assertEquals(child.parent, parent.id);
  assertEquals(child.provenance, "synthetic");
  assertEquals(child.fields.horizon, 3); // parent horizon - 1

  // Parent should have child in children array
  const updatedParent = graph.get("Parent");
  assertExists(updatedParent);
  assertEquals(updatedParent.children.length, 1);
  assertEquals(updatedParent.children[0], child.id);
});

Deno.test("SemanticGraph - updates field", () => {
  const graph = new SemanticGraph();

  graph.create("convergence", "Foo", { focus: "old focus", horizon: 3 });

  const result = graph.update("Foo", "focus", "new focus");

  assertEquals(result.hasDrift, true);
  assertEquals(result.driftClass, "telic");
  assertEquals(result.oldValue, "old focus");
  assertEquals(result.newValue, "new focus");

  const node = graph.get("Foo");
  assertExists(node);
  assertEquals(node.fields.focus, "new focus");
});

Deno.test("SemanticGraph - detects telic drift", () => {
  const graph = new SemanticGraph();

  graph.create("convergence", "Foo", { focus: "meaning", horizon: 3 });

  const result = graph.update("Foo", "focus", "speed");

  assertEquals(result.hasDrift, true);
  assertEquals(result.driftClass, "telic");
});

Deno.test("SemanticGraph - detects cosmetic change", () => {
  const graph = new SemanticGraph();

  graph.create("convergence", "Foo", { focus: "test", note: "old note" });

  const result = graph.update("Foo", "note", "new note");

  assertEquals(result.hasDrift, false);
  assertEquals(result.driftClass, "cosmetic");
});

Deno.test("SemanticGraph - queries node", () => {
  const graph = new SemanticGraph();

  graph.create("convergence", "Foo", { focus: "test", horizon: 3 });
  graph.spawn("Foo", "Child1");
  graph.spawn("Foo", "Child2");

  const result = graph.query("Foo");

  assertExists(result);
  assertEquals(result.childCount, 2);
  assertEquals(result.descendantCount, 2);
});

Deno.test("SemanticGraph - serializes and deserializes", () => {
  const graph = new SemanticGraph("test-namespace");

  graph.create("convergence", "Foo", { focus: "test", horizon: 3 });
  graph.spawn("Foo", "Child");

  // Serialize
  const json = graph.toJSON();
  const jsonString = JSON.stringify(json);

  // Deserialize
  const restored = SemanticGraph.fromJSON(JSON.parse(jsonString));

  assertEquals(restored.namespace, "test-namespace");
  assertEquals(restored.list().length, 2);

  const foo = restored.get("Foo");
  assertExists(foo);
  assertEquals(foo.fields.focus, "test");
  assertEquals(foo.children.length, 1);
});

Deno.test("provenanceSymbol - returns correct symbols", () => {
  assertEquals(provenanceSymbol("organic"), "◉");
  assertEquals(provenanceSymbol("synthetic"), "○");
  assertEquals(provenanceSymbol("hybrid"), "◐");
  assertEquals(provenanceSymbol("unknown"), "◌");
});
