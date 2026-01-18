import { fingerprint } from "@numinous-systems/sensor";

/**
 * Generate a deterministic fingerprint for a thought entry.
 * Based on domain, type, and content only — tags are NOT part of the fingerprint.
 * This means the same thought processed twice will be detected as a duplicate.
 *
 * @param content - The thought content (including any sub-bullets)
 * @returns SHA-256 hex string
 */
export function thoughtFingerprint(content: string): string {
  return fingerprint(["thought", "entry", content]);
}
