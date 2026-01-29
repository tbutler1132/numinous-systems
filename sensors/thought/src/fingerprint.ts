import { fingerprint } from "@numinous-systems/sensor";

/**
 * Generate a thought entry fingerprint.
 * Identity is based on normalized text content since thoughts
 * don't have natural unique keys like transactions do.
 *
 * Format: thought|inbox_md|entry|text_normalized
 */
export function thoughtEntryFingerprint(textNormalized: string): string {
  return fingerprint(["thought", "inbox_md", "entry", textNormalized]);
}
