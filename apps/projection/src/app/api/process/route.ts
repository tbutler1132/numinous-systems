/**
 * @file GET /api/process - Returns process document tabs.
 *
 * Reads markdown files from nodes/org/process/ and returns them
 * as tab data for the ProcessClient component.
 *
 * NOTE: Currently hardcoded to read from nodes/org/process/.
 * For multi-node support, this would:
 * 1. Get nodeId from session/auth (via core/identity)
 * 2. Read from nodes/{nodeId}/process/ instead
 * 3. Follow the same pattern as sensors (see services/store.ts)
 */

import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

interface ProcessTab {
  id: string
  label: string
  content: string
}

function readProcessFile(filename: string): string {
  try {
    const path = join(process.cwd(), '../../nodes/org/process', filename)
    return readFileSync(path, 'utf-8')
  } catch {
    return `*File not found: ${filename}*`
  }
}

export async function GET() {
  const tabs: ProcessTab[] = [
    { id: 'about', label: 'About', content: readProcessFile('about.md') },
    { id: 'models', label: 'Models', content: readProcessFile('models.md') },
    { id: 'episodes', label: 'Episodes', content: readProcessFile('episodes.md') },
    { id: 'retros', label: 'Retros', content: readProcessFile('retros.md') },
  ]

  return NextResponse.json({ tabs })
}
