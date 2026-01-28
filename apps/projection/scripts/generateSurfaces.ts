/**
 * Generic artifact-to-JSON generator.
 * Reads directories of artifacts following the about.md + page.md convention,
 * resolves markdown references between artifacts, and outputs JSON.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { collectArtifacts, parseMarkdownTable } from './lib'

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

// Generate surfaces.json from the canonical entity file
const surfacesMd = readFileSync(join(ROOT, 'nodes/org/entities/surfaces.md'), 'utf-8')
const surfaceRows = parseMarkdownTable(surfacesMd)
const surfacesOutputPath = join(__dirname, '..', 'public/data/surfaces.json')
mkdirSync(dirname(surfacesOutputPath), { recursive: true })
writeFileSync(surfacesOutputPath, JSON.stringify(surfaceRows, null, 2))
console.log(`surfaces: ${surfaceRows.length} entries → public/data/surfaces.json`)
