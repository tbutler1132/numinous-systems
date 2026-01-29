import type { Sensor } from "@numinous-systems/sensor";
import { ingest } from "./ingest.js";
import { formatSummary } from "./format.js";

/**
 * Thought sensor - full Sensor implementation.
 * Provides ingest and formatSummary methods.
 */
export const sensor: Sensor = {
  id: "thought",
  name: "Thought Sensor",
  version: "1.0.0",
  domain: "thought",
  sources: ["inbox_md"],
  observationType: "entry",
  description: "Parses inbox markdown into thought observations",
  ingest,
  formatSummary,
};

// Export all types and functions
export * from "./types.js";
export * from "./fingerprint.js";
export * from "./inbox-parser.js";
export { ingest } from "./ingest.js";
export { formatSummary } from "./format.js";
