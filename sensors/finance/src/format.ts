import type { Observation } from "@numinous-systems/memory";
import type { FinanceTransactionPayload } from "./types.js";

/**
 * Format a finance observation for display.
 * Returns amount and truncated description.
 */
export function formatSummary(observation: Observation): string {
  const payload = observation.payload as FinanceTransactionPayload;
  const amount = payload.amount_cents;
  const desc = payload.description_raw;

  if (desc && amount !== undefined) {
    const amountStr =
      amount < 0
        ? `-$${(Math.abs(amount) / 100).toFixed(2)}`
        : `$${(amount / 100).toFixed(2)}`;
    const truncated = desc.length > 30 ? desc.substring(0, 30) + "..." : desc;
    return `${amountStr} ${truncated}`;
  }
  return "—";
}
