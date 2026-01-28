#!/usr/bin/env npx tsx
/**
 * CLI wrapper for dashboard status.
 * Outputs JSON to stdout for scripting/debugging.
 */

import { getDashboardStatus } from '../src/services/dashboard'

async function main() {
  const status = await getDashboardStatus()
  console.log(JSON.stringify(status, null, 2))
}

main().catch((err) => {
  console.error(JSON.stringify({ error: String(err) }))
  process.exit(1)
})
