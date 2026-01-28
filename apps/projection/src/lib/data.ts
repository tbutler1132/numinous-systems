import { readFileSync } from 'fs'
import { join } from 'path'

export interface ParsedLink {
  label: string
  url: string
}

export interface Reference {
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
  references: Reference[]
}

export function getHerosJourney(): Artifact[] {
  const raw = readFileSync(join(process.cwd(), 'public/data/heros-journey.json'), 'utf-8')
  return JSON.parse(raw)
}

export interface Surface {
  name: string
  path: string
  external: boolean
  visibility: 'public' | 'private'
}

export function getSurfaces(): Surface[] {
  const raw = readFileSync(join(process.cwd(), 'public/data/surfaces.json'), 'utf-8')
  const rows: Record<string, string>[] = JSON.parse(raw)
  return rows
    .filter((r) => r.status === 'active')
    .map((r) => ({
      name: r.name,
      path: r.path,
      external: r.type === 'external',
      visibility: (r.visibility === 'private' ? 'private' : 'public') as 'public' | 'private',
    }))
}
