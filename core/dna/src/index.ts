/**
 * DNA — The Genetic Code
 *
 * This file exports the invariant constants that define the system.
 * All packages import from here for shared values.
 *
 * If you need to change a fundamental value, change it HERE.
 * Changes here are mutations to the species, not to any single component.
 *
 * See about.md for the full specification in prose.
 * See index.test.ts for the tripwire that catches unintended changes.
 */

// ═══════════════════════════════════════════════════════════════════════════
// RE-EXPORTS — Types defined in their own packages, re-exported for convenience
// ═══════════════════════════════════════════════════════════════════════════

// Node types live in @numinous-systems/node
export type { Node, NodeRef, NodeRelation } from "@numinous-systems/node";

// Identity types live in @numinous-systems/identity
export type { Identity, Grant, AccessLevel } from "@numinous-systems/identity";

// Observation types live in @numinous-systems/memory
export type { Observation, StoredObservation } from "@numinous-systems/memory";

// ═══════════════════════════════════════════════════════════════════════════
// ACCESS LEVELS — The hierarchy of trust
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Access levels in ascending order.
 * Each level includes all permissions of levels below it.
 *
 * This is re-exported from @numinous-systems/identity but declared here
 * as the canonical reference for the ordering.
 */
export const ACCESS_LEVELS = [
  "anonymous",
  "viewer",
  "supporter",
  "contributor",
  "collaborator",
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// SURFACE — Navigation primitives
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Surface types: internal paths vs external URLs
 */
export const SURFACE_TYPES = ["internal", "external"] as const;
export type SurfaceType = (typeof SURFACE_TYPES)[number];

/**
 * Surface kinds: places (locations) vs capabilities (devices)
 */
export const SURFACE_KINDS = ["location", "device"] as const;
export type SurfaceKind = (typeof SURFACE_KINDS)[number];

/**
 * Surface categories for visual grouping
 */
export const SURFACE_CATEGORIES = ["plaza", "exhibit"] as const;
export type SurfaceCategory = (typeof SURFACE_CATEGORIES)[number] | null;

/**
 * Surface status
 */
export const SURFACE_STATUSES = ["active", "inactive"] as const;
export type SurfaceStatus = (typeof SURFACE_STATUSES)[number];

/**
 * Surface visibility
 */
export const SURFACE_VISIBILITIES = ["public", "private"] as const;
export type SurfaceVisibility = (typeof SURFACE_VISIBILITIES)[number];

/**
 * Behavior when surface is inaccessible
 */
export const LOCKED_BEHAVIORS = ["hide", "show"] as const;
export type LockedBehavior = (typeof LOCKED_BEHAVIORS)[number];

// ═══════════════════════════════════════════════════════════════════════════
// ARTIFACT — Durable output primitive
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The files that can exist in an artifact folder.
 * about.md is required; others are optional.
 */
export const ARTIFACT_FILES = [
  "about.md", // required - the concept
  "notes.md", // optional - working material
  "page.md", // optional - the encounter
  "manifest.md", // optional - structure tracking
] as const;
export type ArtifactFile = (typeof ARTIFACT_FILES)[number];

/**
 * The required files for a valid artifact.
 */
export const ARTIFACT_REQUIRED_FILES = ["about.md"] as const;

/**
 * Parsed content from a markdown file within an artifact.
 * Separates metadata from the markdown body.
 */
export interface ArtifactContent {
  /** Structured data about the content (parsed from YAML frontmatter) */
  metadata: Record<string, unknown>;
  /** Markdown body */
  body: string;
}

/**
 * A durable output belonging to a node.
 *
 * Artifacts are folders containing markdown files. The structure is:
 * - about.md (required) — the concept, what this artifact IS
 * - notes.md (optional) — working material, drafts, open questions
 * - page.md (optional) — the encounter, what someone meets when engaging
 * - manifest.md (optional) — structure tracking for artifacts with source material
 *
 * An artifact without about.md is not valid.
 */
export interface Artifact {
  /** Filesystem path to the artifact folder */
  path: string;
  /** URL-safe identifier derived from folder name */
  slug: string;
  /** The node this artifact belongs to */
  nodeId: string;
  /** The concept — parsed about.md (always present) */
  about: ArtifactContent;
  /** Working material — parsed notes.md */
  notes?: ArtifactContent;
  /** The encounter — parsed page.md */
  page?: ArtifactContent;
  /** Structure tracking — parsed manifest.md */
  manifest?: ArtifactContent;
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP — What must exist for a node to be valid
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Every node must have these surfaces.
 * A node without a home surface is not yet a node.
 */
export const REQUIRED_NODE_SURFACES = ["home"] as const;

/**
 * Every node must have these artifacts.
 * A node without a home artifact is not yet a node.
 */
export const REQUIRED_NODE_ARTIFACTS = ["home"] as const;

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA VERSION — For data migrations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Current DNA schema version.
 * Increment when the shape of invariants changes.
 */
export const DNA_SCHEMA_VERSION = 1 as const;
