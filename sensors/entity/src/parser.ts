import { basename } from "node:path";
import type { ParseResult } from "./types.js";

/**
 * Normalize a header name to snake_case for use as a field key.
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Derive entity type from filename.
 * "domains.md" -> "domain", "accounts.md" -> "account"
 */
function deriveEntityType(filename: string): string {
  const base = basename(filename, ".md");
  // Remove trailing 's' for plural -> singular
  if (base.endsWith("s") && base.length > 1) {
    return base.slice(0, -1);
  }
  return base;
}

/**
 * Derive a unique key for an entity from its row data.
 * Uses the first column value as the key.
 */
function deriveKey(row: Record<string, unknown>, headers: string[]): string {
  const firstField = headers[0];
  if (firstField && row[firstField]) {
    return String(row[firstField]);
  }
  // Fallback: hash of all values
  return Object.values(row).join("|");
}

/**
 * Parse a markdown table into rows.
 * Returns headers and data rows.
 */
function parseMarkdownTable(
  content: string
): { headers: string[]; rows: string[][] } | null {
  const lines = content.split("\n");

  // Find header row (first line with pipes)
  let headerLine: string | null = null;
  let headerIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.includes("|")) {
      headerLine = line;
      headerIndex = i;
      break;
    }
  }

  if (!headerLine || headerIndex === -1) {
    return null;
  }

  // Parse headers
  const headers = headerLine
    .split("|")
    .map((h) => h.trim())
    .filter((h) => h.length > 0)
    .map(normalizeHeader);

  if (headers.length === 0) {
    return null;
  }

  // Skip separator row (the |---|---|---| row)
  const dataStartIndex = headerIndex + 2;

  // Parse data rows
  const rows: string[][] = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop at empty line or non-table line
    if (!line || !line.startsWith("|")) {
      break;
    }

    // Skip separator-like rows
    if (/^\|[\s-|]+\|$/.test(line)) {
      continue;
    }

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove first/last empty from split

    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

/**
 * Parse markdown table content into entity records.
 */
export function parseMarkdownTableContent(
  content: string,
  filename: string
): ParseResult {
  const entityType = deriveEntityType(filename);
  const parsed = parseMarkdownTable(content);

  if (!parsed || parsed.rows.length === 0) {
    return {
      entityType,
      entities: [],
      headers: [],
      rowCount: 0,
    };
  }

  const { headers, rows } = parsed;
  const entities: ParseResult["entities"] = [];

  for (const row of rows) {
    const state: Record<string, unknown> = {};

    // Map each cell to its header
    for (let i = 0; i < headers.length; i++) {
      const value = row[i] ?? "";
      // Store non-empty values, normalize "—" to null
      if (value && value !== "—") {
        state[headers[i]] = value;
      }
    }

    const key = deriveKey(state, headers);
    entities.push({ key, state });
  }

  return {
    entityType,
    entities,
    headers,
    rowCount: entities.length,
  };
}
