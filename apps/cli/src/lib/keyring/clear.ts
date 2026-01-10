/**
 * Keyring cleanup operations
 */

import { ACCOUNT_KEY_PREFIX, createKeyringStore, KEYRING_KEYS } from '@vibekit/keyring'

export interface KeyringClearResult {
  cleared: number
  errors: string[]
}

/**
 * Clear all vibekit secrets from OS keyring
 */
export async function clearKeyringSecrets(): Promise<KeyringClearResult> {
  const keyring = createKeyringStore()
  const errors: string[] = []
  let cleared = 0

  // Clear all known keys
  const keysToDelete = [
    KEYRING_KEYS.VAULT_MCP_TOKEN,
    KEYRING_KEYS.GITHUB_TOKEN,
    KEYRING_KEYS.DISPENSER_TOKEN,
  ]

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

  // Clear account keys (find all keys starting with account:)
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

  return { cleared, errors }
}
