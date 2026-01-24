/**
 * Session Store
 *
 * Filesystem-based session persistence for WalletConnect.
 * Stores session data in ~/.config/vibekit/walletconnect-session.json
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'
import type { SessionTypes } from '@walletconnect/types'
import type { StoredSession } from './types.js'

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.config', 'vibekit')
const SESSION_FILENAME = 'walletconnect-session.json'

/**
 * Get the session file path.
 */
function getSessionPath(configDir?: string): string {
  const dir = configDir?.replace(/^~/, os.homedir()) ?? DEFAULT_CONFIG_DIR
  return path.join(dir, SESSION_FILENAME)
}

/**
 * Save a WalletConnect session to the filesystem.
 *
 * @param session - Session data to save
 * @param configDir - Optional config directory override
 */
export async function saveSession(
  session: SessionTypes.Struct,
  configDir?: string
): Promise<void> {
  const sessionPath = getSessionPath(configDir)
  const dir = path.dirname(sessionPath)

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true })

  const storedSession: StoredSession = {
    topic: session.topic,
    session,
    storedAt: Date.now(),
  }

  await fs.writeFile(sessionPath, JSON.stringify(storedSession, null, 2), 'utf-8')
}

/**
 * Load a WalletConnect session from the filesystem.
 *
 * @param configDir - Optional config directory override
 * @returns Session data or null if not found
 */
export async function loadSession(configDir?: string): Promise<SessionTypes.Struct | null> {
  const sessionPath = getSessionPath(configDir)

  try {
    const data = await fs.readFile(sessionPath, 'utf-8')
    const stored = JSON.parse(data) as StoredSession

    // Check if session has expired
    if (stored.session.expiry && stored.session.expiry * 1000 < Date.now()) {
      // Session expired, clean up
      await clearSession(configDir)
      return null
    }

    return stored.session
  } catch (error) {
    // File doesn't exist or is invalid
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    // Log unexpected errors but don't throw - treat as no session
    console.error('Failed to load WalletConnect session:', error)
    return null
  }
}

/**
 * Clear the stored WalletConnect session.
 *
 * @param configDir - Optional config directory override
 */
export async function clearSession(configDir?: string): Promise<void> {
  const sessionPath = getSessionPath(configDir)

  try {
    await fs.unlink(sessionPath)
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to clear WalletConnect session:', error)
    }
  }
}

/**
 * Check if a session file exists.
 *
 * @param configDir - Optional config directory override
 * @returns True if session file exists
 */
export async function hasSession(configDir?: string): Promise<boolean> {
  const sessionPath = getSessionPath(configDir)

  try {
    await fs.access(sessionPath)
    return true
  } catch {
    return false
  }
}
