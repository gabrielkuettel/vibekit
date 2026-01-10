/**
 * get_active_account tool
 *
 * Gets the currently active account.
 * This account is used as the default sender for transactions when no sender is specified.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext } from '../types.js'
import { getActiveAccountDetails } from '../../lib/account-service.js'

export const getActiveAccountTool: Tool = {
  name: 'get_active_account',
  description:
    'Get the currently active account. ' +
    'This account is used as the default sender for transactions when no sender is specified.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
}

export async function handleGetActiveAccount(
  _args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  account: string | null
  address: string
  balance: string
  isDefault: boolean
}> {
  const { algorand, config } = ctx
  const result = await getActiveAccountDetails(algorand)

  return {
    network: config.network,
    account: result.name,
    address: result.address,
    balance: result.balance.toString(),
    isDefault: result.isDefault,
  }
}
