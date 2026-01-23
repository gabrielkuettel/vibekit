/**
 * asset_transfer tool
 *
 * Transfers Algorand Standard Assets (ASA) between accounts.
 * Thin wrapper around sendTransactions() for asset transfers.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { sendTransactions } from '../transactions/index.js'
import {
  validateRequiredId,
  validateRequiredAmount,
  validateRequiredAddress,
  validateOptionalAddress,
  validateNote,
} from '../../lib/validators.js'

export const assetTransferTool: Tool = {
  name: 'asset_transfer',
  description:
    'Transfer assets between accounts. ' +
    'Receiver must have opted into the asset first. ' +
    'For clawback, set clawbackTarget to revoke from that account (sender must be clawback address).',
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID to transfer',
      },
      amount: {
        type: 'number',
        description: 'Amount to transfer in smallest divisible units',
      },
      receiver: {
        type: 'string',
        description: 'Receiver address (must have opted into the asset)',
      },
      sender: {
        type: 'string',
        description: 'Sender address. Defaults to active account',
      },
      clawbackTarget: {
        type: 'string',
        description:
          'For clawback: the account to revoke assets from. Sender must be the asset clawback address',
      },
      closeAssetTo: {
        type: 'string',
        description:
          'Close asset position to this address. Transfers remaining balance and removes asset from account',
      },
      note: {
        type: 'string',
        description: 'Optional transaction note (max 1000 bytes)',
      },
    },
    required: ['assetId', 'amount', 'receiver'],
  },
}

interface AssetTransferArgs {
  assetId: number
  amount: number
  receiver: string
  sender?: string
  clawbackTarget?: string
  closeAssetTo?: string
  note?: string
}

export async function handleAssetTransfer(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound: number
  from: string
  to: string
  amount: string
  assetId: number
  clawbackTarget?: string
  closeAssetTo?: string
  network: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<AssetTransferArgs>(args)
  const { assetId, amount, receiver, sender, clawbackTarget, closeAssetTo, note } = typedArgs

  validateRequiredId(assetId, 'assetId')
  validateRequiredAmount(amount)
  validateRequiredAddress(receiver, 'receiver')
  validateOptionalAddress(clawbackTarget, 'clawbackTarget')
  validateOptionalAddress(closeAssetTo, 'closeAssetTo')
  if (note) validateNote(note)

  // Resolve sender for the response
  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  const result = await sendTransactions(
    {
      transactions: [
        {
          type: 'asset_transfer',
          assetId,
          receiver,
          amount,
          sender,
          clawbackTarget,
          closeAssetTo,
          note,
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
    from: clawbackTarget || senderAddress,
    to: receiver,
    amount: amount.toString(),
    assetId,
    clawbackTarget,
    closeAssetTo,
    network: result.network,
  }
}
