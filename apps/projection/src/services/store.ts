import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { ObservationStore, resolveDbPath } from '@numinous-systems/sensor'

/**
 * Find the monorepo root by traversing up to find .git
 */
function findWorkspaceRoot(): string {
  let current = process.cwd()
  while (current !== '/') {
    if (existsSync(join(current, '.git'))) {
      return current
    }
    current = resolve(current, '..')
  }
  return process.cwd()
}

/**
 * Get the database path for the private node
 */
export function getDbPath(): string {
  const workspaceRoot = findWorkspaceRoot()
  return resolveDbPath(workspaceRoot, 'private')
}

/**
 * Check if the database exists
 */
export function dbExists(): boolean {
  return existsSync(getDbPath())
}

/**
 * Create an ObservationStore instance for the private node.
 * Caller is responsible for calling store.close() when done.
 */
export async function createStore(): Promise<ObservationStore> {
  return ObservationStore.create(getDbPath())
}
