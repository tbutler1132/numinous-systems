import type { Sensor } from "@numinous-systems/sensor";
import { ingest } from "./ingest.js";
import { formatSummary } from "./format.js";

/**
 * Entity sensor - full Sensor implementation.
 * Treats entities as projections over event streams.
 */
export const sensor: Sensor = {
  id: "entity",
  name: "Entity Sensor",
  version: "1.0.0",
  domain: "entity",
  sources: ["markdown_table"],
  observationType: "event",
  description: "Parses markdown tables into entity event observations",
  ingest,
  formatSummary,
};

export * from "./types.js";
export * from "./parser.js";
export * from "./derive.js";
export * from "./format.js";
export { ingest } from "./ingest.js";
