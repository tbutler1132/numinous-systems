#!/usr/bin/env npx tsx
/**
 * CLI wrapper for CSV ingestion.
 * Accepts file path as argument or content on stdin.
 */

import { existsSync, readFileSync } from 'fs'
import { ingestChaseCSV } from '../src/services/sensors'

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

  const result = await ingestChaseCSV(content, filename)
  console.log(JSON.stringify(result, null, 2))

  if (!result.success) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.log(
    JSON.stringify({
      success: false,
      message: `Error: ${err instanceof Error ? err.message : err}`,
    })
  )
  process.exit(1)
})
