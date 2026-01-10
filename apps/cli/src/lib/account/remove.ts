/**
 * Account Removal Operations
 *
 * Pure business logic for removing accounts from providers.
 * No CLI dependencies (@clack/prompts, picocolors).
 */

import type { VaultClient } from '@vibekit/provider-vault'
import type { KeyringProvider } from '@vibekit/provider-keyring'

export interface RemoveAccountResult {
  success: boolean
  error?: string
}

export async function removeVaultAccount(
  name: string,
  vaultClient: VaultClient
): Promise<RemoveAccountResult> {
  try {
    await vaultClient.deleteKey(name)
    await vaultClient.deleteAccountMetadata(name)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

export async function removeKeyringAccount(
  name: string,
  keyringProvider: KeyringProvider
): Promise<RemoveAccountResult> {
  try {
    await keyringProvider.removeAccount(name)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}
