/**
 * Account Types
 *
 * Type definitions for account management.
 * Providers are the source of truth for account data.
 */

/**
 * Supported networks
 */
export type Network = 'mainnet' | 'testnet' | 'localnet'

/**
 * Supported account provider types
 */
export type ProviderType = 'vault' | 'keyring'
