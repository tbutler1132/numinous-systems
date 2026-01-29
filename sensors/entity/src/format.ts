import type { Observation } from "@numinous-systems/memory";
import type { Entity, EntityEventPayload } from "./types.js";

/**
 * Format an entity observation for display.
 */
export function formatSummary(observation: Observation): string {
  const payload = observation.payload as unknown as EntityEventPayload;

  return `[${payload.event_type}] ${payload.entity_type}:${payload.entity_key}`;
}

/**
 * Format entities as a markdown table.
 * Used by `entity project` to regenerate table from observations.
 */
export function formatMarkdownTable(entities: Entity[]): string {
  if (entities.length === 0) {
    return "";
  }

  // Collect all unique field names across entities
  const allFields = new Set<string>();
  for (const entity of entities) {
    for (const key of Object.keys(entity.state)) {
      allFields.add(key);
    }
  }

  const headers = Array.from(allFields).sort();

  if (headers.length === 0) {
    return "";
  }

  // Format header names for display (snake_case -> Title Case)
  const displayHeaders = headers.map((h) =>
    h
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );

  // Build table
  const lines: string[] = [];

  // Header row
  lines.push("| " + displayHeaders.join(" | ") + " |");

  // Separator row
  lines.push("| " + headers.map(() => "---").join(" | ") + " |");

  // Data rows
  for (const entity of entities) {
    const cells = headers.map((h) => {
      const value = entity.state[h];
      return value !== undefined && value !== null ? String(value) : "—";
    });
    lines.push("| " + cells.join(" | ") + " |");
  }

  return lines.join("\n");
}
