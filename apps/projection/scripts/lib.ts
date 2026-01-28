/**
 * Artifact reading and reference resolution utilities.
 * Used by generateSurfaces.ts and tested by lib.test.ts.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, resolve, dirname } from 'path'
import matter from 'gray-matter'

export interface ParsedLink {
  label: string
  url: string
}

export interface WikiLink {
  id: string
  section?: string
  displayText?: string
}

export interface ResolvedReference {
  label: string
  slug: string
  frontmatter: Record<string, unknown>
  content: string
  page: string
  links: ParsedLink[]
}

export interface Artifact {
  slug: string
  frontmatter: Record<string, unknown>
  content: string
  references: ResolvedReference[]
}

export function readArtifact(dir: string): { frontmatter: Record<string, unknown>; content: string } | null {
  const aboutPath = join(dir, 'about.md')
  if (!existsSync(aboutPath)) return null
  const { data, content } = matter(readFileSync(aboutPath, 'utf-8'))
  return { frontmatter: data, content: content.trim() }
}

export function readPage(dir: string): string | null {
  const pagePath = join(dir, 'page.md')
  if (!existsSync(pagePath)) return null
  return readFileSync(pagePath, 'utf-8').trim()
}

export function parseMarkdownLinks(md: string): ParsedLink[] {
  const links: ParsedLink[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  while ((match = re.exec(md)) !== null) {
    links.push({ label: match[1], url: match[2] })
  }
  return links
}

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
