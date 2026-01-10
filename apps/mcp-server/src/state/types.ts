/**
 * State Type Definitions
 *
 * Type definitions for state management.
 */

import type { VaultProviderConfig } from '@vibekit/provider-vault'
import type { NetworkType, NetworkPreset } from '../config.js'

// Re-export for consumers
export type { VaultProviderConfig }
export type { NetworkType, NetworkPreset }

export interface NetworkConfig extends NetworkPreset {
  network: NetworkType
}

export interface ProviderConfigs {
  vault?: VaultProviderConfig
}

export interface InitConfig {
  /** Vault configuration (when vault is available) */
  vaultConfig?: VaultProviderConfig
  /** TestNet dispenser API token */
  dispenserToken?: string
}
