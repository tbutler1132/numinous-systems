/**
 * @file Build-time artifact and surface data generator.
 *
 * This script runs before `npm run dev` and `npm run build` to generate
 * the JSON data files that power the application:
 *
 * - public/data/heros-journey.json: Hero's Journey stage artifacts
 * - public/data/surfaces.json: Navigation surface definitions
 *
 * Data sources:
 * - nodes/org/artifacts/stages/: Hero's Journey stage directories
 * - nodes/org/entities/surfaces.md: Canonical surface definitions
 *
 * @see npm run generate - Runs this script manually
 * @see lib/data.ts - Loads the generated JSON at runtime
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { collectArtifacts, parseMarkdownTable, readArtifact, readPage } from './lib'

/** Monorepo root directory */
const ROOT = resolve(__dirname, '..', '..', '..')

/** Configuration for an artifact collection to generate */
interface Surface {
  /** Identifier for logging */
  name: string
  /** Source directory relative to ROOT */
  source: string
  /** Output path relative to script directory */
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

// Generate surfaces.json from canonical entity files across nodes
const surfaceFiles = [
  'nodes/org/entities/surfaces.md',
  'nodes/personal/entities/surfaces.md',
]

const allSurfaceRows: Record<string, string>[] = []
for (const file of surfaceFiles) {
  try {
    const surfacesMd = readFileSync(join(ROOT, file), 'utf-8')
    const rows = parseMarkdownTable(surfacesMd)
    allSurfaceRows.push(...rows)
    console.log(`  ${file}: ${rows.length} entries`)
  } catch {
    // Node surfaces file doesn't exist (e.g., personal node not present)
  }
}

const surfacesOutputPath = join(__dirname, '..', 'public/data/surfaces.json')
mkdirSync(dirname(surfacesOutputPath), { recursive: true })
writeFileSync(surfacesOutputPath, JSON.stringify(allSurfaceRows, null, 2))
console.log(`surfaces: ${allSurfaceRows.length} total entries → public/data/surfaces.json`)

// Generate landing.json from the home artifact
const landingDir = join(ROOT, 'nodes/org/artifacts/home')
const landingArtifact = readArtifact(landingDir)
const landingPage = readPage(landingDir)
const landingData = {
  frontmatter: landingArtifact?.frontmatter ?? {},
  content: landingArtifact?.content ?? '',
  page: landingPage ?? '',
}
const landingOutputPath = join(__dirname, '..', 'public/data/landing.json')
writeFileSync(landingOutputPath, JSON.stringify(landingData, null, 2))
console.log(`landing: 1 artifact → public/data/landing.json`)
