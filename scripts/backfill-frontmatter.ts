#!/usr/bin/env npx tsx
/**
 * Frontmatter Backfill Script
 *
 * Scans artifact about.md files and generates/updates frontmatter.
 *
 * Usage:
 *   npx tsx scripts/backfill-frontmatter.ts           # Dry run - shows what would change
 *   npx tsx scripts/backfill-frontmatter.ts --write   # Actually write the changes
 *   npx tsx scripts/backfill-frontmatter.ts --json    # Output as JSON for tooling
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import matter from 'gray-matter'

const ROOT = path.resolve(import.meta.dirname, '..')
const ARTIFACTS_PATH = path.join(ROOT, 'nodes/org/artifacts')

// Schema-defined categories and their path patterns
const CATEGORY_MAP: Record<string, string> = {
  'core': 'core',
  'essays': 'essay',
  'aesthetic': 'aesthetic',
  'songs': 'song',
  'story': 'story',
  'apps': 'app',
  'sensors': 'reference',
  'reference': 'reference',
  'commentary': 'essay',
  'practice': 'reference',
  'xenoscript': 'reference',
}

// Patterns that suggest draft status
const DRAFT_INDICATORS = [
  /stub\.?$/im,
  /\(to be written\)/i,
  /in development/i,
  /in design/i,
  /work in progress/i,
  /wip/i,
]

interface Frontmatter {
  title?: string
  status?: 'published' | 'draft' | 'private'
  category?: string
  order?: number
  parent?: string | null
  relates_to?: string[]
  created?: string
  updated?: string
  implementation?: string
}

interface ArtifactAnalysis {
  path: string
  relativePath: string
  slug: string
  existing: Frontmatter
  suggested: Frontmatter
  hasFrontmatter: boolean
  needsUpdate: boolean
  changes: string[]
}

function getSlug(filePath: string): string {
  // Get the parent directory name as the slug
  const dir = path.dirname(filePath)
  return path.basename(dir)
}

function inferCategory(relativePath: string): string | undefined {
  for (const [pathSegment, category] of Object.entries(CATEGORY_MAP)) {
    if (relativePath.includes(`/${pathSegment}/`) || relativePath.startsWith(`${pathSegment}/`)) {
      return category
    }
  }
  return undefined
}

function extractTitle(content: string): string | undefined {
  const h1Match = content.match(/^#\s+(.+)$/m)
  return h1Match ? h1Match[1].trim() : undefined
}

function inferStatus(content: string): 'published' | 'draft' | 'private' {
  for (const pattern of DRAFT_INDICATORS) {
    if (pattern.test(content)) {
      return 'draft'
    }
  }
  // Default to draft for safety
  return 'draft'
}

function extractInternalLinks(content: string): string[] {
  // Look for references to other artifacts in "Connection to Broader Project" sections
  // and explicit markdown links
  const links: Set<string> = new Set()

  // Match **Artifact Name** patterns (common in Connection sections)
  const boldMatches = content.matchAll(/\*\*([A-Z][a-zA-Z\s]+)\*\*/g)
  for (const match of boldMatches) {
    const name = match[1].trim()
    // Convert to slug format
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    // Filter out common non-artifact bold text
    if (!['why', 'what', 'how', 'note', 'important', 'status', 'example'].includes(slug)) {
      links.add(slug)
    }
  }

  // Match explicit artifact references like "the-living-system" or "/artifacts/..."
  const pathMatches = content.matchAll(/artifacts\/[\w-]+\/([\w-]+)/g)
  for (const match of pathMatches) {
    links.add(match[1])
  }

  return Array.from(links)
}

function getGitDates(filePath: string): { created?: string; updated?: string } {
  try {
    // Get first commit date (created)
    const createdRaw = execSync(
      `git log --follow --format=%aI --diff-filter=A -- "${filePath}" | tail -1`,
      { cwd: ROOT, encoding: 'utf-8' }
    ).trim()

    // Get last commit date (updated)
    const updatedRaw = execSync(
      `git log -1 --format=%aI -- "${filePath}"`,
      { cwd: ROOT, encoding: 'utf-8' }
    ).trim()

    const created = createdRaw ? createdRaw.split('T')[0] : undefined
    const updated = updatedRaw ? updatedRaw.split('T')[0] : undefined

    return { created, updated }
  } catch {
    return {}
  }
}

