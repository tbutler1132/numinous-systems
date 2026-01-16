/**
 * Valid tags for thought entries.
 * This list can evolve organically as patterns emerge.
 */
export const VALID_TAGS = ["action", "idea", "episode", "question"] as const;
export type ValidTag = (typeof VALID_TAGS)[number];

/**
 * A parsed item from the inbox.
 */
export interface InboxItem {
  /** Full text including sub-bullets */
  content: string;
  /** Tag parsed from [tag] at end of first line, if present */
  suggestedTag: ValidTag | null;
  /** 1-based line number where item starts */
  lineStart: number;
  /** 1-based line number where item ends (inclusive) */
  lineEnd: number;
  /** Whether this item has already been processed (has ✓ marker) */
  isProcessed: boolean;
}

/**
 * Payload stored in observation for thought entries.
 */
export interface ThoughtPayload {
  /** The raw thought text */
  content: string;
  /** Tags assigned during processing */
  tags: string[];
}

/**
 * Result of processing an item.
 */
export type ProcessResult =
  | { action: "saved"; tag: ValidTag }
  | { action: "deleted" }
  | { action: "skipped" }
  | { action: "duplicate" }
  | { action: "exit" };
