/**
 * Keyring cleanup operations
 */

import { ACCOUNT_KEY_PREFIX, createKeyringStore, KEYRING_KEYS } from '@vibekit/keyring'
import { deleteGithubToken, deleteDispenserToken } from '@vibekit/db'

export interface KeyringClearResult {
  cleared: number
  errors: string[]
}

/**
 * Clear all vibekit secrets from OS keyring and SQLite
 */
export async function clearKeyringSecrets(): Promise<KeyringClearResult> {
  const keyring = createKeyringStore()
  const errors: string[] = []
  let cleared = 0

  // Clear high-grade secrets from keyring (Vault MCP token only)
  const keysToDelete = [KEYRING_KEYS.VAULT_MCP_TOKEN]

  for (const key of keysToDelete) {
    try {
      if (await keyring.has(key)) {
        await keyring.delete(key)
        cleared++
      }
    } catch (error) {
      errors.push(
        `Failed to delete ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Clear account keys from keyring (find all keys starting with account:)
  try {
    const accountKeys = await keyring.findKeys(ACCOUNT_KEY_PREFIX)
    for (const key of accountKeys) {
      try {
        await keyring.delete(key)
        cleared++
      } catch (error) {
        errors.push(
          `Failed to delete ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
  } catch {
    // findKeys may fail if keyring is unavailable
  }

  // Clear low-grade secrets from SQLite
  try {
    deleteGithubToken()
    cleared++
  } catch {
    // Ignore errors - token may not exist
  }

  try {
    deleteDispenserToken()
    cleared++
  } catch {
    // Ignore errors - token may not exist
  }

  return { cleared, errors }
}
