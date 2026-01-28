/**
 * @file Monorepo workspace utilities.
 *
 * Provides functions to locate the workspace root directory, which is
 * needed for resolving paths to shared resources like the nodes/
 * directory and observation databases.
 */

import { existsSync } from 'fs'
import { join, resolve } from 'path'

/**
 * Finds the monorepo root by traversing up the directory tree.
 *
 * Looks for a .git directory to identify the workspace root. If no
 * .git is found, returns the current working directory as a fallback.
 *
 * @returns Absolute path to the workspace root directory
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
