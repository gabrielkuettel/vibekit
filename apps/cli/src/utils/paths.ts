/**
 * Path Utilities
 *
 * Helper functions for path manipulation.
 */

import { join, resolve } from 'path'

export function expandPath(inputPath: string): string {
  let expanded = inputPath

  // Expand ~ to home directory
  if (expanded.startsWith('~/')) {
    const { homedir } = require('os')
    expanded = join(homedir(), expanded.slice(2))
  } else if (expanded === '~') {
    const { homedir } = require('os')
    expanded = homedir()
  }

  // Resolve to absolute path
  return resolve(expanded)
}
