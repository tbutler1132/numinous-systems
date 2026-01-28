import { readFileSync } from 'fs'
import { join } from 'path'
import type { NodeRef } from '@numinous-systems/node'
import type { AccessLevel } from '@numinous-systems/identity'

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

export type SurfaceCategory = 'plaza' | 'exhibit' | null

/**
 * A navigable surface within a node.
 *
 * NOTE: Surface is defined locally in projection for now, but conceptually
 * belongs to the node system (surfaces belong to nodes). If other apps need
 * this type, extract to @numinous-systems/node or a new @numinous-systems/surface.
 *
 * Extraction trigger: another app imports this type.
 */
export interface Surface {
  name: string
  path: string
  nodeId: NodeRef
  kind: 'location' | 'device'
  external: boolean
  /** Minimum access level required to view this surface */
  requiredAccess: AccessLevel
  category: SurfaceCategory
}

/**
 * Map visibility string from data to AccessLevel.
 * 'public' -> 'anonymous' (no identity required)
 * 'private' -> 'viewer' (requires authenticated identity)
 */
function parseAccessLevel(visibility: string): AccessLevel {
  return visibility === 'private' ? 'viewer' : 'anonymous'
}

export function getSurfaces(): Surface[] {
  const raw = readFileSync(join(process.cwd(), 'public/data/surfaces.json'), 'utf-8')
  const rows: Record<string, string>[] = JSON.parse(raw)
  return rows
    .filter((r) => r.status === 'active')
    .map((r) => ({
      name: r.name,
      path: r.path,
      nodeId: r.node || 'org',
      kind: (r.kind === 'device' ? 'device' : 'location') as 'location' | 'device',
      external: r.type === 'external',
      requiredAccess: parseAccessLevel(r.visibility),
      category: (['plaza', 'exhibit'].includes(r.category) ? r.category : null) as SurfaceCategory,
    }))
}
