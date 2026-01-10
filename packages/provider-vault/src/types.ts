/**
 * Vault Provider Types
 *
 * Configuration and type definitions for the Vault provider.
 */

/**
 * Configuration for Vault provider
 */
export interface VaultProviderConfig {
  /** Vault server URL (e.g., http://localhost:8200) */
  url: string
  /** Vault authentication token */
  token: string
  /** Transit secrets engine mount path (default: 'transit') */
  transitPath?: string
  /** Key name prefix for Algorand keys (default: 'algo-') */
  keyPrefix?: string
  /** KV secrets engine mount path for wallet metadata (default: 'vibekit') */
  kvPath?: string
}
