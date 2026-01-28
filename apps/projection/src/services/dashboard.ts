import type { Observation } from '@numinous-systems/sensor'
import { parseChaseCSVContent } from '@numinous-systems/finance/dist/chase-csv.js'
import { createStore, dbExists } from './store'

// ============================================================================
// Types
// ============================================================================

export interface RecentObservation {
  id: string
  observed_at: string
  domain: string
  type: string
  summary: string
}

export interface DomainStatus {
  domain: string
  count: number
  minObserved: string | null
  maxObserved: string | null
  lastIngest: {
    finishedAt: string
    status: string
    rowsInserted: number
  } | null
}

export interface DashboardStatus {
  exists: boolean
  domains: DomainStatus[]
  recent: RecentObservation[]
  error?: string
}

export interface IngestResult {
  success: boolean
  message: string
  details?: {
    filename: string
    rowsRead: number
    inserted: number
    skipped: number
    dateRange: string | null
    warnings: number
  }
}

// ============================================================================
// Helpers
// ============================================================================

function extractSummary(domain: string, payload: Record<string, unknown>): string {
  if (domain === 'finance') {
    const desc = payload.description_raw as string | undefined
    const amount = payload.amount_cents as number | undefined
    if (desc && amount !== undefined) {
      const amountStr =
        amount < 0
          ? `-$${(Math.abs(amount) / 100).toFixed(2)}`
          : `$${(amount / 100).toFixed(2)}`
      const shortDesc = desc.length > 30 ? desc.substring(0, 30) + '...' : desc
      return `${amountStr} ${shortDesc}`
    }
  }
  if (domain === 'thought') {
    const content = payload.content as string | undefined
    if (content) {
      return content.length > 50 ? content.substring(0, 50) + '...' : content
    }
  }
  const keys = Object.keys(payload)
  if (keys.length > 0) {
    const firstVal = payload[keys[0]]
    if (typeof firstVal === 'string') {
      return firstVal.length > 50 ? firstVal.substring(0, 50) + '...' : firstVal
    }
  }
  return '—'
}

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
 * Get dashboard status including domain stats and recent observations
 */
export async function getDashboardStatus(): Promise<DashboardStatus> {
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
 * Ingest a Chase CSV file content
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
