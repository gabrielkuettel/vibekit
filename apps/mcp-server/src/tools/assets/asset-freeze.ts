/**
 * asset_freeze tool
 *
 * Freezes or unfreezes an account's holdings of an Algorand Standard Asset (ASA).
 * Only the asset's freeze address can execute this operation.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import {
  validateRequiredId,
  validateRequiredAddress,
  validateRequiredBoolean,
} from '../../lib/validators.js'

export const assetFreezeTool: Tool = {
  name: 'asset_freeze',
  description:
    "Freeze or unfreeze an account's asset holdings. " +
    'Frozen accounts cannot send or receive the asset. ' +
    "Sender must be the asset's freeze address.",
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID',
      },
      account: {
        type: 'string',
        description: 'The account to freeze/unfreeze',
      },
      frozen: {
        type: 'boolean',
        description: 'True to freeze, false to unfreeze',
      },
      sender: {
        type: 'string',
        description: 'Must be the asset freeze address. Defaults to active account',
      },
    },
    required: ['assetId', 'account', 'frozen'],
  },
}

interface AssetFreezeArgs {
  assetId: number
  account: string
  frozen: boolean
  sender?: string
}

export async function handleAssetFreeze(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound: number
  assetId: number
  account: string
  frozen: boolean
  network: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<AssetFreezeArgs>(args)
  const { assetId, account, frozen, sender } = typedArgs

  validateRequiredId(assetId, 'assetId')
  validateRequiredAddress(account, 'account')
  validateRequiredBoolean(frozen, 'frozen')

  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  const result = await algorand.send.assetFreeze({
    sender: senderAddress,
    assetId: BigInt(assetId),
    account,
    frozen,
  })

  return {
    success: true,
    txId: result.txIds[0],
    confirmedRound: Number(result.confirmation?.confirmedRound ?? 0),
    assetId,
    account,
    frozen,
    network: config.network,
  }
}
