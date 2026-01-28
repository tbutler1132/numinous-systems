import type { NodeRef } from "@numinous-systems/node";

/**
 * Access levels in ascending order of trust/access.
 * Each level includes all permissions of levels below it.
 *
 * - anonymous: No identity, public access only
 * - viewer: Has an identity, can access "low gate" content
 * - supporter: Paid or equivalent, production access
 * - contributor: Active participant, workshop access
 * - collaborator: Deep relationship, canon access
 */
export type AccessLevel =
  | "anonymous"
  | "viewer"
  | "supporter"
  | "contributor"
  | "collaborator";

/**
 * Ordered list of access levels for comparison.
 * Index position determines privilege level.
 */
export const ACCESS_LEVELS: readonly AccessLevel[] = [
  "anonymous",
  "viewer",
  "supporter",
  "contributor",
  "collaborator",
] as const;

/**
 * A known identity in the system.
 * An identity belongs to a node — it represents someone
 * operating from within that node's boundary.
 */
export interface Identity {
  /** Unique identifier */
  id: string;
  /** The node this identity belongs to */
  nodeId: NodeRef;
  /** Display name */
  name?: string;
  /** Email (optional, for communication) */
  email?: string;
  /** Current access level (baseline tier) */
  access: AccessLevel;
}

/**
 * An explicit grant of access to a specific resource.
 * Grants allow surgical permissions beyond tier-based access.
 *
 * Grants flow from one node to an identity, giving that identity
 * access to something the granting node controls.
 */
export interface Grant {
  /** The node granting access */
  fromNodeId: NodeRef;
  /** The identity receiving access */
  toIdentityId: string;
  /** What they have access to (surface path, resource ID, etc.) */
  resourceId: string;
  /** When the grant was created (ISO-8601) */
  grantedAt?: string;
  /** When the grant expires (ISO-8601), if ever */
  expiresAt?: string;
}

/**
 * The result of an authentication check.
 * Either an identity or null (anonymous).
 */
export type AuthResult = Identity | null;
