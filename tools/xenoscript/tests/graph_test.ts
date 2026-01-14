/**
 * Graph tests for XenoScript.
 */

import { assertEquals, assertExists } from "@std/assert";
import { SemanticGraph } from "../src/core/graph.ts";
import { provenanceSymbol } from "../src/core/provenance.ts";

Deno.test("SemanticGraph - creates node", () => {
  const graph = new SemanticGraph();

  const node = graph.create("node", "Foo", { about: "test" });

  assertExists(node);
  assertEquals(node.kind, "node");
  assertEquals(node.name, "Foo");
  assertEquals(node.fields.about, "test");
  assertEquals(node.provenance, "organic");
});

Deno.test("SemanticGraph - gets node by name", () => {
  const graph = new SemanticGraph();

  graph.create("node", "Foo", { about: "test" });

  const node = graph.get("Foo");
  assertExists(node);
  assertEquals(node.name, "Foo");
});

Deno.test("SemanticGraph - spawns child", () => {
  const graph = new SemanticGraph();

  const parent = graph.create("node", "Parent", {
    about: "parent node",
  });

  const child = graph.spawn("Parent", "Child");

  assertExists(child);
  assertEquals(child.name, "Child");
  assertEquals(child.parent, parent.id);
  assertEquals(child.provenance, "synthetic");

  // Parent should have child in children array
  const updatedParent = graph.get("Parent");
  assertExists(updatedParent);
  assertEquals(updatedParent.children.length, 1);
  assertEquals(updatedParent.children[0], child.id);
});

Deno.test("SemanticGraph - updates field", () => {
  const graph = new SemanticGraph();

  graph.create("node", "Foo", { about: "old value", status: "draft" });

  const result = graph.update("Foo", "about", "new value");

  assertEquals(result.oldValue, "old value");
  assertEquals(result.newValue, "new value");

  const node = graph.get("Foo");
  assertExists(node);
  assertEquals(node.fields.about, "new value");
});

Deno.test("SemanticGraph - detects cosmetic change", () => {
  const graph = new SemanticGraph();

  graph.create("node", "Foo", { about: "test", note: "old note" });

  const result = graph.update("Foo", "note", "new note");

  assertEquals(result.driftClass, "cosmetic");
});

Deno.test("SemanticGraph - queries node", () => {
  const graph = new SemanticGraph();

  graph.create("node", "Foo", { about: "test" });
  graph.spawn("Foo", "Child1");
  graph.spawn("Foo", "Child2");

  const result = graph.query("Foo");

  assertExists(result);
  assertEquals(result.childCount, 2);
  assertEquals(result.descendantCount, 2);
});

Deno.test("SemanticGraph - serializes and deserializes", () => {
  const graph = new SemanticGraph("test-namespace");

  graph.create("node", "Foo", { about: "test" });
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
  assertEquals(foo.fields.about, "test");
  assertEquals(foo.children.length, 1);
});

Deno.test("provenanceSymbol - returns correct symbols", () => {
  assertEquals(provenanceSymbol("organic"), "◉");
  assertEquals(provenanceSymbol("synthetic"), "○");
  assertEquals(provenanceSymbol("hybrid"), "◐");
  assertEquals(provenanceSymbol("unknown"), "◌");
});
