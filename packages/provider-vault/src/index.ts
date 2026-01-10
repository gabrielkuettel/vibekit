/**
 * Vault Provider Package
 *
 * HashiCorp Vault-based account provider for secure Algorand key management.
 * Keys never leave Vault - all signing happens via Transit secrets engine.
 * Account metadata is stored in Vault's KV secrets engine.
 */

export { VaultClient } from './client.js'
export type { AccountMetadata } from './client.js'
export { VaultProvider } from './provider.js'
export type { VaultProviderConfig } from './types.js'
