/**
 * indexer_lookup_transaction tool
 *
 * Look up a specific transaction by ID using the indexer.
 * Useful for verifying transaction results after deployments, payments, or asset transfers.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { hashProgram } from './utils.js'
import { decodeBase64 } from '../../lib/encoding.js'

export const lookupTransactionTool: Tool = {
  name: 'indexer_lookup_transaction',
  description:
    'Look up a transaction by ID using indexer. Returns full transaction details including inner transactions.',
  inputSchema: {
    type: 'object',
    properties: {
      transactionId: {
        type: 'string',
        description: 'The transaction ID to look up',
      },
    },
    required: ['transactionId'],
  },
}

interface LookupTransactionArgs {
  transactionId: string
}

interface FormattedTransaction {
  id: string
  type: string
  sender: string
  fee: number
  confirmedRound?: number
  roundTime?: number
  note?: string
  group?: string
  payment?: {
    receiver: string
    amount: number
    closeAmount?: number
  }
  assetTransfer?: {
    assetId: number
    receiver: string
    amount: number
    closeAmount?: number
  }
  applicationCall?: {
    applicationId: number
    onComplete: string
    applicationArgs?: string[]
    accounts?: string[]
    foreignApps?: number[]
    foreignAssets?: number[]
    approvalProgramHash?: string
    clearStateProgramHash?: string
    logs?: string[]
  }
  assetConfig?: {
    assetId: number
    params?: Record<string, unknown>
  }
  innerTransactions?: FormattedTransaction[]
}

const ON_COMPLETE_MAP: Record<number, string> = {
  0: 'NoOp',
  1: 'OptIn',
  2: 'CloseOut',
  3: 'ClearState',
  4: 'UpdateApplication',
  5: 'DeleteApplication',
}

function formatTransaction(txn: Record<string, unknown>, depth = 0): FormattedTransaction {
  const result: FormattedTransaction = {
    id: txn.id as string,
    type: txn.txType as string,
    sender: txn.sender as string,
    fee: txn.fee as number,
  }

  if (txn.confirmedRound) {
    result.confirmedRound = txn.confirmedRound as number
  }
  if (txn.roundTime) {
    result.roundTime = txn.roundTime as number
  }
  if (txn.note) {
    result.note = decodeBase64(txn.note as string)
  }
  if (txn.group) {
    result.group = txn.group as string
  }

  const paymentTxn = txn.paymentTransaction as Record<string, unknown> | undefined
  if (paymentTxn) {
    result.payment = {
      receiver: paymentTxn.receiver as string,
      amount: paymentTxn.amount as number,
    }
    if (paymentTxn.closeAmount) {
      result.payment.closeAmount = paymentTxn.closeAmount as number
    }
  }

  const assetTransferTxn = txn.assetTransferTransaction as Record<string, unknown> | undefined
  if (assetTransferTxn) {
    result.assetTransfer = {
      assetId: assetTransferTxn.assetId as number,
      receiver: assetTransferTxn.receiver as string,
      amount: assetTransferTxn.amount as number,
    }
    if (assetTransferTxn.closeAmount) {
      result.assetTransfer.closeAmount = assetTransferTxn.closeAmount as number
    }
  }

  const appTxn = txn.applicationTransaction as Record<string, unknown> | undefined
  if (appTxn) {
    result.applicationCall = {
      applicationId: appTxn.applicationId as number,
      onComplete: ON_COMPLETE_MAP[appTxn.onCompletion as number] || 'Unknown',
    }

    const appArgs = appTxn.applicationArgs as string[] | undefined
    if (appArgs && appArgs.length > 0) {
      result.applicationCall.applicationArgs = appArgs.map((arg) => decodeBase64(arg))
    }

    if (appTxn.accounts) {
      result.applicationCall.accounts = appTxn.accounts as string[]
    }
    if (appTxn.foreignApps) {
      result.applicationCall.foreignApps = appTxn.foreignApps as number[]
    }
    if (appTxn.foreignAssets) {
      result.applicationCall.foreignAssets = appTxn.foreignAssets as number[]
    }
    if (appTxn.approvalProgram) {
      result.applicationCall.approvalProgramHash = hashProgram(
        appTxn.approvalProgram as string | Uint8Array
      )
    }
    if (appTxn.clearStateProgram) {
      result.applicationCall.clearStateProgramHash = hashProgram(
        appTxn.clearStateProgram as string | Uint8Array
      )
    }

    // Include logs from the transaction result
    const logs = txn.logs as string[] | undefined
    if (logs && logs.length > 0) {
      result.applicationCall.logs = logs.map((log) => decodeBase64(log))
    }
  }

  const assetConfigTxn = txn.assetConfigTransaction as Record<string, unknown> | undefined
  if (assetConfigTxn) {
    result.assetConfig = {
      assetId: (assetConfigTxn.assetId as number) || (txn.createdAssetIndex as number),
    }
    if (assetConfigTxn.params) {
      result.assetConfig.params = assetConfigTxn.params as Record<string, unknown>
    }
  }

  // Inner transactions (limit depth to prevent huge responses)
  const innerTxns = txn.innerTxns as Record<string, unknown>[] | undefined
  if (innerTxns && innerTxns.length > 0 && depth < 2) {
    result.innerTransactions = innerTxns.map((inner) => formatTransaction(inner, depth + 1))
  }

  return result
}

export async function handleLookupTransaction(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  transaction: FormattedTransaction
}> {
  const { algorand, config } = ctx
  const { transactionId } = parseArgs<LookupTransactionArgs>(args)

  const result = await algorand.client.indexer.lookupTransactionByID(transactionId).do()

  return {
    network: config.network,
    transaction: formatTransaction(result.transaction as unknown as Record<string, unknown>),
  }
}
