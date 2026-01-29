import { describe, it } from "node:test";
import assert from "node:assert";
import { parseMarkdownTableContent } from "./parser.js";

describe("parseMarkdownTableContent", () => {
  it("should parse a simple markdown table", () => {
    const content = `# Domains

| Domain | Registrar | Auto-Renew |
|--------|-----------|------------|
| example.com | Cloudflare | Yes |
| test.io | Namecheap | No |
`;

    const result = parseMarkdownTableContent(content, "domains.md");

    assert.strictEqual(result.entityType, "domain");
    assert.strictEqual(result.rowCount, 2);
    assert.deepStrictEqual(result.headers, ["domain", "registrar", "auto_renew"]);
    assert.strictEqual(result.entities[0].key, "example.com");
    assert.deepStrictEqual(result.entities[0].state, {
      domain: "example.com",
      registrar: "Cloudflare",
      auto_renew: "Yes",
    });
    assert.strictEqual(result.entities[1].key, "test.io");
  });

  it("should handle em-dash as null value", () => {
    const content = `| Name | Value |
|------|-------|
| foo | — |
| bar | something |
`;

    const result = parseMarkdownTableContent(content, "items.md");

    assert.strictEqual(result.entities[0].state.value, undefined);
    assert.strictEqual(result.entities[1].state.value, "something");
  });

  it("should normalize header names to snake_case", () => {
    const content = `| Monthly Limit | Auto-Renew | Purpose |
|---------------|------------|---------|
| $100 | Yes | Testing |
`;

    const result = parseMarkdownTableContent(content, "accounts.md");

    assert.deepStrictEqual(result.headers, [
      "monthly_limit",
      "auto_renew",
      "purpose",
    ]);
  });

  it("should derive singular entity type from plural filename", () => {
    assert.strictEqual(
      parseMarkdownTableContent("", "domains.md").entityType,
      "domain"
    );
    assert.strictEqual(
      parseMarkdownTableContent("", "accounts.md").entityType,
      "account"
    );
    assert.strictEqual(
      parseMarkdownTableContent("", "surfaces.md").entityType,
      "surface"
    );
  });

  it("should return empty result for content without tables", () => {
    const content = `# Just a heading

Some text without tables.
`;

    const result = parseMarkdownTableContent(content, "items.md");

    assert.strictEqual(result.rowCount, 0);
    assert.deepStrictEqual(result.entities, []);
  });

  it("should handle tables with surrounding content", () => {
    const content = `# Domains

Tracked domains owned by the Org.

---

| Domain | Registrar |
|--------|-----------|
| example.com | Cloudflare |

---

Some footer text.
`;

    const result = parseMarkdownTableContent(content, "domains.md");

    assert.strictEqual(result.rowCount, 1);
    assert.strictEqual(result.entities[0].key, "example.com");
  });
});
