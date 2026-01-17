import { describe, it } from "node:test";
import assert from "node:assert";
import { parseChaseCSVContent } from "./chase-csv.js";

describe("parseChaseCSVContent", () => {
  it("should parse basic Chase CSV format", () => {
    const csv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,STARBUCKS STORE 12345,Food & Drink,Sale,-12.50,`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });

    assert.strictEqual(result.rowCount, 1);
    assert.strictEqual(result.observations.length, 1);

    const obs = result.observations[0];
    assert.strictEqual(obs.domain, "finance");
    assert.strictEqual(obs.source, "chase_csv");
    assert.strictEqual(obs.type, "transaction");
    assert.strictEqual(obs.observed_at, "2026-01-11");

    const payload = obs.payload as {
      amount_cents: number;
      description_raw: string;
      description_norm: string;
      account_label: string;
    };
    assert.strictEqual(payload.amount_cents, -1250);
    assert.strictEqual(payload.description_raw, "STARBUCKS STORE 12345");
    assert.strictEqual(payload.account_label, "checking");
  });

  it("should normalize descriptions", () => {
    const csv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,  starbucks  store   *1234,Food & Drink,Sale,-5.00,`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });
    const payload = result.observations[0].payload as { description_norm: string };

    // Should uppercase, collapse spaces, remove card suffix
    assert.strictEqual(payload.description_norm, "STARBUCKS STORE");
  });

  it("should handle positive amounts (credits)", () => {
    const csv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/07/2026,01/08/2026,VENMO PAYMENT,Personal,Payment,150.00,`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });
    const payload = result.observations[0].payload as { amount_cents: number };

    assert.strictEqual(payload.amount_cents, 15000);
  });

  it("should track date range", () => {
    const csv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/05/2026,01/06/2026,PURCHASE 1,Cat,Sale,-10.00,
01/10/2026,01/11/2026,PURCHASE 2,Cat,Sale,-20.00,
01/07/2026,01/08/2026,PURCHASE 3,Cat,Sale,-15.00,`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });

    assert.strictEqual(result.minObserved, "2026-01-06");
    assert.strictEqual(result.maxObserved, "2026-01-11");
  });

  it("should generate unique fingerprints for different transactions", () => {
    const csv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,STARBUCKS,Food,Sale,-12.50,
01/10/2026,01/11/2026,STARBUCKS,Food,Sale,-8.00,`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });

    assert.strictEqual(result.observations.length, 2);
    assert.notStrictEqual(result.observations[0].id, result.observations[1].id);
  });

  it("should generate same fingerprint for duplicate transactions", () => {
    const csv1 = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,STARBUCKS,Food,Sale,-12.50,`;

    const csv2 = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,STARBUCKS,Food,Sale,-12.50,`;

    const result1 = parseChaseCSVContent(csv1, { accountLabel: "checking" });
    const result2 = parseChaseCSVContent(csv2, { accountLabel: "checking" });

    assert.strictEqual(result1.observations[0].id, result2.observations[0].id);
  });

  it("should handle alternative date formats (Posting Date)", () => {
    const csv = `Transaction Date,Posting Date,Description,Amount
01/10/2026,01/11/2026,TEST PURCHASE,-25.00`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });

    assert.strictEqual(result.observations[0].observed_at, "2026-01-11");
  });

  it("should strip POS prefixes from descriptions", () => {
    const csv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,POS DEBIT GROCERY STORE,Food,Sale,-50.00,`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });
    const payload = result.observations[0].payload as { description_norm: string };

    assert.strictEqual(payload.description_norm, "GROCERY STORE");
  });

  it("should generate source row hashes for collision detection", () => {
    const csv = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/10/2026,01/11/2026,STARBUCKS,Food,Sale,-12.50,`;

    const result = parseChaseCSVContent(csv, { accountLabel: "checking" });

    assert.strictEqual(result.sourceRowHashes.size, 1);
    const hash = result.sourceRowHashes.get(result.observations[0].id);
    assert.ok(hash);
    assert.strictEqual(hash.length, 64);
  });
});