function analyzeArtifact(filePath: string): ArtifactAnalysis {
  const relativePath = path.relative(ARTIFACTS_PATH, filePath)
  const slug = getSlug(filePath)
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data: existing, content: body } = matter(content)

  const hasFrontmatter = Object.keys(existing).length > 0
  const gitDates = getGitDates(filePath)

  // Build suggested frontmatter
  const suggested: Frontmatter = {}
  const changes: string[] = []

  // Title
  if (!existing.title) {
    const inferredTitle = extractTitle(body)
    if (inferredTitle) {
      suggested.title = inferredTitle
      changes.push(`title: "${inferredTitle}"`)
    }
  }

  // Status
  if (!existing.status) {
    const inferredStatus = inferStatus(body)
    suggested.status = inferredStatus
    changes.push(`status: ${inferredStatus}`)
  }

  // Category
  if (!existing.category) {
    const inferredCategory = inferCategory(relativePath)
    if (inferredCategory) {
      suggested.category = inferredCategory
      changes.push(`category: ${inferredCategory}`)
    }
  }

  // Relates to
  if (!existing.relates_to || existing.relates_to.length === 0) {
    const inferredLinks = extractInternalLinks(body)
    if (inferredLinks.length > 0) {
      suggested.relates_to = inferredLinks
      changes.push(`relates_to: [${inferredLinks.join(', ')}]`)
    }
  }

  // Dates from git
  if (!existing.created && gitDates.created) {
    suggested.created = gitDates.created
    changes.push(`created: ${gitDates.created}`)
  }
  if (!existing.updated && gitDates.updated) {
    suggested.updated = gitDates.updated
    changes.push(`updated: ${gitDates.updated}`)
  }

  return {
    path: filePath,
    relativePath,
    slug,
    existing: existing as Frontmatter,
    suggested,
    hasFrontmatter,
    needsUpdate: changes.length > 0,
    changes,
  }
}

function generateFrontmatter(existing: Frontmatter, suggested: Frontmatter): string {
  const merged: Frontmatter = { ...suggested, ...existing }

  const lines: string[] = ['---']

  if (merged.title) lines.push(`title: ${merged.title}`)
  if (merged.status) lines.push(`status: ${merged.status}`)
  if (merged.category) lines.push(`category: ${merged.category}`)
  if (merged.order !== undefined) lines.push(`order: ${merged.order}`)
  if (merged.relates_to && merged.relates_to.length > 0) {
    lines.push('relates_to:')
    for (const rel of merged.relates_to) {
      lines.push(`  - ${rel}`)
    }
  }
  if (merged.created) lines.push(`created: ${merged.created}`)
  if (merged.updated) lines.push(`updated: ${merged.updated}`)
  if (merged.implementation) lines.push(`implementation: ${merged.implementation}`)

  lines.push('---')

  return lines.join('\n')
}

function writeBackfill(analysis: ArtifactAnalysis): void {
  const content = fs.readFileSync(analysis.path, 'utf-8')
  const { content: body } = matter(content)

  const newFrontmatter = generateFrontmatter(analysis.existing, analysis.suggested)
  const newContent = `${newFrontmatter}\n\n${body.trim()}\n`

  fs.writeFileSync(analysis.path, newContent)
}

function findArtifactFiles(): string[] {
  const files: string[] = []

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name === 'about.md') {
        files.push(fullPath)
      }
    }
  }

  walk(ARTIFACTS_PATH)
  return files
}

function main() {
  const args = process.argv.slice(2)
  const writeMode = args.includes('--write')
  const jsonMode = args.includes('--json')

  const files = findArtifactFiles()
  const analyses = files.map(analyzeArtifact)

  // Filter to only artifacts (not the root about.md or category index files)
  const artifacts = analyses.filter(a => {
    // Skip if it's a category-level about.md (like songs/about.md)
    const depth = a.relativePath.split('/').length
    return depth >= 2
  })

  if (jsonMode) {
    console.log(JSON.stringify(artifacts, null, 2))
    return
  }

  // Summary stats
  const withFrontmatter = artifacts.filter(a => a.hasFrontmatter).length
  const needingUpdate = artifacts.filter(a => a.needsUpdate).length

  console.log('\n📊 Frontmatter Backfill Report')
  console.log('═'.repeat(50))
  console.log(`Total artifacts: ${artifacts.length}`)
  console.log(`With frontmatter: ${withFrontmatter}`)
  console.log(`Needing updates: ${needingUpdate}`)
  console.log('═'.repeat(50))

  // Group by category
  const byCategory = new Map<string, ArtifactAnalysis[]>()
  for (const artifact of artifacts) {
    const category = artifact.existing.category || artifact.suggested.category || 'uncategorized'
    if (!byCategory.has(category)) {
      byCategory.set(category, [])
    }
    byCategory.get(category)!.push(artifact)
  }

  // Print by category
  for (const [category, items] of byCategory) {
    const needsWork = items.filter(i => i.needsUpdate)
    if (needsWork.length === 0) continue

    console.log(`\n📁 ${category.toUpperCase()} (${needsWork.length} need updates)`)
    console.log('─'.repeat(50))

    for (const item of needsWork) {
      console.log(`\n  ${item.slug}`)
      console.log(`  ${item.hasFrontmatter ? '🔧 Partial' : '❌ No'} frontmatter`)
      for (const change of item.changes) {
        console.log(`    + ${change}`)
      }

      if (writeMode) {
        writeBackfill(item)
        console.log(`    ✅ Written!`)
      }
    }
  }

  if (!writeMode && needingUpdate > 0) {
    console.log('\n' + '═'.repeat(50))
    console.log('💡 Run with --write to apply these changes')
    console.log('   npx tsx scripts/backfill-frontmatter.ts --write')
  }

  if (writeMode) {
    console.log('\n' + '═'.repeat(50))
    console.log(`✅ Updated ${needingUpdate} files`)
  }
}

main()
