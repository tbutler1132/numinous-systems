/**
 * @file GET /api/dashboard/status - Dashboard status endpoint.
 *
 * Returns the current status of the observation store including:
 * - Whether the database exists
 * - Statistics per domain (count, date range, last ingest)
 * - Recent observations
 *
 * Used by DashboardClient to display sensor status.
 */

import { NextResponse } from 'next/server'
import { getDashboardStatus } from '@/services/dashboard'

/** Disable Next.js caching for this route */
export const dynamic = 'force-dynamic'

/**
 * Returns the dashboard status as JSON.
 */
export async function GET() {
  try {
    const status = await getDashboardStatus()
    return NextResponse.json(status)
  } catch (err) {
    console.error('Dashboard status error:', err)
    return NextResponse.json({
      exists: false,
      domains: [],
      recent: [],
      error: String(err),
    })
  }
}
