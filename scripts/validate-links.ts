#!/usr/bin/env npx tsx
/**
 * Wiki-Link Validator
 *
 * Validates [[id]] wiki-links in markdown files against a registry
 * of known IDs derived from file paths.
 *
 * ID Strategy:
 * - Artifacts: {category}/{slug} (e.g., core/beauty-redeems)
 * - Non-artifacts: path from nodes/org/ (e.g., process/models, entities/domains)
 * - Root files: filename without .md (e.g., ontology)
 * - Optional id: frontmatter field for overrides
 *
 * Usage:
 *   npx tsx scripts/validate-links.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

const ROOT = path.resolve(import.meta.dirname, '..')
const NODES_ORG_PATH = path.join(ROOT, 'nodes/org')
const ARTIFACTS_PATH = path.join(NODES_ORG_PATH, 'artifacts')
const PRIVATE_PATH = path.join(NODES_ORG_PATH, 'private')

interface LinkRegistry {
  entries: Map<string, string> // id -> filepath
}

interface WikiLink {
  id: string
  section?: string
  displayText?: string
}

interface LinkError {
  file: string
  line: number
  link: string
  message: string
}

function parseWikiLinks(md: string): Array<WikiLink & { line: number; raw: string }> {
  const links: Array<WikiLink & { line: number; raw: string }> = []
  const lines = md.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const re = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g
    let match
    while ((match = re.exec(lines[i])) !== null) {
      links.push({
        id: match[1],
        section: match[2] || undefined,
        displayText: match[3] || undefined,
        line: i + 1,
        raw: match[0],
      })
    }
  }

  return links
}

function deriveIdFromPath(filePath: string): string {
  // For root-level .md files (like ontology.md)
  if (path.dirname(filePath) === ROOT) {
    return path.basename(filePath, '.md')
  }

  // For files in nodes/org/artifacts/
  if (filePath.startsWith(ARTIFACTS_PATH)) {
    const relativePath = path.relative(ARTIFACTS_PATH, filePath)
    const parts = relativePath.split('/')

    // Skip category-level about.md (e.g., artifacts/core/about.md)
    if (parts.length === 2 && parts[1] === 'about.md') {
      return parts[0] // Just the category name
    }

    // Artifact about.md: category/slug (e.g., core/beauty-redeems)
    if (parts.length >= 3 && parts[parts.length - 1] === 'about.md') {
      const category = parts[0]
      const slug = parts[parts.length - 2]
      return `${category}/${slug}`
    }

    // Other files in artifacts: full path without .md
    return relativePath.replace(/\.md$/, '')
  }

  // For files in nodes/org/ (but not artifacts)
  if (filePath.startsWith(NODES_ORG_PATH)) {
    const relativePath = path.relative(NODES_ORG_PATH, filePath)
    // Remove .md extension and about.md -> just the directory
    if (relativePath.endsWith('/about.md')) {
      return relativePath.replace(/\/about\.md$/, '')
    }
    return relativePath.replace(/\.md$/, '')
  }

  // Fallback: use filename
  return path.basename(filePath, '.md')
}

function buildRegistry(): LinkRegistry {
  const entries = new Map<string, string>()

  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)

      if (item.isDirectory()) {
        // Skip hidden directories
        if (!item.name.startsWith('.')) {
          scanDirectory(fullPath)
        }
      } else if (item.name.endsWith('.md')) {
        // Read frontmatter for optional id override
        const content = fs.readFileSync(fullPath, 'utf-8')
        const { data } = matter(content)

        const id = data.id || deriveIdFromPath(fullPath)
        entries.set(id, fullPath)
      }
    }
  }

  // Scan nodes/org/
  scanDirectory(NODES_ORG_PATH)

  // Scan root-level .md files
  const rootItems = fs.readdirSync(ROOT, { withFileTypes: true })
  for (const item of rootItems) {
    if (item.isFile() && item.name.endsWith('.md')) {
      const fullPath = path.join(ROOT, item.name)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const { data } = matter(content)

      const id = data.id || deriveIdFromPath(fullPath)
      entries.set(id, fullPath)
    }
  }

  return { entries }
}

function validateFile(filePath: string, registry: LinkRegistry): LinkError[] {
  const errors: LinkError[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const links = parseWikiLinks(content)

  for (const link of links) {
    // Check for relative path patterns (../something or ./something)
    if (link.id.startsWith('.')) {
      errors.push({
        file: filePath,
        line: link.line,
        link: link.raw,
        message: `Relative path detected. Use ID-based link instead: [[${link.id.replace(/^\.\.?\//, '').replace(/\.md$/, '')}]]`,
      })
      continue
    }

    // Check if the ID exists in the registry
    if (!registry.entries.has(link.id)) {
      // Suggest closest match
      const suggestions = findSimilarIds(link.id, registry.entries)
      const suggestionText = suggestions.length > 0 ? ` Did you mean: ${suggestions.join(', ')}?` : ''

      errors.push({
        file: filePath,
        line: link.line,
        link: link.raw,
        message: `Unknown ID: "${link.id}".${suggestionText}`,
      })
    }
  }

  return errors
}

function findSimilarIds(target: string, entries: Map<string, string>): string[] {
  const targetParts = target.split('/')
  const targetSlug = targetParts[targetParts.length - 1]

  const matches: string[] = []

  for (const id of entries.keys()) {
    const idParts = id.split('/')
    const idSlug = idParts[idParts.length - 1]

    // Match if slug contains target or vice versa
    if (idSlug.includes(targetSlug) || targetSlug.includes(idSlug)) {
      matches.push(id)
    }
  }

  return matches.slice(0, 3)
}

function validateAllFiles(registry: LinkRegistry): LinkError[] {
  const allErrors: LinkError[] = []

  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)

      if (item.isDirectory()) {
        // Skip hidden directories and private directory
        if (!item.name.startsWith('.') && fullPath !== PRIVATE_PATH) {
          scanDirectory(fullPath)
        }
      } else if (item.name.endsWith('.md')) {
        const errors = validateFile(fullPath, registry)
        allErrors.push(...errors)
      }
    }
  }

  // Scan nodes/org/ (excluding private/)
  scanDirectory(NODES_ORG_PATH)

  // Scan root-level .md files
  const rootItems = fs.readdirSync(ROOT, { withFileTypes: true })
  for (const item of rootItems) {
    if (item.isFile() && item.name.endsWith('.md')) {
      const fullPath = path.join(ROOT, item.name)
      const errors = validateFile(fullPath, registry)
      allErrors.push(...errors)
    }
  }

  return allErrors
}

function main() {
  console.log('Building link registry...')
  const registry = buildRegistry()
  console.log(`Found ${registry.entries.size} registered IDs\n`)

  console.log('Validating wiki-links...')
  const errors = validateAllFiles(registry)

  if (errors.length === 0) {
    console.log('\nAll wiki-links are valid.')
    process.exit(0)
  }

  console.log(`\nFound ${errors.length} issue(s):\n`)

  for (const error of errors) {
    const relativePath = path.relative(ROOT, error.file)
    console.log(`${relativePath}:${error.line}`)
    console.log(`  ${error.link}`)
    console.log(`  ${error.message}\n`)
  }

  process.exit(1)
}

main()
