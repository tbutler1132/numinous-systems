/**
 * Thought entry payload schema
 */
export interface ThoughtEntryPayload extends Record<string, unknown> {
  /** The full text including sub-bullets */
  text: string;
  /** Lowercase, trimmed for fingerprinting */
  text_normalized: string;
  /** Extracted [action], [idea], etc. */
  tags: string[];
  /** "Week of Jan 12" header text, null if not found */
  week_context: string | null;
}

/**
 * Parsed entry from inbox markdown
 */
export interface ParsedEntry {
  text: string;
  text_normalized: string;
  tags: string[];
  week_context: string | null;
  observed_at: string;
}

/**
 * Result from parsing inbox content
 */
export interface ParseResult {
  entries: ParsedEntry[];
  entryCount: number;
  minObserved: string | null;
  maxObserved: string | null;
}
