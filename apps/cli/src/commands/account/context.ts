/**
 * Account context helpers - UI wrappers for building provider contexts
 *
 * Wraps lib/account/provider with UI error handling (prompts, process.exit).
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { AccountProvider, AccountInfo } from '@vibekit/provider-interface'
import type { ProviderType } from '../../lib/account/types'
import {
  createVaultContext,
  createKeyringContext,
  getAccount,
  type ProviderContext,
} from '../../lib/account/provider'
import { getRootTokenFromEnv } from '../../lib/vault'
import { promptForRootToken } from './prompts'

export type { ProviderContext }

async function getVaultToken(): Promise<string> {
  const token = getRootTokenFromEnv() || (await promptForRootToken())
  if (!token) {
    throw new Error(
      'Vault root token not provided.\n' + 'Set VAULT_ROOT_TOKEN or enter when prompted.'
    )
  }
  return token
}

export async function getProviderContext(type: ProviderType): Promise<ProviderContext> {
  if (type === 'vault') {
    const token = await getVaultToken()
    try {
      return await createVaultContext(token)
    } catch (error) {
      const message = (error as Error).message
      if (message.includes('not available')) {
        p.log.error('Vault is not available or is sealed.')
        p.log.message(pc.dim('Run: vibekit vault start'))
        process.exit(1)
      }
      throw error
    }
  }

  try {
    return await createKeyringContext()
  } catch (error) {
    const message = (error as Error).message
    if (message.includes('not available')) {
      p.log.error('Keyring is not available.')
      process.exit(1)
    }
    throw error
  }
}

export async function getAccountOrFail(
  provider: AccountProvider,
  name: string
): Promise<AccountInfo> {
  const account = await getAccount(provider, name)
  if (!account) {
    p.log.error(`Account "${name}" not found`)
    process.exit(1)
  }
  return account
}
