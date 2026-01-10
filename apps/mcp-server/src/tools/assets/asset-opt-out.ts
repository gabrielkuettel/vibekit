/**
 * asset_opt_out tool
 *
 * Opts an account out of an Algorand Standard Asset (ASA).
 * Closes the asset position and returns any remaining balance to a specified address.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { validateRequiredId, validateRequiredAddress } from '../../lib/validators.js'

export const assetOptOutTool: Tool = {
  name: 'asset_opt_out',
  description:
    'Opt out of an asset and close the position. ' +
    'Any remaining balance is sent to the creator (or specified address). ' +
    'Reduces minimum balance by 0.1 ALGO. Use ensureZeroBalance=true to fail if balance > 0.',
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID to opt out of',
      },
      creator: {
        type: 'string',
        description: 'Address to return remaining assets to (typically the asset creator)',
      },
      sender: {
        type: 'string',
        description: 'Account to opt out. Defaults to active account',
      },
      ensureZeroBalance: {
        type: 'boolean',
        description: 'If true, fail if account has non-zero balance. Default: true',
      },
    },
    required: ['assetId', 'creator'],
  },
}

interface AssetOptOutArgs {
  assetId: number
  creator: string
  sender?: string
  ensureZeroBalance?: boolean
}

export async function handleAssetOptOut(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound: number
  assetId: number
  account: string
  closedTo: string
  network: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<AssetOptOutArgs>(args)
  const { assetId, creator, sender, ensureZeroBalance = true } = typedArgs

  validateRequiredId(assetId, 'assetId')
  validateRequiredAddress(creator, 'creator')

  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  const result = await algorand.send.assetOptOut({
    sender: senderAddress,
    assetId: BigInt(assetId),
    creator,
    ensureZeroBalance,
  })

  return {
    success: true,
    txId: result.txIds[0],
    confirmedRound: Number(result.confirmation?.confirmedRound ?? 0),
    assetId,
    account: senderAddress,
    closedTo: creator,
    network: config.network,
  }
}
