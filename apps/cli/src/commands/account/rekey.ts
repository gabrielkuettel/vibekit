/**
 * Account rekey command - transfer signing authority to another address
 */

import pc from 'picocolors'
import * as p from '@clack/prompts'
import { VaultProvider } from '@vibekit/provider-vault'
import { withSpinner } from '../../utils/spinner'
import type { Network, ProviderType } from '../../lib/account/types'
import {
  checkRekeyStatus,
  buildRekeyTransaction,
  submitRekeyTransaction,
} from '../../lib/account/rekey'
import { getProviderContext, getAccountOrFail } from './context'
import { promptForRekeyAddress, confirmRekeyOperation } from './prompts'

export async function accountRekeyToSelf(
  name: string,
  network: Network,
  provider: ProviderType
): Promise<void> {
  // Rekey-to-self is only supported for Vault accounts
  if (provider !== 'vault') {
    p.log.error('Rekey-to-self is only supported for Vault accounts.')
    p.log.message(pc.dim('Keyring accounts already give you access to the mnemonic phrase.'))
    p.log.message(pc.dim('You can import the mnemonic directly into your wallet.'))
    process.exit(1)
  }

  let context
  try {
    context = await getProviderContext('vault')
  } catch (error) {
    p.log.error((error as Error).message)
    process.exit(1)
  }

  const vaultProvider = context.provider as VaultProvider
  const vaultClient = context.vaultClient!
  const account = await getAccountOrFail(vaultProvider, name)

  // Check on-chain if already rekeyed
  const rekeyStatus = await checkRekeyStatus(account.address, network)
  if (rekeyStatus.isRekeyed) {
    p.log.warn(`Account "${name}" is already rekeyed to ${rekeyStatus.authAddress}`)
    process.exit(0)
  }
  if (rekeyStatus.cannotCheckOnChain) {
    p.log.message(pc.dim('Note: Could not check on-chain status. Proceeding...'))
  }

  console.log()
  const newAuthAddress = await promptForRekeyAddress()
  if (newAuthAddress === null) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  // Show big warning with exactly what will happen
  console.log()
  console.log(pc.bgRed(pc.white(pc.bold(' WARNING: IRREVERSIBLE OPERATION '))))
  console.log()
  console.log(pc.bold('This will permanently transfer signing authority:'))
  console.log()
  console.log(`  ${pc.bold('Account name:')}  ${name}`)
  console.log(`  ${pc.bold('Account addr:')}  ${account.address}`)
  console.log(`  ${pc.bold('Network:')}       ${network}`)
  console.log()
  console.log(`  ${pc.bold('FROM:')} ${pc.red('Vault')} (AI agents can sign)`)
  console.log(`  ${pc.bold('TO:')}   ${pc.green(newAuthAddress as string)}`)
  console.log()
  console.log(pc.yellow('What happens:'))
  console.log(pc.yellow('  1. A rekey transaction is submitted to the Algorand network'))
  console.log(pc.yellow('  2. The account address stays the same'))
  console.log(pc.yellow('  3. All funds remain in the account'))
  console.log(pc.yellow('  4. Only the NEW address can authorize transactions'))
  console.log()
  console.log(pc.red('After this:'))
  console.log(pc.red('  - AI agents can NO LONGER sign for this account'))
  console.log(pc.red('  - The Vault key becomes useless for this account'))
  console.log(pc.red('  - You MUST have access to the new address to move funds'))
  console.log()

  const confirmed = await confirmRekeyOperation()
  if (confirmed === null || !confirmed) {
    p.cancel('Cancelled.')
    process.exit(0)
  }

  const signedTxn = await withSpinner(
    {
      start: 'Building and signing rekey transaction...',
      success: 'Transaction signed',
      fail: 'Failed to sign transaction',
    },
    async () => {
      return buildRekeyTransaction({
        account,
        newAuthAddress: newAuthAddress as string,
        network,
        vaultClient,
      })
    }
  )

  const txid = await withSpinner(
    {
      start: 'Submitting to network...',
      success: 'Transaction confirmed',
      fail: 'Transaction failed',
    },
    async () => {
      return submitRekeyTransaction(signedTxn, network)
    }
  )

  console.log()
  console.log(pc.green('✓') + ` Rekey complete`)
  console.log()
  console.log(`  ${pc.bold('Transaction:')} ${txid}`)
  console.log(`  ${pc.bold('Account:')}     ${name} (${account.address.slice(0, 8)}...)`)
  console.log(`  ${pc.bold('Now controlled by:')} ${newAuthAddress}`)
  console.log()
}
