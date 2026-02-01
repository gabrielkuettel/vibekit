/**
 * Session Store
 *
 * Filesystem-based session persistence for wallet connections.
 * Stores session data per wallet in ~/.config/vibekit/wallets/
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'
import type { StoredSession } from './types.js'
import type { WalletId } from '@vibekit/provider-interface'

const DEFAULT_CONFIG_DIR = path.join(os.homedir(), '.config', 'vibekit', 'wallets')

/**
 * Get the session file path for a wallet.
 */
function getSessionPath(walletId: WalletId, configDir?: string): string {
  const dir = configDir?.replace(/^~/, os.homedir()) ?? DEFAULT_CONFIG_DIR
  return path.join(dir, `${walletId}-session.json`)
}

/**
 * Save a wallet session to the filesystem.
 *
 * @param walletId - Wallet identifier
 * @param session - Session data to save
 * @param configDir - Optional config directory override
 */
export async function saveSession(
  walletId: WalletId,
  session: Omit<StoredSession, 'walletId' | 'storedAt'>,
  configDir?: string
): Promise<void> {
  const sessionPath = getSessionPath(walletId, configDir)
  const dir = path.dirname(sessionPath)

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true })

  const storedSession: StoredSession = {
    ...session,
    walletId,
    storedAt: Date.now(),
  }

  await fs.writeFile(sessionPath, JSON.stringify(storedSession, null, 2), 'utf-8')
}

/**
 * Load a wallet session from the filesystem.
 *
 * @param walletId - Wallet identifier
 * @param configDir - Optional config directory override
 * @returns Session data or null if not found
 */
export async function loadSession(
  walletId: WalletId,
  configDir?: string
): Promise<StoredSession | null> {
  const sessionPath = getSessionPath(walletId, configDir)

  try {
    const data = await fs.readFile(sessionPath, 'utf-8')
    const stored = JSON.parse(data) as StoredSession

    // Basic validation - ensure required fields exist
    if (!stored.bridge || !stored.key || !stored.clientId || !stored.accounts) {
      await clearSession(walletId, configDir)
      return null
    }

    return stored
  } catch (error) {
    // File doesn't exist or is invalid
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    // Invalid JSON or other error - treat as no session
    return null
  }
}

/**
 * Clear the stored wallet session.
 *
 * @param walletId - Wallet identifier
 * @param configDir - Optional config directory override
 */
export async function clearSession(walletId: WalletId, configDir?: string): Promise<void> {
  const sessionPath = getSessionPath(walletId, configDir)

  try {
    await fs.unlink(sessionPath)
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      // Silently ignore other errors
    }
  }
}

/**
 * Check if a session file exists.
 *
 * @param walletId - Wallet identifier
 * @param configDir - Optional config directory override
 * @returns True if session file exists
 */
export async function hasSession(walletId: WalletId, configDir?: string): Promise<boolean> {
  const sessionPath = getSessionPath(walletId, configDir)

  try {
    await fs.access(sessionPath)
    return true
  } catch {
    return false
  }
}
