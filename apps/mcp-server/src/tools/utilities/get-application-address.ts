/**
 * get_application_address tool
 *
 * Derives an application's address from its app ID.
 * This is a pure derivation that doesn't require network calls.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getApplicationAddress } from 'algosdk'
import type { ToolContext } from '../types.js'

export const getApplicationAddressTool: Tool = {
  name: 'get_application_address',
  description:
    'Derive an Algorand application address from its app ID. ' +
    'Application addresses are deterministic and can be derived without network calls. ' +
    'Useful for sending funds to an app or checking app balances.',
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'number',
        description: 'The application ID to derive the address for',
      },
    },
    required: ['appId'],
  },
}

export async function handleGetApplicationAddress(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{
  appId: number
  address: string
}> {
  const appId = args.appId as number

  if (!Number.isInteger(appId) || appId < 0) {
    throw new Error('appId must be a non-negative integer')
  }

  const address = getApplicationAddress(appId)

  return {
    appId,
    address: address.toString(),
  }
}
