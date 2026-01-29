/**
 * @file Sensors service for observation management.
 *
 * This module provides the business logic for the sensors view:
 * - Querying observation status and statistics per domain
 * - Ingesting content via registered sensors
 * - Formatting observations for display
 *
 * The sensors view is a "device" surface that provides visibility into
 * a node's observation store.
 *
 * @see SensorsClient.tsx - UI that consumes this service
 * @see /api/sensors/* - API routes that call these functions
 */

import type { Observation } from '@numinous-systems/memory'
import type { IngestResult } from '@numinous-systems/sensor'
import { registry } from '@numinous-systems/sensor'
import { sensor as financeSensor } from '@numinous-systems/finance'
import { createStore, dbExists } from './store'

// Register sensors on module load
if (!registry.has('finance')) {
  registry.register(financeSensor)
}

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

// Re-export IngestResult from core for convenience
export type { IngestResult }

// ============================================================================
// Helpers
// ============================================================================

/**
 * Truncates a string to a maximum length, adding ellipsis if truncated.
 */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str
}

/**
 * Formats an observation for display using the registered sensor.
 * Falls back to generic formatting if sensor not found.
 */
function formatObservationSummary(observation: Observation): string {
  const sensor = registry.getSensor(observation.domain)
  if (sensor) {
    return sensor.formatSummary(observation)
  }

  // Fallback for domains without a registered sensor
  const payload = observation.payload
  if (observation.domain === 'thought') {
    const content = payload.content as string | undefined
    if (content) {
      return truncate(content, 50)
    }
  }

  // Generic fallback: first string value
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
 */
function formatObservation(o: Observation): RecentObservation {
  return {
    id: o.id.substring(0, 8),
    observed_at: o.observed_at,
    domain: o.domain,
    type: o.type,
    summary: formatObservationSummary(o),
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
 * @param nodeId - The node identifier (default: 'personal')
 * @returns Sensors status, or { exists: false, ... } if database doesn't exist
 */
export async function getSensorsStatus(nodeId: string = 'personal'): Promise<SensorsStatus> {
  if (!dbExists(nodeId)) {
    return { exists: false, domains: [], recent: [] }
  }

  const store = await createStore(nodeId)
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
 * Ingests content using a registered sensor.
 *
 * Routes to the appropriate sensor based on domain, using the sensor's
 * ingest method to parse and store observations.
 *
 * @param content - Raw content to ingest
 * @param filename - Original filename (for ingest run tracking)
 * @param domain - Sensor domain (e.g., 'finance')
 * @param nodeId - The node identifier (default: 'personal')
 * @returns Result indicating success/failure with details
 */
export async function ingestContent(
  content: string,
  filename: string,
  domain: string,
  nodeId: string = 'personal'
): Promise<IngestResult> {
  const sensor = registry.getSensor(domain)
  if (!sensor) {
    return {
      success: false,
      message: `No sensor registered for domain: ${domain}`,
    }
  }

  const store = await createStore(nodeId)
  try {
    return await sensor.ingest(content, { store, nodeId, filename })
  } finally {
    store.close()
  }
}

/**
 * Ingests a Chase bank CSV file into the observation store.
 *
 * @deprecated Use ingestContent(content, filename, 'finance') instead
 */
export async function ingestChaseCSV(
  content: string,
  filename: string
): Promise<IngestResult> {
  return ingestContent(content, filename, 'finance')
}
