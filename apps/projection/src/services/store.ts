/**
 * @file Observation store factory and database path resolution.
 *
 * This module provides access to the personal node's observation database.
 * The database stores sensor observations (financial transactions, thoughts, etc.)
 * and is located in nodes/personal/data/observations.db.
 *
 * @see @numinous-systems/sensor - Core observation infrastructure
 * @see services/dashboard.ts - Uses the store for dashboard queries
 */

import { existsSync } from 'fs'
import { ObservationStore, resolveDbPath } from '@numinous-systems/sensor'
import { findWorkspaceRoot } from '@/lib/workspace'

/**
 * Gets the absolute path to the personal node's observation database.
 *
 * Uses resolveDbPath from @numinous-systems/sensor which follows the
 * convention: {workspaceRoot}/nodes/{nodeId}/data/observations.db
 *
 * @returns Absolute path to the SQLite database file
 */
export function getDbPath(): string {
  const workspaceRoot = findWorkspaceRoot()
  return resolveDbPath(workspaceRoot, 'personal')
}

/**
 * Checks if the observation database file exists.
 *
 * @returns True if the database file exists, false otherwise
 */
export function dbExists(): boolean {
  return existsSync(getDbPath())
}

/**
 * Creates an ObservationStore instance for the personal node.
 *
 * Opens a connection to the SQLite database. The caller MUST call
 * store.close() when done to release the database connection.
 *
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
export async function createStore(): Promise<ObservationStore> {
  return ObservationStore.create(getDbPath())
}
