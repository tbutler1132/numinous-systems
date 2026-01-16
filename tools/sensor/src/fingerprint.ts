import { createHash } from "node:crypto";

/**
 * Generate a deterministic SHA-256 fingerprint from input fields.
 * Used to create idempotent observation IDs.
 *
 * @param fields - Array of field values to hash (order matters)
 * @returns SHA-256 hex string
 */
export function fingerprint(fields: (string | number | null | undefined)[]): string {
  const normalized = fields
    .map((f) => (f === null || f === undefined ? "" : String(f)))
    .join("|");

  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generate a source row hash for collision detection.
 * Uses raw CSV fields to detect when semantic fingerprint collides
 * but underlying data differs.
 */
export function sourceRowHash(rawFields: string[]): string {
  return fingerprint(rawFields);
}
