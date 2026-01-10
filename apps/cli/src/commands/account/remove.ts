/**
 * Account remove command - delete account from provider
 */

import pc from 'picocolors'
import * as p from '@clack/prompts'
import { KeyringProvider } from '@vibekit/provider-keyring'
import type { ProviderType } from '../../lib/account/types'
import { removeVaultAccount, removeKeyringAccount } from '../../lib/account/remove'
import { getProviderContext, getAccountOrFail } from './context'
import { confirmAccountRemoval } from './prompts'

export async function accountRemove(name: string, provider: ProviderType): Promise<void> {
  const providerLabel = provider === 'vault' ? 'Vault' : 'Keyring'

  let context
  try {
    context = await getProviderContext(provider)
  } catch (error) {
    p.log.error((error as Error).message)
    process.exit(1)
  }

  const account = await getAccountOrFail(context.provider, name)

  console.log()
  console.log(pc.bold('Remove Account'))
  console.log()
  console.log(`Account: ${account.name}`)
  console.log(`Address: ${account.address}`)
  console.log(`Provider: ${providerLabel}`)
  console.log()

  if (provider === 'vault') {
    p.log.warn(`This account is still controlled by ${providerLabel}.`)
    p.log.warn('The Vault key will also be deleted.')
  } else {
    p.log.warn('The key will be removed from your OS keyring.')
  }
  console.log()

  const confirmed = await confirmAccountRemoval()
  if (confirmed === null || !confirmed) {
    p.log.message(pc.dim('Cancelled.'))
    process.exit(0)
  }

  console.log()

  if (provider === 'vault') {
    p.log.step('Deleting Vault key...')
    const vaultClient = context.vaultClient!
    const result = await removeVaultAccount(name, vaultClient)
    if (result.success) {
      p.log.success('Vault key and metadata deleted')
    } else {
      p.log.warn(`Could not delete Vault key: ${result.error}`)
    }
  } else {
    p.log.step('Removing key from keyring...')
    const keyringProvider = context.provider as KeyringProvider
    const result = await removeKeyringAccount(name, keyringProvider)
    if (result.success) {
      p.log.success('Key removed from keyring')
    } else {
      p.log.warn(`Could not remove key: ${result.error}`)
    }
  }
}
