// Sensor - Domain-agnostic observation infrastructure

export * from "./types.js";
export * from "./registry.js";
export * from "./node-config.js";

// Re-export specific types for convenience
export type {
  Sensor,
  SensorDescriptor,
  IngestResult,
  IngestContext,
} from "./types.js";

// Re-export from memory for backwards compatibility
// New code should import directly from @numinous-systems/memory
export {
  ObservationStore,
  resolveDbPath,
  fingerprint,
  sourceRowHash,
} from "@numinous-systems/memory";
export type {
  Observation,
  IngestRun,
  AppendResult,
  CollisionWarning,
  IngestStatus,
} from "@numinous-systems/memory";
