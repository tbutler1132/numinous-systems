import { fingerprint } from "@numinous-systems/sensor";

/**
 * Generate a finance transaction fingerprint per spec:
 * domain|source|type|observed_at|amount_cents|description_norm|account_label
 */
export function financeTransactionFingerprint(params: {
  observed_at: string;
  amount_cents: number;
  description_norm: string;
  account_label: string;
}): string {
  return fingerprint([
    "finance",
    "chase_csv",
    "transaction",
    params.observed_at,
    params.amount_cents,
    params.description_norm,
    params.account_label,
  ]);
}
