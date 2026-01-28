/**
 * @file POST /api/dashboard/ingest - CSV file upload endpoint.
 *
 * Accepts a CSV file upload (Chase bank statement format) and ingests
 * the transactions into the observation store. Returns ingest statistics.
 *
 * Request: multipart/form-data with 'file' field
 * Response: IngestResult with success, message, and details
 */

import { NextResponse } from 'next/server'
import { ingestChaseCSV } from '@/services/dashboard'

/** Disable Next.js caching for this route */
export const dynamic = 'force-dynamic'

/**
 * Handles CSV file upload and ingestion.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ success: false, message: 'Only CSV files are supported' })
    }

    const content = await file.text()
    const result = await ingestChaseCSV(content, file.name)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: `Error: ${err instanceof Error ? err.message : err}`,
    })
  }
}
