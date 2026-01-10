/**
 * Account Providers Module
 *
 * Re-exports account provider packages for use in the MCP server.
 *
 * Supported providers:
 * - Vault: HashiCorp Vault Transit (secure key storage, keys never leave Vault)
 * - Keyring: OS keyring (macOS Keychain, Linux libsecret)
 */

// Interface (shared contract for all providers)
export type {
  AccountProvider,
  AccountProviderType,
  AccountInfo,
  AccountWithSigner,
} from '@vibekit/provider-interface'

// Vault Provider
export { VaultProvider, VaultClient, type VaultProviderConfig } from '@vibekit/provider-vault'

// Keyring Provider
export { KeyringProvider } from '@vibekit/provider-keyring'
