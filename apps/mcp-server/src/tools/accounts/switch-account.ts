/**
 * switch_account tool
 *
 * Switches the active account for subsequent operations.
 * The active account will be used as the default sender for transactions.
 * Searches across all configured providers to find the account.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { AccountProviderType } from '@vibekit/provider-interface'
import { parseArgs, type ToolContext } from '../types.js'
import { switchAccount } from '../../lib/account-service.js'

export const switchAccountTool: Tool = {
  name: 'switch_account',
  description:
    'Switch the active account for subsequent operations. ' +
    'The active account will be used as the default sender for transactions. ' +
    'Searches all configured providers to find the account by name. ' +
    'Use "default" to switch back to the dispenser (localnet only).',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Account name to switch to. Use "default" for the dispenser (localnet only).',
      },
      provider: {
        type: 'string',
        enum: ['vault', 'keyring', 'walletconnect'],
        description:
          'Optional: Specify which provider the account belongs to. ' +
          'Required if accounts with the same name exist in multiple providers.',
      },
    },
    required: ['name'],
  },
}

interface SwitchAccountArgs {
  name: string
  provider?: AccountProviderType
}

export async function handleSwitchAccount(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  previousAccount: string | null
  currentAccount: string
  provider: AccountProviderType | null
  address: string
  balance: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<SwitchAccountArgs>(args)
  const { name, provider } = typedArgs

  const result = await switchAccount(algorand, name, provider)

  return {
    network: config.network,
    previousAccount: result.previousAccount,
    currentAccount: result.name,
    provider: result.provider,
    address: result.address,
    balance: result.balance.toString(),
  }
}
