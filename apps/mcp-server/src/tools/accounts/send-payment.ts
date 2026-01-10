/**
 * send_payment tool
 *
 * Sends a payment transaction (ALGO transfer) between accounts.
 * Uses the wallet provider for signing (KMD on localnet, Vault on testnet/mainnet).
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { microAlgo } from '@algorandfoundation/algokit-utils'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import {
  validateRequiredAddress,
  validateRequiredAmount,
  validateOptionalAddress,
  validateNote,
} from '../../lib/validators.js'

export const sendPaymentTool: Tool = {
  name: 'send_payment',
  description:
    'Send a payment transaction (ALGO transfer). ' +
    'Signs using the active account - use switch_account first to select the sender. ' +
    'Amount is in microALGO (1 ALGO = 1,000,000 microALGO).',
  inputSchema: {
    type: 'object',
    properties: {
      receiver: {
        type: 'string',
        description: 'The receiver address',
      },
      amount: {
        type: 'number',
        description: 'Amount to send in microALGO (1 ALGO = 1,000,000 microALGO)',
      },
      sender: {
        type: 'string',
        description:
          'Sender address. Defaults to active account. ' +
          'If specifying a different address, switch_account to that account first.',
      },
      note: {
        type: 'string',
        description: 'Optional note to include with the transaction (max 1000 bytes)',
      },
      closeRemainderTo: {
        type: 'string',
        description:
          'Optional address to receive remaining balance. Use this to close an account. ' +
          'Warning: This will transfer ALL remaining ALGO and remove the account from the ledger.',
      },
    },
    required: ['receiver', 'amount'],
  },
}

interface SendPaymentArgs {
  receiver: string
  amount: number
  sender?: string
  note?: string
  closeRemainderTo?: string
}

export async function handleSendPayment(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  network: string
  txId: string
  from: string
  to: string
  amount: string
  closeRemainderTo?: string
  confirmedRound?: number
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<SendPaymentArgs>(args)
  const { receiver, amount, sender, note, closeRemainderTo } = typedArgs

  validateRequiredAddress(receiver, 'receiver')
  validateRequiredAmount(amount)
  validateOptionalAddress(closeRemainderTo, 'closeRemainderTo')

  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  const paymentOptions: Parameters<typeof algorand.send.payment>[0] = {
    sender: senderAddress,
    receiver,
    amount: microAlgo(BigInt(amount)),
  }

  if (note) {
    validateNote(note)
    paymentOptions.note = new TextEncoder().encode(note)
  }

  if (closeRemainderTo) {
    paymentOptions.closeRemainderTo = closeRemainderTo
  }

  const result = await algorand.send.payment(paymentOptions)

  return {
    success: true,
    network: config.network,
    txId: result.txIds[0],
    from: senderAddress,
    to: receiver,
    amount: amount.toString(),
    closeRemainderTo,
    confirmedRound: result.confirmation?.confirmedRound
      ? Number(result.confirmation.confirmedRound)
      : undefined,
  }
}
