import type { Observation } from "@numinous-systems/memory";
import type { ThoughtEntryPayload } from "./types.js";

/**
 * Format a thought observation for display.
 * Returns first ~50 chars of text, truncated with "..."
 */
export function formatSummary(observation: Observation): string {
  const payload = observation.payload as ThoughtEntryPayload;
  const text = payload.text;

  if (!text) {
    return "—";
  }

  // Get first line, strip leading "- "
  const firstLine = text.split("\n")[0].replace(/^- /, "");

  if (firstLine.length <= 50) {
    return firstLine;
  }

  return firstLine.substring(0, 50) + "...";
}
