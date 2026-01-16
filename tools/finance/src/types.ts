/**
 * Finance transaction payload schema
 */
export interface FinanceTransactionPayload extends Record<string, unknown> {
  /** Amount in cents (negative = debit, positive = credit) */
  amount_cents: number;
  /** Original description from CSV */
  description_raw: string;
  /** Normalized description */
  description_norm: string;
  /** Account label (e.g., 'checking', 'savings') */
  account_label: string;
  /** When transaction posted (ISO date) */
  posted_at: string;
  /** When transaction occurred (ISO date) */
  transaction_at: string | null;
  /** Hash of raw CSV row for collision detection */
  source_row_hash: string;
}
