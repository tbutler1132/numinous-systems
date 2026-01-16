import { describe, it } from "node:test";
import assert from "node:assert";
import { financeTransactionFingerprint } from "./fingerprint.js";

describe("financeTransactionFingerprint", () => {
  it("should produce consistent fingerprints for transactions", () => {
    const fp1 = financeTransactionFingerprint({
      observed_at: "2026-01-14",
      amount_cents: -1250,
      description_norm: "STARBUCKS",
      account_label: "checking",
    });
    const fp2 = financeTransactionFingerprint({
      observed_at: "2026-01-14",
      amount_cents: -1250,
      description_norm: "STARBUCKS",
      account_label: "checking",
    });
    assert.strictEqual(fp1, fp2);
  });

  it("should differentiate by amount", () => {
    const fp1 = financeTransactionFingerprint({
      observed_at: "2026-01-14",
      amount_cents: -1250,
      description_norm: "STARBUCKS",
      account_label: "checking",
    });
    const fp2 = financeTransactionFingerprint({
      observed_at: "2026-01-14",
      amount_cents: -1500,
      description_norm: "STARBUCKS",
      account_label: "checking",
    });
    assert.notStrictEqual(fp1, fp2);
  });

  it("should differentiate by date", () => {
    const fp1 = financeTransactionFingerprint({
      observed_at: "2026-01-14",
      amount_cents: -1250,
      description_norm: "STARBUCKS",
      account_label: "checking",
    });
    const fp2 = financeTransactionFingerprint({
      observed_at: "2026-01-15",
      amount_cents: -1250,
      description_norm: "STARBUCKS",
      account_label: "checking",
    });
    assert.notStrictEqual(fp1, fp2);
  });

  it("should differentiate by account", () => {
    const fp1 = financeTransactionFingerprint({
      observed_at: "2026-01-14",
      amount_cents: -1250,
      description_norm: "STARBUCKS",
      account_label: "checking",
    });
    const fp2 = financeTransactionFingerprint({
      observed_at: "2026-01-14",
      amount_cents: -1250,
      description_norm: "STARBUCKS",
      account_label: "savings",
    });
    assert.notStrictEqual(fp1, fp2);
  });
});
