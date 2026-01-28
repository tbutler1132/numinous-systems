import { existsSync } from 'fs'
import { join, resolve } from 'path'

/**
 * Find the monorepo root by traversing up to find .git
 */
export function findWorkspaceRoot(): string {
  let current = process.cwd()
  while (current !== '/') {
    if (existsSync(join(current, '.git'))) {
      return current
    }
    current = resolve(current, '..')
  }
  return process.cwd()
}
