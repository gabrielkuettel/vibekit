/**
 * create_account tool
 *
 * Creates a named account in Vault or Keyring.
 * If the account already exists, returns the existing account.
 * Does NOT fund the account - use fund_account for that.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { AccountProviderType } from '@vibekit/provider-interface'
import { parseArgs, type ToolContext } from '../types.js'
import { createAccount } from '../../lib/account-service.js'

export const createAccountTool: Tool = {
  name: 'create_account',
  description:
    'Create a named account in a provider (vault or keyring). ' +
    'If the account already exists, returns the existing account. ' +
    'The account starts with 0 balance - use fund_account to add funds.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'Account name (e.g., "DEPLOYER", "USER1"). Convention: uppercase for environment-style names.',
      },
      provider: {
        type: 'string',
        enum: ['vault', 'keyring'],
        description:
          'Which provider to create the account in. ' +
          'Required if multiple providers are configured.',
      },
      switchTo: {
        type: 'boolean',
        description: 'Whether to switch to this account after creation (default: true).',
      },
    },
    required: ['name'],
  },
}

interface CreateAccountArgs {
  name: string
  provider?: AccountProviderType
  switchTo?: boolean
}

export async function handleCreateAccount(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  account: string
  address: string
  provider: AccountProviderType
  isNew: boolean
  isActive: boolean
  hint: string
}> {
  const { config } = ctx
  const typedArgs = parseArgs<CreateAccountArgs>(args)
  const { name, provider, switchTo = true } = typedArgs

  const result = await createAccount(name, provider, switchTo)

  return {
    network: config.network,
    account: result.name,
    address: result.address,
    provider: result.provider,
    isNew: result.isNew,
    isActive: switchTo,
    hint: result.isNew ? 'Use fund_account to add funds to this new account.' : '',
  }
}
