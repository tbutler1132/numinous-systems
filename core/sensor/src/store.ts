import initSqlJs, { Database } from "sql.js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type {
  Observation,
  IngestRun,
  IngestStatus,
  AppendResult,
  CollisionWarning,
} from "./types.js";

// Schema SQL
const SCHEMA = `
-- Core observations table - append-only, generic
CREATE TABLE IF NOT EXISTS observations (
  id              TEXT PRIMARY KEY,
  observed_at     TEXT NOT NULL,
  domain          TEXT NOT NULL,
  source          TEXT NOT NULL,
  type            TEXT NOT NULL,
  schema_version  INTEGER NOT NULL DEFAULT 1,
  payload         TEXT NOT NULL,
  ingested_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_observed_at ON observations(observed_at);
CREATE INDEX IF NOT EXISTS idx_domain ON observations(domain);
CREATE INDEX IF NOT EXISTS idx_domain_type ON observations(domain, type);

-- Ingest audit log
CREATE TABLE IF NOT EXISTS ingest_runs (
  run_id        TEXT PRIMARY KEY,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  source_file   TEXT NOT NULL,
  domain        TEXT NOT NULL,
  rows_read     INTEGER,
  rows_inserted INTEGER,
  rows_skipped  INTEGER,
  min_observed  TEXT,
  max_observed  TEXT,
  status        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ingest_domain ON ingest_runs(domain);
CREATE INDEX IF NOT EXISTS idx_ingest_started ON ingest_runs(started_at);
`;

/**
 * Observation memory store backed by SQLite (sql.js).
 * Handles observation storage, deduplication, and ingest auditing.
 */
export class ObservationStore {
  private db: Database;
  private dbPath: string;

