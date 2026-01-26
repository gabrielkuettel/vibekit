/**
 * Keyring Types
 *
 * Types for the OS keyring abstraction layer.
 */

/**
 * Interface for a secret store that can get, set, and delete secrets.
 */
export interface SecretStore {
  /**
   * Get a secret by key.
   * @param key - The key to retrieve
   * @returns The secret value, or null if not found
   */
  get(key: string): Promise<string | null>

  /**
   * Set a secret.
   * @param key - The key to store
   * @param value - The secret value
   */
  set(key: string, value: string): Promise<void>

  /**
   * Delete a secret.
   * @param key - The key to delete
   */
  delete(key: string): Promise<void>

  /**
   * Check if a secret exists.
   * @param key - The key to check
   * @returns True if the secret exists
   */
  has(key: string): Promise<boolean>

  /**
   * Find all credentials with keys matching a pattern.
   * @param prefix - The prefix to search for
   * @returns Array of matching keys
   */
  findKeys(prefix: string): Promise<string[]>
}

/**
 * Keys used by vibekit in the keyring.
 *
 * Only high-grade secrets (transaction signing) are stored in keyring.
 * Low-grade secrets (GitHub PAT, dispenser token) are stored in SQLite via @vibekit/db.
 */
export const KEYRING_KEYS = {
  /** Vault MCP token - used by MCP server for signing */
  VAULT_MCP_TOKEN: 'config:vault-mcp-token',
} as const

/**
 * Prefix for account-related secrets.
 */
export const ACCOUNT_KEY_PREFIX = 'account:'

/**
 * Build a keyring key for an account's mnemonic.
 */
export function accountMnemonicKey(name: string): string {
  return `${ACCOUNT_KEY_PREFIX}${name}:mnemonic`
}

/**
 * Build a keyring key for an account's private key.
 */
export function accountPrivateKeyKey(name: string): string {
  return `${ACCOUNT_KEY_PREFIX}${name}:privateKey`
}
