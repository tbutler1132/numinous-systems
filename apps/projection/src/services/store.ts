/**
 * @file Observation store factory and database path resolution.
 *
 * This module provides access to a node's observation database.
 * The database stores sensor observations (financial transactions, etc.)
 * and is located in nodes/{nodeId}/data/observations.db.
 *
 * @see @numinous-systems/memory - Core observation storage infrastructure
 * @see services/sensors.ts - Uses the store for sensor status queries
 */

import { existsSync } from 'fs'
import { ObservationStore, resolveDbPath } from '@numinous-systems/memory'
import { findWorkspaceRoot } from '@/lib/workspace'

/**
 * Gets the absolute path to a node's observation database.
 *
 * Uses resolveDbPath from @numinous-systems/memory which follows the
 * convention: {workspaceRoot}/nodes/{nodeId}/data/observations.db
 *
 * @param nodeId - The node identifier (default: 'personal')
 * @returns Absolute path to the SQLite database file
 */
export function getDbPath(nodeId: string = 'personal'): string {
  const workspaceRoot = findWorkspaceRoot()
  return resolveDbPath(workspaceRoot, nodeId)
}

/**
 * Checks if the observation database file exists.
 *
 * @param nodeId - The node identifier (default: 'personal')
 * @returns True if the database file exists, false otherwise
 */
export function dbExists(nodeId: string = 'personal'): boolean {
  return existsSync(getDbPath(nodeId))
}

/**
 * Creates an ObservationStore instance for a node.
 *
 * Opens a connection to the SQLite database. The caller MUST call
 * store.close() when done to release the database connection.
 *
 * @param nodeId - The node identifier (default: 'personal')
 * @returns Promise resolving to an ObservationStore instance
 * @example
 * ```ts
 * const store = await createStore()
 * try {
 *   const status = store.getStatus()
 * } finally {
 *   store.close()
 * }
 * ```
 */
export async function createStore(nodeId: string = 'personal'): Promise<ObservationStore> {
  return ObservationStore.create(getDbPath(nodeId))
}