  private constructor(db: Database, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  /**
   * Map sql.js result columns and values to an object
   */
  private rowToObject(
    columns: string[],
    values: unknown[]
  ): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = values[i];
    });
    return obj;
  }

  /**
   * Create and initialize an ObservationStore
   */
  static async create(dbPath: string): Promise<ObservationStore> {
    const SQL = await initSqlJs();

    // Ensure directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Load existing database or create new
    let db: Database;
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    // Initialize schema
    db.run(SCHEMA);

    return new ObservationStore(db, dbPath);
  }

  /**
   * Save database to disk and close
   */
  close(): void {
    this.save();
    this.db.close();
  }

  /**
   * Save database to disk
   */
  save(): void {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    writeFileSync(this.dbPath, buffer);
  }

  /**
   * Insert observations with idempotent conflict handling.
   * Returns count of inserted vs skipped, plus any collision warnings.
   *
   * @param options.saveOnInsert - Whether to save to disk after insert (default: true).
   *                                Set to false for real-time ingestion to batch saves.
   */
  insertObservations(
    observations: Observation[],
    options?: {
      sourceRowHashes?: Map<string, string>;
      saveOnInsert?: boolean;
    }
  ): AppendResult {
    const sourceRowHashes = options?.sourceRowHashes ?? new Map();
    const saveOnInsert = options?.saveOnInsert ?? true;
    let inserted = 0;
    let skipped = 0;
    const warnings: CollisionWarning[] = [];

    for (let i = 0; i < observations.length; i++) {
      const o = observations[i];
      const payloadJson = JSON.stringify(o.payload);

      // Check if already exists
      const existing = this.db.exec(
        "SELECT payload FROM observations WHERE id = ?",
        [o.id]
      );

      if (existing.length > 0 && existing[0].values.length > 0) {
        // Check for collision (same fingerprint, different source data)
        const newSourceHash = sourceRowHashes.get(o.id);
        if (newSourceHash) {
          const existingPayload = JSON.parse(
            existing[0].values[0][0] as string
          ) as Record<string, unknown>;
          const existingSourceHash = existingPayload.source_row_hash as
            | string
            | undefined;

          if (existingSourceHash && existingSourceHash !== newSourceHash) {
            warnings.push({
              row: i + 1,
              id: o.id,
              message:
                "possible duplicate suppressed (same fingerprint, different raw data)",
            });
          }
        }
        skipped++;
      } else {
        this.db.run(
          `INSERT OR IGNORE INTO observations 
            (id, observed_at, domain, source, type, schema_version, payload, ingested_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            o.id,
            o.observed_at,
            o.domain,
            o.source,
            o.type,
            o.schema_version,
            payloadJson,
            o.ingested_at,
          ]
        );
        inserted++;
      }
    }

    // Save after batch insert (unless disabled for real-time ingestion)
    if (saveOnInsert) {
      this.save();
    }

    return { inserted, skipped, warnings };
  }

  /**
   * Start an ingest run for audit logging
   */
  startIngestRun(sourceFile: string, domain: string): string {
    const runId = randomUUID();
    const startedAt = new Date().toISOString();

    this.db.run(
      `INSERT INTO ingest_runs (run_id, started_at, source_file, domain, status)
       VALUES (?, ?, ?, ?, 'running')`,
      [runId, startedAt, sourceFile, domain]
    );

    this.save();
    return runId;
  }

  /**
   * Finish an ingest run with results
   */
  finishIngestRun(
    runId: string,
    result: {
      rowsRead: number;
      rowsInserted: number;
      rowsSkipped: number;
      minObserved: string | null;
      maxObserved: string | null;
      status: Exclude<IngestStatus, "running">;
    }
  ): void {
    const finishedAt = new Date().toISOString();

    this.db.run(
      `UPDATE ingest_runs SET
        finished_at = ?,
        rows_read = ?,
        rows_inserted = ?,
        rows_skipped = ?,
        min_observed = ?,
        max_observed = ?,
        status = ?
       WHERE run_id = ?`,
      [
        finishedAt,
        result.rowsRead,
        result.rowsInserted,
        result.rowsSkipped,
        result.minObserved,
        result.maxObserved,
        result.status,
        runId,
      ]
    );

    this.save();
  }

  /**
   * Get an ingest run by ID
   */
  getIngestRun(runId: string): IngestRun | null {
    const result = this.db.exec("SELECT * FROM ingest_runs WHERE run_id = ?", [
      runId,
    ]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = this.rowToObject(result[0].columns, result[0].values[0]);

    return {
      run_id: row.run_id as string,
      started_at: row.started_at as string,
      finished_at: row.finished_at as string | null,
      source_file: row.source_file as string,
      domain: row.domain as string,
      rows_read: row.rows_read as number | null,
      rows_inserted: row.rows_inserted as number | null,
      rows_skipped: row.rows_skipped as number | null,
      min_observed: row.min_observed as string | null,
      max_observed: row.max_observed as string | null,
      status: row.status as IngestRun["status"],
    };
  }

  /**
   * Check if an observation with the given ID exists
   */
  hasObservation(id: string): boolean {
    const result = this.db.exec(
      "SELECT 1 FROM observations WHERE id = ? LIMIT 1",
      [id]
    );
    return result.length > 0 && result[0].values.length > 0;
  }

  /**
   * Query observations with optional filters
   */
  queryObservations(filter?: {
    domain?: string;
    type?: string;
    since?: string;
    until?: string;
    limit?: number;
  }): Observation[] {
    let sql = "SELECT * FROM observations WHERE 1=1";
    const params: unknown[] = [];

    if (filter?.domain) {
      sql += " AND domain = ?";
      params.push(filter.domain);
    }
    if (filter?.type) {
      sql += " AND type = ?";
      params.push(filter.type);
    }
    if (filter?.since) {
      sql += " AND observed_at >= ?";
      params.push(filter.since);
    }
    if (filter?.until) {
      sql += " AND observed_at <= ?";
      params.push(filter.until);
    }

    sql += " ORDER BY observed_at DESC";

    if (filter?.limit) {
      sql += " LIMIT ?";
      params.push(filter.limit);
    }

    const result = this.db.exec(sql, params as (string | number | null)[]);

    if (result.length === 0) {
      return [];
    }

    const { columns, values } = result[0];
    return values.map((rowValues) => {
      const row = this.rowToObject(columns, rowValues);
      return {
        id: row.id as string,
        observed_at: row.observed_at as string,
        domain: row.domain as string,
        source: row.source as string,
        type: row.type as string,
        schema_version: row.schema_version as number,
        payload: JSON.parse(row.payload as string) as Record<string, unknown>,
        ingested_at: row.ingested_at as string,
      };
    });
  }

  /**
   * Get observation counts by domain
   */
  getCounts(): Record<string, number> {
    const result = this.db.exec(
      "SELECT domain, COUNT(*) as count FROM observations GROUP BY domain"
    );

    if (result.length === 0) {
      return {};
    }

    const counts: Record<string, number> = {};
    for (const row of result[0].values) {
      counts[row[0] as string] = row[1] as number;
    }
    return counts;
  }

  /**
   * Get status summary for dashboard display
   */
  getStatus(): {
    domains: Array<{
      domain: string;
      count: number;
      minObserved: string | null;
      maxObserved: string | null;
      lastIngest: {
        finishedAt: string;
        status: string;
        rowsInserted: number;
      } | null;
    }>;
  } {
    // Get counts and date ranges per domain
    const domainStats = this.db.exec(`
      SELECT
        domain,
        COUNT(*) as count,
        MIN(observed_at) as min_observed,
        MAX(observed_at) as max_observed
      FROM observations
      GROUP BY domain
    `);

    // Get latest successful ingest per domain
    const latestIngests = this.db.exec(`
      SELECT
        domain,
        finished_at,
        status,
        rows_inserted
      FROM ingest_runs
      WHERE (domain, finished_at) IN (
        SELECT domain, MAX(finished_at)
        FROM ingest_runs
        WHERE status = 'success'
        GROUP BY domain
      )
    `);

    // Build lookup for latest ingests
    const ingestByDomain = new Map<
      string,
      { finishedAt: string; status: string; rowsInserted: number }
    >();
    if (latestIngests.length > 0) {
      for (const row of latestIngests[0].values) {
        ingestByDomain.set(row[0] as string, {
          finishedAt: row[1] as string,
          status: row[2] as string,
          rowsInserted: row[3] as number,
        });
      }
    }

    // Combine into result
    const domains: Array<{
      domain: string;
      count: number;
      minObserved: string | null;
      maxObserved: string | null;
      lastIngest: {
        finishedAt: string;
        status: string;
        rowsInserted: number;
      } | null;
    }> = [];

    if (domainStats.length > 0) {
      for (const row of domainStats[0].values) {
        const domain = row[0] as string;
        domains.push({
          domain,
          count: row[1] as number,
          minObserved: row[2] as string | null,
          maxObserved: row[3] as string | null,
          lastIngest: ingestByDomain.get(domain) ?? null,
        });
      }
    }

    return { domains };
  }
}

/**
 * Resolve the database path for a given node
 * "private" maps to nodes/org/private/ (personal content within org)
 */
export function resolveDbPath(workspaceRoot: string, nodeName: string): string {
  if (nodeName === "private") {
    return `${workspaceRoot}/nodes/org/private/data/observations.db`;
  }
  return `${workspaceRoot}/nodes/${nodeName}/data/observations.db`;
}
