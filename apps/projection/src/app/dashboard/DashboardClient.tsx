/**
 * @file DashboardClient - Interactive sensor status dashboard.
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

/** Statistics for a single observation domain */
interface DomainStatus {
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

/** A recent observation formatted for display */
interface RecentObservation {
  id: string
  observed_at: string
  domain: string
  type: string
  summary: string
}

/** Complete dashboard data from the status API */
interface DashboardData {
  exists: boolean
  domains: DomainStatus[]
  recent: RecentObservation[]
}

/** Props for DashboardClient */
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
 * Determines staleness level based on time since last ingest.
 * - fresh: < 2 days (green indicator)
 * - stale: 2-7 days (yellow indicator)
 * - old: > 7 days (red indicator)
 */
function getStaleness(isoString: string): 'fresh' | 'stale' | 'old' {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 2) return 'fresh'
  if (diffDays < 7) return 'stale'
  return 'old'
}

/**
 * DashboardClient - Main sensor status dashboard component.
 *
 * Features:
 * - Auto-loads status on mount
 * - Drag-and-drop CSV upload with toast notifications
 * - Domain cards with staleness indicators
 * - Recent observations table
 * - Logout button
 */
export default function DashboardClient({ node }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
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
      const res = await fetch('/api/dashboard/status/')
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
      const res = await fetch('/api/dashboard/ingest/', {
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
    router.push('/dashboard/login/')
  }, [router])

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="dashboard-empty">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Sensor Status</h1>
          <div className="dashboard-header-actions">
            <span className="dashboard-node-label">{node}</span>
            <button className="dashboard-logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {toast && (
          <div className={`dashboard-toast ${toast.type}`}>
            {toast.message}
          </div>
        )}

        <div
          className={`dashboard-dropzone${dragOver ? ' dragover' : ''}${uploading ? ' uploading' : ''}`}
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
          <p className="dashboard-dropzone-text">
            {uploading ? <strong>Uploading...</strong> : <><strong>Drop CSV here</strong> or click to select</>}
          </p>
        </div>

        <div className="dashboard-cards">
          {data && data.domains.length > 0 ? (
            data.domains.map((d) => {
              const staleness = d.lastIngest ? getStaleness(d.lastIngest.finishedAt) : 'old'
              const coverage = d.minObserved && d.maxObserved
                ? formatDate(d.minObserved) === formatDate(d.maxObserved)
                  ? formatDate(d.minObserved)
                  : `${formatDate(d.minObserved)} – ${formatDate(d.maxObserved)}`
                : '—'
              const lastIngest = d.lastIngest
                ? `${formatRelativeTime(d.lastIngest.finishedAt)} (${formatShortDate(d.lastIngest.finishedAt)})`
                : 'unknown'

              return (
                <div key={d.domain} className="dashboard-card">
                  <div className="dashboard-card-header">
                    <span className="dashboard-domain-name">{d.domain}</span>
                    <span className={`dashboard-status-dot ${staleness}`} />
                  </div>
                  <div className="dashboard-stats">
                    <div className="dashboard-stat">
                      <span className="dashboard-stat-value">{d.count.toLocaleString()}</span>
                      <span className="dashboard-stat-label">observations</span>
                    </div>
                    <div className="dashboard-stat">
                      <span className="dashboard-stat-value">{coverage}</span>
                      <span className="dashboard-stat-label">coverage</span>
                    </div>
                    <div className="dashboard-stat">
                      <span className="dashboard-stat-value">{lastIngest}</span>
                      <span className="dashboard-stat-label">last ingest</span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="dashboard-empty">No observations yet</div>
          )}
        </div>

        {data?.recent && data.recent.length > 0 && (
          <>
            <h2 className="dashboard-section-header">Recent Observations</h2>
            <table className="dashboard-recent-table">
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
                    <td className="dashboard-domain-cell">{o.domain}</td>
                    <td className="dashboard-summary-cell">{o.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="dashboard-refresh">Click dropzone to upload, or drag and drop</p>
      </div>
    </div>
  )
}
