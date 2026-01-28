/**
 * @file Artifact reading and reference resolution utilities.
 *
 * This module provides functions for:
 * - Reading artifact directories (about.md + optional page.md)
 * - Parsing markdown links and wiki-style [[links]]
 * - Resolving cross-references between artifacts
 * - Parsing markdown tables (for surfaces.md)
 *
 * Used by generateSurfaces.ts to build the JSON data files.
 *
 * @see generateSurfaces.ts - Main consumer of these utilities
 * @see lib.test.ts - Unit tests for these functions
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import matter from 'gray-matter'

/** A parsed markdown link [label](url) */
export interface ParsedLink {
  label: string
  url: string
}

/** A parsed wiki-style link [[id#section|display]] */
export interface WikiLink {
  /** Target identifier */
  id: string
  /** Optional section anchor */
  section?: string
  /** Optional display text override */
  displayText?: string
}

/** A resolved reference to another artifact with its content loaded */
export interface ResolvedReference {
  /** Display label from the original link */
  label: string
  /** URL-safe identifier (directory or file name) */
  slug: string
  /** YAML frontmatter from the referenced artifact */
  frontmatter: Record<string, unknown>
  /** Markdown content body */
  content: string
  /** Page content (from page.md if it exists) */
  page: string
  /** Links found within the referenced content */
  links: ParsedLink[]
}

/** A collected artifact with its resolved references */
export interface Artifact {
  /** URL-safe identifier (directory name) */
  slug: string
  /** YAML frontmatter from about.md */
  frontmatter: Record<string, unknown>
  /** Markdown content from about.md */
  content: string
  /** Resolved references from page.md links */
  references: ResolvedReference[]
}

/**
 * Reads an artifact's about.md file and parses its frontmatter.
 *
 * @param dir - Directory containing the artifact
 * @returns Parsed frontmatter and content, or null if about.md doesn't exist
 */
export function readArtifact(dir: string): { frontmatter: Record<string, unknown>; content: string } | null {
  const aboutPath = join(dir, 'about.md')
  if (!existsSync(aboutPath)) return null
  const { data, content } = matter(readFileSync(aboutPath, 'utf-8'))
  return { frontmatter: data, content: content.trim() }
}

/**
 * Reads an artifact's page.md file if it exists.
 *
 * page.md contains additional content and references for the artifact.
 *
 * @param dir - Directory containing the artifact
 * @returns Page content, or null if page.md doesn't exist
 */
export function readPage(dir: string): string | null {
  const pagePath = join(dir, 'page.md')
  if (!existsSync(pagePath)) return null
  return readFileSync(pagePath, 'utf-8').trim()
}

/**
 * Parses standard markdown links [label](url) from content.
 *
 * @param md - Markdown content to parse
 * @returns Array of parsed links
 */
export function parseMarkdownLinks(md: string): ParsedLink[] {
  const links: ParsedLink[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  while ((match = re.exec(md)) !== null) {
    links.push({ label: match[1], url: match[2] })
  }
  return links
}

/**
 * Parses wiki-style links [[id#section|display]] from content.
 *
 * Supports:
 * - [[id]] - Simple link
 * - [[id#section]] - Link with section anchor
 * - [[id|display]] - Link with custom display text
 * - [[id#section|display]] - Full form
 *
 * @param md - Markdown content to parse
 * @returns Array of parsed wiki links
 */
export function parseWikiLinks(md: string): WikiLink[] {
  const links: WikiLink[] = []
  const re = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g
  let match
  while ((match = re.exec(md)) !== null) {
    links.push({
      id: match[1],
      section: match[2] || undefined,
      displayText: match[3] || undefined,
    })
  }
  return links
}

/**
 * Resolves a markdown link to its referenced artifact.
 *
 * Handles two cases:
 * 1. Link to page.md inside an artifact folder (with about.md)
 * 2. Link to a standalone .md file
 *
 * @param link - Parsed link to resolve
 * @param fromDir - Directory the link is relative to
 * @returns Resolved reference with loaded content, or null if not resolvable
 */
export function resolveReference(link: ParsedLink, fromDir: string): ResolvedReference | null {
  if (link.url.startsWith('http')) return null

  const targetPath = resolve(fromDir, link.url)

  // Case 1: link points to a page.md inside an artifact folder (has about.md)
  const artifactDir = dirname(targetPath)
  const artifact = readArtifact(artifactDir)
  if (artifact) {
    const page = readPage(artifactDir) ?? ''
    const pageLinks = parseMarkdownLinks(page)
    return {
      label: link.label,
      slug: artifactDir.split('/').pop() ?? '',
      frontmatter: artifact.frontmatter,
      content: artifact.content,
      page,
      links: pageLinks,
    }
  }

  // Case 2: link points to a standalone .md file
  if (existsSync(targetPath) && targetPath.endsWith('.md')) {
    const { data, content } = matter(readFileSync(targetPath, 'utf-8'))
    const slug = targetPath.split('/').pop()?.replace(/\.md$/, '') ?? ''
    return {
      label: link.label,
      slug,
      frontmatter: data,
      content: content.trim(),
      page: '',
      links: [],
    }
  }

  return null
}

/**
 * Parses a markdown table into an array of row objects.
 *
 * Expects standard markdown table format:
 * | header1 | header2 |
 * |---------|---------|
 * | value1  | value2  |
 *
 * @param md - Markdown content containing a table
 * @returns Array of objects with lowercase header keys
 */
export function parseMarkdownTable(md: string): Record<string, string>[] {
  const lines = md.split('\n')
  let headerLine: string | undefined
  let separatorSkipped = false
  const rows: Record<string, string>[] = []
  let headers: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.includes('|')) continue

    if (!headerLine) {
      headerLine = trimmed
      headers = trimmed
        .split('|')
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
      continue
    }

    if (!separatorSkipped) {
      separatorSkipped = true
      continue
    }

    const cells = trimmed
      .split('|')
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length) // drop leading/trailing empty splits

    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? ''
    })
    rows.push(row)
  }

  return rows
}

/**
 * Collects all artifacts from a directory.
 *
 * Scans subdirectories for artifact folders (those with about.md),
 * reads their content, parses page.md for references, and resolves
 * all cross-references.
 *
 * @param sourceDir - Directory containing artifact subdirectories
 * @returns Array of collected artifacts with resolved references
 */
export function collectArtifacts(sourceDir: string): Artifact[] {
  const entries = readdirSync(sourceDir)
    .filter((e) => statSync(join(sourceDir, e)).isDirectory())
    .sort()

  const artifacts: Artifact[] = []

  for (const entry of entries) {
    const dir = join(sourceDir, entry)
    const artifact = readArtifact(dir)
    if (!artifact) continue

    const page = readPage(dir) ?? ''
    const pageLinks = parseMarkdownLinks(page)

    const references: ResolvedReference[] = []
    for (const link of pageLinks) {
      const ref = resolveReference(link, dir)
      if (ref) references.push(ref)
    }

    artifacts.push({
      slug: entry,
      frontmatter: artifact.frontmatter,
      content: artifact.content,
      references,
    })
  }

  return artifacts
}
