/**
 * asset_opt_out tool
 *
 * Opts an account out of an Algorand Standard Asset (ASA).
 * Thin wrapper around sendTransactions() for asset opt-out.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { sendTransactions } from '../transactions/index.js'
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

  // Resolve sender for the response and balance check
  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  // Check balance if ensureZeroBalance is true
  if (ensureZeroBalance) {
    const accountInfo = await algorand.account.getInformation(senderAddress)
    const assetHolding = accountInfo.assets?.find((a) => Number(a.assetId) === assetId)
    if (assetHolding && assetHolding.amount > 0) {
      throw new Error(
        `Account has non-zero balance (${assetHolding.amount}) of asset ${assetId}. ` +
          'Set ensureZeroBalance=false to opt out anyway and send balance to creator.'
      )
    }
  }

  const result = await sendTransactions(
    {
      transactions: [
        {
          type: 'asset_opt_out',
          assetId,
          closeAssetTo: creator,
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
    closedTo: creator,
    network: result.network,
  }
}
