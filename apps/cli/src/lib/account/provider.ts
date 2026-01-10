/**
 * Account Provider Operations
 *
 * Pure business logic for provider creation and account operations.
 * No CLI dependencies (@clack/prompts, picocolors).
 */

import { VaultClient, VaultProvider, type VaultProviderConfig } from '@vibekit/provider-vault'
import { KeyringProvider } from '@vibekit/provider-keyring'
import type { AccountProvider, AccountInfo } from '@vibekit/provider-interface'
import type { ProviderType } from './types'

export interface ProviderContext {
  provider: AccountProvider
  vaultClient?: VaultClient
}

export interface VaultConfigOptions {
  url?: string
  token: string
  transitPath?: string
  keyPrefix?: string
}

export function buildVaultConfig(options: VaultConfigOptions): VaultProviderConfig {
  return {
    url: options.url || process.env.VAULT_ADDR || 'http://localhost:8200',
    token: options.token,
    transitPath: options.transitPath || process.env.VAULT_TRANSIT_PATH || 'transit',
    keyPrefix: options.keyPrefix || process.env.VAULT_KEY_PREFIX || 'algo-',
  }
}

export async function createVaultContext(token: string): Promise<ProviderContext> {
  const config = buildVaultConfig({ token })
  const vaultProvider = new VaultProvider(config)

  const available = await vaultProvider.isAvailable()
  if (!available) {
    throw new Error('Vault is not available or is sealed')
  }

  return {
    provider: vaultProvider,
    vaultClient: vaultProvider.getVaultClient(),
  }
}

export async function createKeyringContext(): Promise<ProviderContext> {
  const keyringProvider = new KeyringProvider()

  const available = await keyringProvider.isAvailable()
  if (!available) {
    throw new Error('Keyring is not available')
  }

  return { provider: keyringProvider }
}

export async function getAccount(
  provider: AccountProvider,
  name: string
): Promise<AccountInfo | null> {
  return provider.getAccount(name)
}

export function parseProviderType(value: string): ProviderType | null {
  if (value === 'vault' || value === 'keyring') {
    return value
  }
  return null
}
