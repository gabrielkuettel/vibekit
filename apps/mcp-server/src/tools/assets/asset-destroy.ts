/**
 * asset_destroy tool
 *
 * Destroys an Algorand Standard Asset (ASA).
 * Thin wrapper around sendTransactions() for asset destruction.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { sendTransactions } from '../transactions/index.js'
import { validateRequiredId } from '../../lib/validators.js'

export const assetDestroyTool: Tool = {
  name: 'asset_destroy',
  description:
    'Destroy an asset permanently. ' +
    'Sender must be the manager, and the creator must hold all units. ' +
    'This action is irreversible.',
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID to destroy',
      },
      sender: {
        type: 'string',
        description: 'Must be the asset manager. Defaults to active account',
      },
    },
    required: ['assetId'],
  },
}

interface AssetDestroyArgs {
  assetId: number
  sender?: string
}

export async function handleAssetDestroy(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound: number
  assetId: number
  network: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<AssetDestroyArgs>(args)
  const { assetId, sender } = typedArgs

  validateRequiredId(assetId, 'assetId')

  const result = await sendTransactions(
    {
      transactions: [
        {
          type: 'asset_destroy',
          assetId,
          sender,
        },
      ],
    },
    algorand,
    config,
    resolveSender
  )

  return {
    success: true,
    txId: result.txIds[0],
    confirmedRound: result.confirmedRound ?? 0,
    assetId,
    network: result.network,
  }
}
