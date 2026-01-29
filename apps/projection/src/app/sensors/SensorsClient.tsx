/**
 * @file SensorsClient - Interactive sensor status view.
 *
 * A client-side component that displays:
 * - Observation statistics per domain (count, date range, staleness)
 * - Recent observations table
 * - Drag-and-drop CSV file upload for ingestion
 *
 * This is a "device" surface - an operational tool rather than content.
 */
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { DomainStatus, RecentObservation, SensorsStatus } from '@/services/sensors'

/** Sensors data structure matching SensorsStatus from the API */
type SensorsData = Pick<SensorsStatus, 'exists' | 'domains' | 'recent'>

/** Staleness level for a sensor */
type Staleness = 'fresh' | 'stale' | 'old'

/**
 * Cadence configuration for staleness thresholds.
 * Values are in days. A sensor is:
 * - fresh: last ingest < freshDays ago
 * - stale: last ingest between freshDays and staleDays ago
 * - old: last ingest > staleDays ago
 *
 * To add per-domain cadence later, change this to:
 * const CADENCE: Record<string, CadenceConfig> = { finance: {...}, default: {...} }
 */
interface CadenceConfig {
  freshDays: number
  staleDays: number
}

const DEFAULT_CADENCE: CadenceConfig = {
  freshDays: 7,   // fresh if updated within a week
  staleDays: 14,  // stale after a week, old after two weeks
}

/**
 * Get cadence config for a domain.
 * Currently returns default for all domains - extend this to support per-domain config.
 */
function getCadence(_domain: string): CadenceConfig {
  // Future: return DOMAIN_CADENCE[domain] ?? DEFAULT_CADENCE
  return DEFAULT_CADENCE
}

/** Props for SensorsClient */
interface Props {
  /** Node identifier to display in the header */
  node: string
}

/**
 * Formats an ISO date string as relative time (e.g., "2d ago", "5h ago").
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'just now'
}

/**
 * Formats an ISO date string as month/year (e.g., "Jan 2024").
 */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formats an ISO date string as short date (e.g., "Jan 15").
 */
function formatShortDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Determines staleness level based on time since last ingest and domain cadence.
 * Uses getCadence() to get thresholds - currently same for all domains.
 */
function getStaleness(isoString: string, domain: string): Staleness {
  const cadence = getCadence(domain)
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < cadence.freshDays) return 'fresh'
  if (diffDays < cadence.staleDays) return 'stale'
  return 'old'
}

/**
 * Computes a summary of sensors needing attention.
 */
function computeAttentionSummary(domains: DomainStatus[]): { count: number; items: string[] } {
  const items: string[] = []
  for (const d of domains) {
    if (!d.lastIngest) {
      items.push(`${d.domain} (never ingested)`)
      continue
    }
    const staleness = getStaleness(d.lastIngest.finishedAt, d.domain)
    if (staleness === 'stale') {
      const daysAgo = Math.floor((Date.now() - new Date(d.lastIngest.finishedAt).getTime()) / (1000 * 60 * 60 * 24))
      items.push(`${d.domain} (${daysAgo}d stale)`)
    } else if (staleness === 'old') {
      const daysAgo = Math.floor((Date.now() - new Date(d.lastIngest.finishedAt).getTime()) / (1000 * 60 * 60 * 24))
      items.push(`${d.domain} (${daysAgo}d old)`)
    }
  }
  return { count: items.length, items }
}

/**
 * SensorsClient - Main sensor status component.
 *
 * Features:
 * - Auto-loads status on mount
 * - Drag-and-drop CSV upload with toast notifications
 * - Domain cards with staleness indicators
 * - Recent observations table
 * - Logout button
 */
export default function SensorsClient({ node }: Props) {
  const [data, setData] = useState<SensorsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }, [])

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/sensors/status/')
      if (res.ok) {
        const newData = await res.json()
        setData(newData)
      }
    } catch {
      // Silently fail refresh
    }
  }, [])

  useEffect(() => {
    refreshData().finally(() => setLoading(false))
  }, [refreshData])

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/sensors/ingest/', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (result.success) {
        showToast('success', result.message)
        await refreshData()
      } else {
        showToast('error', result.message)
      }
    } catch {
      showToast('error', 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [showToast, refreshData])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [uploadFile])

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout/', { method: 'POST' })
    router.push('/sensors/login/')
  }, [router])

  if (loading) {
    return (
      <div className="sensors">
        <div className="sensors-container">
          <div className="sensors-empty">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="sensors">
      <div className="sensors-container">
        <header className="sensors-header">
          <h1 className="sensors-title">Sensors</h1>
          <div className="sensors-header-actions">
            <span className="sensors-node-label">{node}</span>
            <button className="sensors-logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {toast && (
          <div className={`sensors-toast ${toast.type}`}>
            {toast.message}
          </div>
        )}

        {data && data.domains.length > 0 && (() => {
          const attention = computeAttentionSummary(data.domains)
          if (attention.count === 0) return null
          return (
            <div className="sensors-attention">
              <span className="sensors-attention-count">{attention.count} sensor{attention.count > 1 ? 's' : ''} need{attention.count === 1 ? 's' : ''} attention</span>
              <span className="sensors-attention-list">{attention.items.join(' · ')}</span>
            </div>
          )
        })()}

        <div
          className={`sensors-dropzone${dragOver ? ' dragover' : ''}${uploading ? ' uploading' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
          />
          <p className="sensors-dropzone-text">
            {uploading ? <strong>Uploading...</strong> : <><strong>Drop CSV here</strong> or click to select</>}
          </p>
        </div>

        <div className="sensors-cards">
          {data && data.domains.length > 0 ? (
            data.domains.map((d) => {
              const staleness = d.lastIngest ? getStaleness(d.lastIngest.finishedAt, d.domain) : 'old'
              const coverage = d.minObserved && d.maxObserved
                ? formatDate(d.minObserved) === formatDate(d.maxObserved)
                  ? formatDate(d.minObserved)
                  : `${formatDate(d.minObserved)} – ${formatDate(d.maxObserved)}`
                : '—'
              const lastIngest = d.lastIngest
                ? `${formatRelativeTime(d.lastIngest.finishedAt)} (${formatShortDate(d.lastIngest.finishedAt)})`
                : 'unknown'

              return (
                <div key={d.domain} className="sensors-card">
                  <div className="sensors-card-header">
                    <span className="sensors-domain-name">{d.domain}</span>
                    <span className={`sensors-status-dot ${staleness}`} />
                  </div>
                  <div className="sensors-stats">
                    <div className="sensors-stat">
                      <span className="sensors-stat-value">{d.count.toLocaleString()}</span>
                      <span className="sensors-stat-label">observations</span>
                    </div>
                    <div className="sensors-stat">
                      <span className="sensors-stat-value">{coverage}</span>
                      <span className="sensors-stat-label">coverage</span>
                    </div>
                    <div className="sensors-stat">
                      <span className="sensors-stat-value">{lastIngest}</span>
                      <span className="sensors-stat-label">last ingest</span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="sensors-empty">No observations yet</div>
          )}
        </div>

        {data?.recent && data.recent.length > 0 && (
          <>
            <h2 className="sensors-section-header">Recent Observations</h2>
            <table className="sensors-recent-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Domain</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((o) => (
                  <tr key={o.id}>
                    <td>{formatShortDate(o.observed_at)}</td>
                    <td className="sensors-domain-cell">{o.domain}</td>
                    <td className="sensors-summary-cell">{o.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="sensors-refresh">Click dropzone to upload, or drag and drop</p>
      </div>
    </div>
  )
}
