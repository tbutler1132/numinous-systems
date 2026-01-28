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
