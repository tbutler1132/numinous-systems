/**
 * Generic artifact-to-JSON generator.
 * Reads directories of artifacts following the about.md + page.md convention,
 * resolves markdown references between artifacts, and outputs JSON.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { collectArtifacts } from './lib'

const ROOT = resolve(__dirname, '..', '..', '..')

interface Surface {
  name: string
  source: string
  output: string
}

const surfaces: Surface[] = [
  {
    name: 'heros-journey',
    source: 'nodes/org/artifacts/stages',
    output: 'public/data/heros-journey.json',
  },
]

for (const surface of surfaces) {
  const sourceDir = join(ROOT, surface.source)
  const artifacts = collectArtifacts(sourceDir)
  const outputPath = join(__dirname, '..', surface.output)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, JSON.stringify(artifacts, null, 2))
  console.log(`${surface.name}: ${artifacts.length} artifacts → ${surface.output}`)
}
