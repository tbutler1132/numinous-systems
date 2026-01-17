import { readFileSync } from "node:fs";
import type { InboxItem, ValidTag } from "./types.js";
import { VALID_TAGS } from "./types.js";

/**
 * Parse inbox.md and extract items with their suggested tags.
 *
 * Rules:
 * - Everything before the first `---` line is header (skipped)
 * - A line starting with `- ` begins a new item
 * - Lines starting with `  ` (2+ spaces) or `  -` are continuations (nested bullets)
 * - Tags are extracted from `[tag]` at the end of the first line
 */
export function parseInbox(inboxPath: string): {
  items: InboxItem[];
  originalContent: string;
  headerEndLine: number;
} {
  const content = readFileSync(inboxPath, "utf-8");
  const lines = content.split("\n");

  // Find the separator line
  let headerEndLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      headerEndLine = i + 1; // 1-based, line after separator
      break;
    }
  }

  const items: InboxItem[] = [];
  let currentItem: {
    lines: string[];
    lineStart: number;
    firstLine: string;
  } | null = null;

  // Process lines after the separator
  for (let i = headerEndLine; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1; // 1-based

    // Check if this is a new top-level item
    if (line.startsWith("- ")) {
      // Save previous item if exists
      if (currentItem) {
        items.push(buildItem(currentItem));
      }

      // Start new item
      currentItem = {
        lines: [line],
        lineStart: lineNumber,
        firstLine: line,
      };
    } else if (currentItem && (line.startsWith("  ") || line.trim() === "")) {
      // Continuation of current item (nested bullet or indented text)
      // Empty lines within an item are kept as part of it
      if (line.trim() !== "" || currentItem.lines.length > 0) {
        currentItem.lines.push(line);
      }
    } else if (line.trim() === "") {
      // Empty line outside of an item - skip
      continue;
    }
  }

  // Don't forget the last item
  if (currentItem) {
    items.push(buildItem(currentItem));
  }

  return { items, originalContent: content, headerEndLine };
}

/**
 * Build an InboxItem from collected lines.
 */
function buildItem(data: {
  lines: string[];
  lineStart: number;
  firstLine: string;
}): InboxItem {
  // Trim trailing empty lines
  while (data.lines.length > 0 && data.lines[data.lines.length - 1].trim() === "") {
    data.lines.pop();
  }

  const content = data.lines.join("\n");
  const lineEnd = data.lineStart + data.lines.length - 1;

  // Extract tag and processed status from first line
  const suggestedTag = extractTag(data.firstLine);
  const isProcessed = isLineProcessed(data.firstLine);

  return {
    content,
    suggestedTag,
    lineStart: data.lineStart,
    lineEnd,
    isProcessed,
  };
}

/**
 * Extract a valid tag from the end of a line.
 * Looks for patterns like `[action]`, `[idea]`, `[action] ✓`, etc.
 */
function extractTag(line: string): ValidTag | null {
  // Match [tag] optionally followed by ✓
  const match = line.match(/\[(\w+)\]\s*✓?\s*$/);
  if (!match) return null;

  const tag = match[1].toLowerCase();
  if (VALID_TAGS.includes(tag as ValidTag)) {
    return tag as ValidTag;
  }

  return null;
}

/**
 * Check if a line has the processed marker (✓).
 */
function isLineProcessed(line: string): boolean {
  return /\[\w+\]\s*✓\s*$/.test(line);
}

/**
 * Get display text for an item (first line, cleaned up).
 * Removes the tag, processed marker, and bullet prefix for cleaner display.
 */
export function getDisplayText(item: InboxItem, maxLength = 60): string {
  let text = item.content.split("\n")[0];

  // Remove leading "- "
  if (text.startsWith("- ")) {
    text = text.slice(2);
  }

  // Remove trailing tag and ✓ marker
  text = text.replace(/\s*\[\w+\]\s*✓?\s*$/, "");

  // Truncate if needed
  if (text.length > maxLength) {
    text = text.slice(0, maxLength - 3) + "...";
  }

  return text;
}
