#!/usr/bin/env npx tsx
/**
 * Ingests a CSV file. Called via child_process from API routes.
 * Expects file content on stdin or as first argument (file path).
 */

import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { ObservationStore, resolveDbPath } from '@numinous-systems/sensor'
import { parseChaseCSVContent } from '@numinous-systems/finance/dist/chase-csv.js'

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

async function main() {
  const args = process.argv.slice(2)

  // Read content from file path argument or stdin
  let content: string
  let filename: string

  if (args[0] && existsSync(args[0])) {
    content = readFileSync(args[0], 'utf-8')
    filename = args[0].split('/').pop() || 'upload.csv'
  } else {
    // Read from stdin
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    content = Buffer.concat(chunks).toString('utf-8')
    filename = args[0] || 'upload.csv'
  }

  // Parse CSV content
  const parseResult = parseChaseCSVContent(content, {
    accountLabel: 'checking',
  })

  if (parseResult.observations.length === 0) {
    console.log(JSON.stringify({
      success: false,
      message: 'No valid transactions found in file',
    }))
    return
  }

  // Store observations
  const node = 'private'
  const workspaceRoot = findWorkspaceRoot()
  const dbPath = resolveDbPath(workspaceRoot, node)
  const store = await ObservationStore.create(dbPath)

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

  store.close()

  console.log(JSON.stringify({
    success: true,
    message: `Ingested ${result.inserted} transactions`,
    details: {
      filename,
      rowsRead: parseResult.rowCount,
      inserted: result.inserted,
      skipped: result.skipped,
      dateRange: parseResult.minObserved && parseResult.maxObserved
        ? `${parseResult.minObserved} to ${parseResult.maxObserved}`
        : null,
      warnings: result.warnings.length,
    },
  }))
}

main().catch((err) => {
  console.log(JSON.stringify({
    success: false,
    message: `Parse error: ${err instanceof Error ? err.message : err}`,
  }))
  process.exit(1)
})
