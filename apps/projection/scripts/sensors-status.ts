#!/usr/bin/env npx tsx
/**
 * CLI wrapper for sensors status.
 * Outputs JSON to stdout for scripting/debugging.
 */

import { getSensorsStatus } from '../src/services/sensors'

async function main() {
  const status = await getSensorsStatus()
  console.log(JSON.stringify(status, null, 2))
}

main().catch((err) => {
  console.error(JSON.stringify({ error: String(err) }))
  process.exit(1)
})
