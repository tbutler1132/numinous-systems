import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { sourceRowHash, type Observation } from "@numinous-systems/sensor";
import { financeTransactionFingerprint } from "./fingerprint.js";
import type { FinanceTransactionPayload } from "./types.js";

/**
 * Chase CSV row structure (credit card or checking account export)
 */
interface ChaseCSVRow {
  "Transaction Date"?: string;
  "Post Date"?: string;
  "Posting Date"?: string;
  Description: string;
  Amount: string;
  Type?: string;
  Category?: string;
  Memo?: string;
  Balance?: string;
  "Check or Slip #"?: string;
}

/**
 * Options for parsing Chase CSV
 */
export interface ParseOptions {
  accountLabel: string;
}

/**
 * Result of parsing a Chase CSV file
 */
export interface ParseResult {
  observations: Observation[];
  sourceRowHashes: Map<string, string>;
  minObserved: string | null;
  maxObserved: string | null;
  rowCount: number;
}

/**
 * Parse a Chase CSV file into observations
 */
export function parseChaseCSV(
  filePath: string,
  options: ParseOptions
): ParseResult {
  const content = readFileSync(filePath, "utf-8");
  return parseChaseCSVContent(content, options);
}

/**
 * Parse Chase CSV content into observations
 */
export function parseChaseCSVContent(
  content: string,
  options: ParseOptions
): ParseResult {
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ChaseCSVRow[];

  const observations: Observation[] = [];
  const sourceHashes = new Map<string, string>();
  let minObserved: string | null = null;
  let maxObserved: string | null = null;
  const ingestedAt = new Date().toISOString();

  for (const row of rows) {
    // Parse dates - prefer Post Date, fall back to Transaction Date
    const postedAt = normalizeDate(
      row["Post Date"] || row["Posting Date"] || null
    );
    const transactionAt = normalizeDate(row["Transaction Date"] || null);
    const observedAt = postedAt || transactionAt;

    if (!observedAt) {
      // Skip rows without valid dates
      continue;
    }

    // Track date range
    if (!minObserved || observedAt < minObserved) {
      minObserved = observedAt;
    }
    if (!maxObserved || observedAt > maxObserved) {
      maxObserved = observedAt;
    }

    // Parse and normalize
    const amountCents = parseAmountToCents(row.Amount);
    const descriptionRaw = row.Description;
    const descriptionNorm = normalizeDescription(descriptionRaw);

    // Compute fingerprint
    const id = financeTransactionFingerprint({
      observed_at: observedAt,
      amount_cents: amountCents,
      description_norm: descriptionNorm,
      account_label: options.accountLabel,
    });

    // Compute source row hash for collision detection
    const rawHash = sourceRowHash([
      row["Transaction Date"] || "",
      row["Post Date"] || row["Posting Date"] || "",
      row.Amount,
      descriptionRaw,
      row["Check or Slip #"] || "",
    ]);
    sourceHashes.set(id, rawHash);

    // Build payload
    const payload: FinanceTransactionPayload = {
      amount_cents: amountCents,
      description_raw: descriptionRaw,
      description_norm: descriptionNorm,
      account_label: options.accountLabel,
      posted_at: postedAt || observedAt,
      transaction_at: transactionAt,
      source_row_hash: rawHash,
    };

    observations.push({
      id,
      observed_at: observedAt,
      domain: "finance",
      source: "chase_csv",
      type: "transaction",
      schema_version: 1,
      payload,
      ingested_at: ingestedAt,
    });
  }

  return {
    observations,
    sourceRowHashes: sourceHashes,
    minObserved,
    maxObserved,
    rowCount: rows.length,
  };
}

/**
 * Normalize date to ISO YYYY-MM-DD format
 * Handles common Chase formats: MM/DD/YYYY, MM/DD/YY
 */
function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  // Handle MM/DD/YYYY or MM/DD/YY
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Handle YYYY-MM-DD (already ISO)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return dateStr;
  }

  return null;
}

/**
 * Parse amount string to signed integer cents
 * Debit (money out) = negative
 * Credit (money in) = positive
 */
function parseAmountToCents(amountStr: string): number {
  // Remove currency symbols, commas, spaces
  const cleaned = amountStr.replace(/[$,\s]/g, "");
  const value = parseFloat(cleaned);

  if (isNaN(value)) {
    return 0;
  }

  // Convert to cents (round to avoid floating point issues)
  return Math.round(value * 100);
}

/**
 * Normalize description for fingerprinting
 * Conservative approach per spec:
 * - Uppercase
 * - Trim whitespace
 * - Collapse repeated spaces
 * - Remove card suffixes (*1234, #1234)
 * - Remove common POS prefixes
 */
function normalizeDescription(desc: string): string {
  const normalized = desc
    .toUpperCase()
    .trim()
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    // Remove card number suffixes like *1234 or #1234
    .replace(/[*#]\d{4,}$/g, "")
    .replace(/\s+[*#]\d{4,}\s*/g, " ")
    // Remove common POS prefixes
    .replace(/^POS\s+(DEBIT\s+)?/i, "")
    .replace(/^POS\s+/i, "")
    // Clean up trailing/leading whitespace again
    .trim();

  return normalized;
}
