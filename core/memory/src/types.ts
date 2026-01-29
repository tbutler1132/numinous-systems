/**
 * Identity declaration - what makes an observation unique.
 * Sensors declare identity; Memory computes the fingerprint.
 *
 * The fingerprint is computed as: SHA-256(domain|source|type|value1|value2|...)
 * Domain, source, and type are taken from the observation itself.
 * Values are the additional fields that define uniqueness within that context.
 */
export interface ObservationIdentity {
  /**
   * Values that define uniqueness within this domain/source/type.
   * Order matters - must be consistent for the same observation type.
   */
  values: (string | number | null | undefined)[];
}

/**
 * Core observation type - domain-agnostic record of something observed.
 * Finance, health, time, mood all use the same structure.
 *
 * Observations belong to a node's memory. The nodeId indicates whose
 * memory this observation lives in.
 */
export interface Observation {
  /**
   * Deterministic fingerprint (SHA-256 of semantic fields).
   * Can be omitted if identity is provided - Memory will compute it.
   */
  id?: string;
  /**
   * Identity declaration - what makes this observation unique.
   * Used to compute id if not provided directly.
   * New sensors should use this instead of computing id themselves.
   */
  identity?: ObservationIdentity;
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
 * An observation as stored in the database - id is always present.
 * Query methods return this type since stored observations always have computed ids.
 */
export interface StoredObservation extends Omit<Observation, "id" | "identity"> {
  /** Deterministic fingerprint - always present for stored observations */
  id: string;
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
