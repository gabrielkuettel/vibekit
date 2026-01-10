/**
 * Vault Types
 *
 * Type definitions for Vault integration.
 */

/**
 * Vault seal keys and root token (stored locally)
 */
export interface VaultSealData {
  keys: string[]
  keysBase64: string[]
  rootToken: string
}

/**
 * Status of Vault container
 */
export interface VaultStatus {
  initialized: boolean
  vaultRunning: boolean
  vaultSealed: boolean
  vaultUrl: string
}

/**
 * Result of vault initialization
 */
export interface VaultInitResult {
  keys: string[]
  keysBase64: string[]
  rootToken: string
}

/**
 * Information about an MCP token
 */
export interface McpTokenInfo {
  /** Token accessor (for display, doesn't reveal the token) */
  accessor: string
  /** Display name */
  displayName: string
  /** Policies attached to the token */
  policies: string[]
  /** When the token was created */
  createdAt: string
  /** When the token expires (null = never) */
  expiresAt: string | null
  /** Remaining TTL in seconds (0 = infinite) */
  ttlSeconds: number
}
