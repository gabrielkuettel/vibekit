/**
 * get_account_info tool
 *
 * Gets detailed information about an account.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { getAccountInfo as getAccountInfoImpl } from '../../lib/account-service.js'

export const getAccountInfoTool: Tool = {
  name: 'get_account_info',
  description: 'Get information about an account including balance, assets, and opted-in apps.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The account address',
      },
    },
    required: ['address'],
  },
}

interface GetAccountInfoArgs {
  address: string
}

export async function handleGetAccountInfo(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  address: string
  balance: string
  minBalance: string
  assets: Array<{ assetId: string; amount: string }>
  appsLocalState: Array<{ appId: string }>
  createdApps: Array<{ appId: string }>
}> {
  const { algorand } = ctx
  const typedArgs = parseArgs<GetAccountInfoArgs>(args)
  const { address } = typedArgs

  const info = await getAccountInfoImpl(algorand, address)

  return {
    address: info.address,
    balance: info.balance.toString(),
    minBalance: info.minBalance.toString(),
    assets: info.assets.map((a) => ({
      assetId: a.assetId.toString(),
      amount: a.amount.toString(),
    })),
    appsLocalState: info.appsLocalState.map((a) => ({
      appId: a.appId.toString(),
    })),
    createdApps: info.createdApps.map((a) => ({
      appId: a.appId.toString(),
    })),
  }
}
