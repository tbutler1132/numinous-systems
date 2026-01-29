import { describe, it } from "node:test";
import assert from "node:assert";
import { fingerprint, sourceRowHash } from "./fingerprint.js";

describe("fingerprint", () => {
  it("should produce consistent hashes for same input", () => {
    const hash1 = fingerprint(["a", "b", "c"]);
    const hash2 = fingerprint(["a", "b", "c"]);
    assert.strictEqual(hash1, hash2);
  });

  it("should produce different hashes for different input", () => {
    const hash1 = fingerprint(["a", "b", "c"]);
    const hash2 = fingerprint(["a", "b", "d"]);
    assert.notStrictEqual(hash1, hash2);
  });

  it("should handle null and undefined as empty strings", () => {
    const hash1 = fingerprint(["a", null, "c"]);
    const hash2 = fingerprint(["a", "", "c"]);
    assert.strictEqual(hash1, hash2);

    const hash3 = fingerprint(["a", undefined, "c"]);
    assert.strictEqual(hash1, hash3);
  });

  it("should handle numbers", () => {
    const hash1 = fingerprint(["test", 123, "end"]);
    const hash2 = fingerprint(["test", "123", "end"]);
    assert.strictEqual(hash1, hash2);
  });

  it("should produce 64-character hex strings", () => {
    const hash = fingerprint(["test"]);
    assert.strictEqual(hash.length, 64);
    assert.match(hash, /^[a-f0-9]+$/);
  });
});

describe("sourceRowHash", () => {
  it("should produce consistent hashes", () => {
    const hash1 = sourceRowHash(["01/14/2026", "01/15/2026", "-12.50", "STARBUCKS"]);
    const hash2 = sourceRowHash(["01/14/2026", "01/15/2026", "-12.50", "STARBUCKS"]);
    assert.strictEqual(hash1, hash2);
  });

  it("should detect different raw data", () => {
    const hash1 = sourceRowHash(["01/14/2026", "01/15/2026", "-12.50", "STARBUCKS STORE 123"]);
    const hash2 = sourceRowHash(["01/14/2026", "01/15/2026", "-12.50", "STARBUCKS STORE 456"]);
    assert.notStrictEqual(hash1, hash2);
  });
});
