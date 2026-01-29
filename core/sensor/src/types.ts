/**
 * Core observation type - domain-agnostic record of something observed.
 * Finance, health, time, mood all use the same structure.
 *
 * Observations belong to a node's memory. The nodeId indicates whose
 * memory this observation lives in.
 */
export interface Observation {
  /** Deterministic fingerprint (SHA-256 of semantic fields) */
  id: string;
  /** The node whose memory this observation belongs to */
  node_id: string;
  /** When the observation occurred (ISO-8601 date or datetime) */
  observed_at: string;
  /** Domain namespace: 'finance', 'health', 'time', etc. */
  domain: string;
  /** Data source: 'chase_csv', 'oura_api', 'manual', etc. */
  source: string;
  /** Observation type within domain: 'transaction', 'sleep_session', etc. */
  type: string;
  /** Payload schema version for evolution */
  schema_version: number;
  /** Domain-specific data as JSON */
  payload: Record<string, unknown>;
  /** When this observation was ingested (ISO-8601 datetime) */
  ingested_at: string;
}

/**
 * Ingest run audit record - tracks each ingest operation
 */
export interface IngestRun {
  /** Unique run identifier (UUID) */
  run_id: string;
  /** When ingest started (ISO-8601 datetime) */
  started_at: string;
  /** When ingest finished (ISO-8601 datetime) */
  finished_at: string | null;
  /** Source file or directory path */
  source_file: string;
  /** Domain being ingested */
  domain: string;
  /** Total rows read from source */
  rows_read: number | null;
  /** Rows successfully inserted */
  rows_inserted: number | null;
  /** Rows skipped (duplicates) */
  rows_skipped: number | null;
  /** Earliest observation timestamp in batch */
  min_observed: string | null;
  /** Latest observation timestamp in batch */
  max_observed: string | null;
  /** Run status */
  status: IngestStatus;
}

/**
 * Result of an append operation
 */
export interface AppendResult {
  /** Number of observations inserted */
  inserted: number;
  /** Number of observations skipped (duplicates) */
  skipped: number;
  /** Warnings for potential issues (e.g., collision detection) */
  warnings: CollisionWarning[];
}

/**
 * Warning when same fingerprint but different source data detected
 */
export interface CollisionWarning {
  /** Row number in source file */
  row: number;
  /** The fingerprint ID that collided */
  id: string;
  /** Message describing the collision */
  message: string;
}

/**
 * Ingest run status
 */
export type IngestStatus = "success" | "failed" | "partial" | "running";

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
