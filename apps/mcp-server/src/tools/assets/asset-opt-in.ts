/**
 * asset_opt_in tool
 *
 * Opts an account into receiving an Algorand Standard Asset (ASA).
 * Thin wrapper around sendTransactions() for asset opt-in.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { sendTransactions } from '../transactions/index.js'
import { validateRequiredId } from '../../lib/validators.js'

export const assetOptInTool: Tool = {
  name: 'asset_opt_in',
  description:
    'Opt an account into receiving an asset. ' +
    'Required before the account can receive transfers of that asset. ' +
    'Increases minimum balance by 0.1 ALGO.',
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID to opt into',
      },
      sender: {
        type: 'string',
        description: 'Account to opt in. Defaults to active account',
      },
    },
    required: ['assetId'],
  },
}

interface AssetOptInArgs {
  assetId: number
  sender?: string
}

export async function handleAssetOptIn(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound: number
  assetId: number
  account: string
  network: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<AssetOptInArgs>(args)
  const { assetId, sender } = typedArgs

  validateRequiredId(assetId, 'assetId')

  // Resolve sender for the response
  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  const result = await sendTransactions(
    {
      transactions: [
        {
          type: 'asset_opt_in',
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
    account: senderAddress,
    network: result.network,
  }
}
