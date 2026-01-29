/**
 * @file GET /api/sensors/status - Sensors status endpoint.
 *
 * Returns the current status of the observation store including:
 * - Whether the database exists
 * - Statistics per domain (count, date range, last ingest)
 * - Recent observations
 *
 * Used by SensorsClient to display sensor status.
 */

import { NextResponse } from 'next/server'
import { getSensorsStatus } from '@/services/sensors'

/** Disable Next.js caching for this route */
export const dynamic = 'force-dynamic'

/**
 * Returns the sensors status as JSON.
 */
export async function GET() {
  try {
    const status = await getSensorsStatus()
    return NextResponse.json(status)
  } catch (err) {
    console.error('Sensors status error:', err)
    return NextResponse.json({
      exists: false,
      domains: [],
      recent: [],
      error: String(err),
    })
  }
}
