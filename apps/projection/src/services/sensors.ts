/**
 * @file Sensors service for observation management.
 *
 * This module provides the business logic for the sensors view:
 * - Querying observation status and statistics per domain
 * - Ingesting CSV files (currently Chase bank statements)
 * - Formatting observations for display
 *
 * The sensors view is a "device" surface that provides visibility into
 * the personal node's observation store.
 *
 * @see SensorsClient.tsx - UI that consumes this service
 * @see /api/sensors/* - API routes that call these functions
 */

import type { Observation } from '@numinous-systems/sensor'
import { parseChaseCSVContent } from '@numinous-systems/finance/dist/chase-csv.js'
import { createStore, dbExists } from './store'

// ============================================================================
// Types
// ============================================================================

/** A recent observation formatted for display */
export interface RecentObservation {
  id: string
  observed_at: string
  domain: string
  type: string
  summary: string
}

/** Statistics for a single observation domain (finance, thought, etc.) */
export interface DomainStatus {
  /** Domain identifier (e.g., 'finance', 'thought') */
  domain: string
  /** Total number of observations in this domain */
  count: number
  /** Earliest observation date (ISO string) */
  minObserved: string | null
  /** Latest observation date (ISO string) */
  maxObserved: string | null
  /** Information about the last ingest run, if any */
  lastIngest: {
    finishedAt: string
    status: string
    rowsInserted: number
  } | null
}

/** Complete sensors status returned by getSensorsStatus() */
export interface SensorsStatus {
  /** Whether the observation database exists */
  exists: boolean
  /** Status for each observation domain */
  domains: DomainStatus[]
  /** Most recent observations across all domains */
  recent: RecentObservation[]
  /** Error message if status retrieval failed */
  error?: string
}

/** Result of ingesting a CSV file */
export interface IngestResult {
  /** Whether the ingest succeeded */
  success: boolean
  /** Human-readable status message */
  message: string
  /** Detailed ingest statistics (only present on success) */
  details?: {
    /** Original filename */
    filename: string
    /** Number of rows parsed from the CSV */
    rowsRead: number
    /** Number of new observations inserted */
    inserted: number
    /** Number of duplicate observations skipped */
    skipped: number
    /** Date range covered (e.g., "2024-01-01 to 2024-01-31") */
    dateRange: string | null
    /** Number of parsing warnings encountered */
    warnings: number
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Truncates a string to a maximum length, adding ellipsis if truncated.
 *
 * @param str - String to truncate
 * @param maxLen - Maximum length before truncation
 * @returns Original string if short enough, or truncated with '...'
 */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str
}

/**
 * Extracts a human-readable summary from an observation's payload.
 *
 * Domain-specific formatting:
 * - finance: Amount and truncated description
 * - thought: Truncated content
 * - other: First string value from payload
 *
 * @param domain - Observation domain
 * @param payload - Raw observation payload
 * @returns Formatted summary string, or '—' if no summary available
 */
function extractSummary(domain: string, payload: Record<string, unknown>): string {
  if (domain === 'finance') {
    const desc = payload.description_raw as string | undefined
    const amount = payload.amount_cents as number | undefined
    if (desc && amount !== undefined) {
      const amountStr =
        amount < 0
          ? `-$${(Math.abs(amount) / 100).toFixed(2)}`
          : `$${(amount / 100).toFixed(2)}`
      return `${amountStr} ${truncate(desc, 30)}`
    }
  }
  if (domain === 'thought') {
    const content = payload.content as string | undefined
    if (content) {
      return truncate(content, 50)
    }
  }
  const keys = Object.keys(payload)
  if (keys.length > 0) {
    const firstVal = payload[keys[0]]
    if (typeof firstVal === 'string') {
      return truncate(firstVal, 50)
    }
  }
  return '—'
}

/**
 * Transforms a raw Observation into a RecentObservation for display.
 *
 * @param o - Raw observation from the store
 * @returns Formatted observation with truncated ID and summary
 */
function formatObservation(o: Observation): RecentObservation {
  return {
    id: o.id.substring(0, 8),
    observed_at: o.observed_at,
    domain: o.domain,
    type: o.type,
    summary: extractSummary(o.domain, o.payload),
  }
}

// ============================================================================
// Services
// ============================================================================

/**
 * Gets the complete sensors status including domain stats and recent observations.
 *
 * Returns domain-level statistics (counts, date ranges, last ingest) plus
 * the 10 most recent observations across all domains.
 *
 * @returns Sensors status, or { exists: false, ... } if database doesn't exist
 */
export async function getSensorsStatus(): Promise<SensorsStatus> {
  if (!dbExists()) {
    return { exists: false, domains: [], recent: [] }
  }

  const store = await createStore()
  try {
    const status = store.getStatus()
    const recentObs = store.queryObservations({ limit: 10 })
    const recent = recentObs.map(formatObservation)

    return { exists: true, ...status, recent }
  } finally {
    store.close()
  }
}

/**
 * Ingests a Chase bank CSV file into the observation store.
 *
 * Parses the CSV content using the finance sensor's parser, deduplicates
 * against existing observations using source row hashes, and records
 * the ingest run for tracking.
 *
 * @param content - Raw CSV file content as string
 * @param filename - Original filename (for ingest run tracking)
 * @returns Result indicating success/failure with details
 */
export async function ingestChaseCSV(
  content: string,
  filename: string
): Promise<IngestResult> {
  const parseResult = parseChaseCSVContent(content, {
    accountLabel: 'checking',
  })

  if (parseResult.observations.length === 0) {
    return {
      success: false,
      message: 'No valid transactions found in file',
    }
  }

  const store = await createStore()
  try {
    const runId = store.startIngestRun(filename, 'finance')

    const result = store.insertObservations(parseResult.observations, {
      sourceRowHashes: parseResult.sourceRowHashes,
    })

    store.finishIngestRun(runId, {
      rowsRead: parseResult.rowCount,
      rowsInserted: result.inserted,
      rowsSkipped: result.skipped,
      minObserved: parseResult.minObserved,
      maxObserved: parseResult.maxObserved,
      status: 'success',
    })

    return {
      success: true,
      message: `Ingested ${result.inserted} transactions`,
      details: {
        filename,
        rowsRead: parseResult.rowCount,
        inserted: result.inserted,
        skipped: result.skipped,
        dateRange:
          parseResult.minObserved && parseResult.maxObserved
            ? `${parseResult.minObserved} to ${parseResult.maxObserved}`
            : null,
        warnings: result.warnings.length,
      },
    }
  } finally {
    store.close()
  }
}
