import type { ParsedEntry, ParseResult } from "./types.js";

/**
 * Parse a week header like "## Week of Jan 12" into an ISO date string.
 * Returns the date of the Monday for that week in the current or most recent year.
 */
function parseWeekHeader(header: string): string | null {
  const match = header.match(/Week of\s+(\w+)\s+(\d+)/i);
  if (!match) return null;

  const [, monthStr, dayStr] = match;
  const month = parseMonth(monthStr);
  if (month === null) return null;

  const day = parseInt(dayStr, 10);

  // Determine year: use current year, or previous year if date is in future
  const now = new Date();
  let year = now.getFullYear();
  const candidateDate = new Date(year, month, day);

  if (candidateDate > now) {
    year -= 1;
  }

  const yyyy = year.toString();
  const mm = (month + 1).toString().padStart(2, "0");
  const dd = day.toString().padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse month name to 0-indexed month number.
 */
function parseMonth(monthStr: string): number | null {
  const months: Record<string, number> = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };
  return months[monthStr.toLowerCase()] ?? null;
}

/**
 * Extract tags like [action], [idea] from text.
 */
function extractTags(text: string): string[] {
  const tagPattern = /\[(\w+)\]/g;
  const tags: string[] = [];
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return tags;
}

/**
 * Normalize text for fingerprinting: lowercase, trim whitespace, collapse multiple spaces.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Check if a line is a top-level bullet (starts with "- " without leading whitespace).
 */
function isTopLevelBullet(line: string): boolean {
  return line.startsWith("- ");
}

/**
 * Check if a line is a sub-bullet (starts with whitespace then "- ").
 */
function isSubBullet(line: string): boolean {
  return /^\s+- /.test(line);
}

/**
 * Check if a line is a week header.
 */
function isWeekHeader(line: string): boolean {
  return line.startsWith("## Week of ");
}

/**
 * Parse inbox markdown content into thought entries.
 * Each top-level bullet (with its sub-bullets) becomes one observation.
 */
export function parseInboxContent(content: string): ParseResult {
  const lines = content.split("\n");
  const entries: ParsedEntry[] = [];

  let currentWeekContext: string | null = null;
  let currentObservedAt: string | null = null;
  let currentEntry: string[] | null = null;

  // Default to today if no week header is found
  const today = new Date().toISOString().split("T")[0];

  function flushEntry() {
    if (currentEntry && currentEntry.length > 0) {
      const text = currentEntry.join("\n");
      const textNormalized = normalizeText(text);
      const tags = extractTags(text);
      const observedAt = currentObservedAt ?? today;

      entries.push({
        text,
        text_normalized: textNormalized,
        tags,
        week_context: currentWeekContext,
        observed_at: observedAt,
      });
    }
    currentEntry = null;
  }

  for (const line of lines) {
    // Check for week header
    if (isWeekHeader(line)) {
      flushEntry();
      currentWeekContext = line.replace("## ", "").trim();
      currentObservedAt = parseWeekHeader(line);
      continue;
    }

    // Skip empty lines, horizontal rules, and non-bullet content before first bullet
    if (line.trim() === "" || line.startsWith("---") || line.startsWith("#")) {
      // Flush if we hit a section break
      if (line.startsWith("---")) {
        flushEntry();
      }
      continue;
    }

    // Top-level bullet starts a new entry
    if (isTopLevelBullet(line)) {
      flushEntry();
      currentEntry = [line];
      continue;
    }

    // Sub-bullet or continuation gets added to current entry
    if (currentEntry && (isSubBullet(line) || line.trim() !== "")) {
      currentEntry.push(line);
    }
  }

  // Flush final entry
  flushEntry();

  // Calculate date range
  let minObserved: string | null = null;
  let maxObserved: string | null = null;

  for (const entry of entries) {
    if (!minObserved || entry.observed_at < minObserved) {
      minObserved = entry.observed_at;
    }
    if (!maxObserved || entry.observed_at > maxObserved) {
      maxObserved = entry.observed_at;
    }
  }

  return {
    entries,
    entryCount: entries.length,
    minObserved,
    maxObserved,
  };
}
