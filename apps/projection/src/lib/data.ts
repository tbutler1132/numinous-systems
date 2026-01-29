/**
 * @file Data loading utilities for surfaces and artifacts.
 *
 * This module provides functions to load pre-generated JSON data that
 * powers the navigation system and content pages. The data is generated
 * at build time by scripts/generateSurfaces.ts from canonical markdown
 * sources in nodes/org/.
 *
 * Data files:
 * - public/data/surfaces.json: Navigation surfaces (locations, devices)
 * - public/data/heros-journey.json: Stage artifacts with references
 *
 * @see scripts/generateSurfaces.ts - Generates the JSON data
 * @see nodes/org/entities/surfaces.md - Canonical surface definitions
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { NodeRef } from '@numinous-systems/node'
import type { AccessLevel } from '@numinous-systems/identity'

/** A markdown link extracted from content */
export interface ParsedLink {
  label: string
  url: string
}

/** A resolved reference to another artifact (song, fragment, etc.) */
export interface Reference {
  /** Display label from the original link */
  label: string
  /** URL-safe identifier */
  slug: string
  /** YAML frontmatter from the referenced artifact */
  frontmatter: Record<string, unknown>
  /** Markdown content body */
  content: string
  /** Optional page.md content */
  page: string
  /** Links found within the referenced content */
  links: ParsedLink[]
}

/** A stage artifact from the Hero's Journey collection */
export interface Artifact {
  /** URL-safe identifier (directory name) */
  slug: string
  /** YAML frontmatter (title, status, etc.) */
  frontmatter: Record<string, unknown>
  /** Markdown content from about.md */
  content: string
  /** Resolved references to related artifacts */
  references: Reference[]
}

/**
 * Loads the Hero's Journey artifacts from pre-generated JSON.
 *
 * Returns all stage artifacts with their resolved references. Used by
 * the /heros-journey pages to render content.
 *
 * @returns Array of Artifact objects representing each stage
 */
export function getHerosJourney(): Artifact[] {
  const raw = readFileSync(join(process.cwd(), 'public/data/heros-journey.json'), 'utf-8')
  return JSON.parse(raw)
}

/** Surface category for visual grouping (plaza = public spaces, exhibit = curated work) */
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
 * Parses access level from surface data.
 * Uses explicit 'access' column if present, falls back to visibility-based inference.
 *
 * @param access - Explicit access level from surfaces.json (if present)
 * @param visibility - Visibility string ('public' or 'private')
 * @returns AccessLevel for the surface
 */
function parseAccessLevel(access: string | undefined, visibility: string): AccessLevel {
  if (access && ['anonymous', 'viewer', 'supporter', 'contributor', 'collaborator'].includes(access)) {
    return access as AccessLevel
  }
  // Fallback: private surfaces require viewer, public are anonymous
  return visibility === 'private' ? 'viewer' : 'anonymous'
}

/**
 * Loads and parses all active surfaces from pre-generated JSON.
 *
 * Surfaces define the navigable locations and device features available
 * in the spatial navigation system. Only surfaces with status='active'
 * are included.
 *
 * @returns Array of Surface objects for navigation
 */
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
      requiredAccess: parseAccessLevel(r.access, r.visibility),
      category: (['plaza', 'exhibit'].includes(r.category) ? r.category : null) as SurfaceCategory,
    }))
}
