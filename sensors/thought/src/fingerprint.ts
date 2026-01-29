import { fingerprint } from "@numinous-systems/sensor";

/**
 * Generate a thought entry fingerprint.
 * Identity is based on normalized text content since thoughts
 * don't have natural unique keys like transactions do.
 *
 * Format: thought|inbox_md|entry|text_normalized
 *
 * @deprecated Sensors should now declare identity fields instead of computing
 * fingerprints directly. Use observation.identity.values = [text_normalized]
 * and let Memory compute the fingerprint.
 */
export function thoughtEntryFingerprint(textNormalized: string): string {
  return fingerprint(["thought", "inbox_md", "entry", textNormalized]);
}
