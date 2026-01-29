import type { Observation, ObservationStore } from "@numinous-systems/memory";

/**
 * Sensor plugin descriptor - declares what a sensor is and what it does.
 * Each sensor exports one of these to identify itself to the registry.
 */
export interface SensorDescriptor {
  /** Unique identifier, e.g., 'finance' */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semantic version */
  version: string;
  /** Observation domain, e.g., 'finance' */
  domain: string;
  /** Data sources handled, e.g., ['chase_csv'] */
  sources: string[];
  /** Type of observations produced */
  observationType: string;
  /** What this sensor does */
  description?: string;
}

/**
 * Result of an ingest operation.
 * Returned by Sensor.ingest() to report what happened.
 */
export interface IngestResult {
  /** Whether the ingest succeeded */
  success: boolean;
  /** Human-readable status message */
  message: string;
  /** Detailed ingest statistics (only present on success) */
  details?: {
    /** Original filename */
    filename: string;
    /** Number of rows parsed from the source */
    rowsRead: number;
    /** Number of new observations inserted */
    inserted: number;
    /** Number of duplicate observations skipped */
    skipped: number;
    /** Date range covered (e.g., "2024-01-01 to 2024-01-31") */
    dateRange: string | null;
    /** Number of parsing warnings encountered */
    warnings: number;
  };
}

/**
 * Context provided to Sensor.ingest() for storing observations.
 */
export interface IngestContext {
  /** The observation store to write to */
  store: ObservationStore;
  /** The node ID observations belong to */
  nodeId: string;
  /** Source filename for audit logging */
  filename: string;
}

/**
 * Full sensor interface with ingest and format methods.
 * Extends SensorDescriptor with operational methods.
 */
export interface Sensor extends SensorDescriptor {
  /** Ingest content into the observation store */
  ingest(content: string, context: IngestContext): Promise<IngestResult>;
  /** Format an observation for display */
  formatSummary(observation: Observation): string;
}
