import type { AccessLevel, AuthResult, Grant } from "./types.js";
import { ACCESS_LEVELS } from "./types.js";

/**
 * Contract for authentication providers.
 * Apps depend on this interface, not implementations.
 */
export interface AuthProvider {
  /** Get the current identity, or null if anonymous */
  getCurrentIdentity(): Promise<AuthResult>;

  /** Check if current identity meets the required access level */
  hasAccess(required: AccessLevel): Promise<boolean>;

  /** Check if current identity has a grant for a specific resource */
  hasGrant(resourceId: string): Promise<boolean>;

  /** Check if current identity can access a resource (by level or grant) */
  canAccess(resourceId: string, requiredLevel: AccessLevel): Promise<boolean>;
}

/**
 * Check if an access level meets a requirement.
 * Returns true if `has` is at or above `required` in the hierarchy.
 */
export function meetsAccessLevel(
  has: AccessLevel,
  required: AccessLevel
): boolean {
  return ACCESS_LEVELS.indexOf(has) >= ACCESS_LEVELS.indexOf(required);
}

/**
 * Check if a grant is currently valid (not expired).
 */
export function isGrantValid(grant: Grant): boolean {
  if (!grant.expiresAt) return true;
  return new Date(grant.expiresAt) > new Date();
}

/**
 * Check if an identity can access a resource.
 * Access is granted if:
 * 1. The identity's level meets the required level, OR
 * 2. The identity has a valid grant for the resource
 */
export function canAccessResource(
  identity: AuthResult,
  resourceId: string,
  requiredLevel: AccessLevel,
  grants: Grant[]
): boolean {
  // Anonymous access check
  if (!identity) {
    return requiredLevel === "anonymous";
  }

  // Level-based access
  if (meetsAccessLevel(identity.access, requiredLevel)) {
    return true;
  }

  // Grant-based access
  const grant = grants.find(
    (g) => g.toIdentityId === identity.id && g.resourceId === resourceId
  );

  if (grant && isGrantValid(grant)) {
    return true;
  }

  return false;
}
