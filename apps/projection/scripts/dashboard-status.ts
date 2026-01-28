#!/usr/bin/env npx tsx
/**
 * Outputs dashboard status as JSON. Called via child_process from API routes
 * to avoid sql.js bundling issues with Next.js webpack.
 */

import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { ObservationStore, resolveDbPath } from '@numinous-systems/sensor'

function findWorkspaceRoot(): string {
  let current = process.cwd()
  while (current !== '/') {
    if (existsSync(join(current, '.git'))) {
      return current
    }
    current = resolve(current, '..')
  }
  return process.cwd()
}

function extractSummary(domain: string, payload: Record<string, unknown>): string {
  if (domain === 'finance') {
    const desc = payload.description_raw as string | undefined
    const amount = payload.amount_cents as number | undefined
    if (desc && amount !== undefined) {
      const amountStr = amount < 0
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

async function main() {
  const node = 'private'
  const workspaceRoot = findWorkspaceRoot()
  const dbPath = resolveDbPath(workspaceRoot, node)

  if (!existsSync(dbPath)) {
    console.log(JSON.stringify({ exists: false, domains: [], recent: [] }))
    return
  }

  const store = await ObservationStore.create(dbPath)
  const status = store.getStatus()

  const recentObs = store.queryObservations({ limit: 10 })
  const recent = recentObs.map((o) => ({
    id: o.id.substring(0, 8),
    observed_at: o.observed_at,
    domain: o.domain,
    type: o.type,
    summary: extractSummary(o.domain, o.payload),
  }))

  store.close()

  console.log(JSON.stringify({ exists: true, ...status, recent }))
}

main().catch((err) => {
  console.error(JSON.stringify({ error: String(err) }))
  process.exit(1)
})
