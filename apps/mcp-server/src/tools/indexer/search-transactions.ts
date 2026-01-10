/**
 * indexer_search_transactions tool
 *
 * Search for transactions with various filters.
 * Useful for debugging contract calls, finding transactions by app ID, asset ID, or address.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext } from '../types.js'
import { ON_COMPLETE_MAP, TX_TYPE_MAP } from './utils.js'

export const searchTransactionsTool: Tool = {
  name: 'indexer_search_transactions',
  description:
    'Search for transactions using various filters. Supports filtering by address, application ID, asset ID, transaction type, and time range. Returns paginated results.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Filter by account address (sender or receiver)',
      },
      addressRole: {
        type: 'string',
        enum: ['sender', 'receiver', 'freeze-target'],
        description: 'Role of the address in transactions',
      },
      applicationId: {
        type: 'number',
        description: 'Filter by application ID',
      },
      assetId: {
        type: 'number',
        description: 'Filter by asset ID',
      },
      txType: {
        type: 'string',
        enum: ['pay', 'keyreg', 'acfg', 'axfer', 'afrz', 'appl', 'stpf'],
        description: 'Filter by transaction type',
      },
      minRound: {
        type: 'number',
        description: 'Minimum round (block) number',
      },
      maxRound: {
        type: 'number',
        description: 'Maximum round (block) number',
      },
      afterTime: {
        type: 'string',
        description: 'Filter transactions after this time (ISO 8601 format)',
      },
      beforeTime: {
        type: 'string',
        description: 'Filter transactions before this time (ISO 8601 format)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default 10, max 100)',
      },
      nextToken: {
        type: 'string',
        description: 'Pagination token from previous response',
      },
    },
  },
}

interface SearchTransactionsArgs {
  address?: string
  addressRole?: 'sender' | 'receiver' | 'freeze-target'
  applicationId?: number
  assetId?: number
  txType?: 'pay' | 'keyreg' | 'acfg' | 'axfer' | 'afrz' | 'appl' | 'stpf'
  minRound?: number
  maxRound?: number
  afterTime?: string
  beforeTime?: string
  limit?: number
  nextToken?: string
}

interface TransactionSummary {
  id: string
  type: string
  sender: string
  fee: number
  confirmedRound: number
  roundTime?: number
  // Type-specific summary fields
  receiver?: string
  amount?: number
  applicationId?: number
  onComplete?: string
  assetId?: number
  hasInnerTransactions?: boolean
  innerTransactionCount?: number
}

function summarizeTransaction(txn: Record<string, unknown>): TransactionSummary {
  const summary: TransactionSummary = {
    id: txn.id as string,
    type: TX_TYPE_MAP[txn['tx-type'] as string] || (txn['tx-type'] as string),
    sender: txn.sender as string,
    fee: txn.fee as number,
    confirmedRound: txn['confirmed-round'] as number,
  }

  if (txn['round-time']) {
    summary.roundTime = txn['round-time'] as number
  }

  const paymentTxn = txn['payment-transaction'] as Record<string, unknown> | undefined
  if (paymentTxn) {
    summary.receiver = paymentTxn.receiver as string
    summary.amount = paymentTxn.amount as number
  }

  const assetTransferTxn = txn['asset-transfer-transaction'] as Record<string, unknown> | undefined
  if (assetTransferTxn) {
    summary.assetId = assetTransferTxn['asset-id'] as number
    summary.receiver = assetTransferTxn.receiver as string
    summary.amount = assetTransferTxn.amount as number
  }

  const appTxn = txn['application-transaction'] as Record<string, unknown> | undefined
  if (appTxn) {
    summary.applicationId =
      (appTxn['application-id'] as number) || (txn['created-application-index'] as number)
    summary.onComplete = ON_COMPLETE_MAP[appTxn['on-completion'] as number] || 'Unknown'
  }

  const assetConfigTxn = txn['asset-config-transaction'] as Record<string, unknown> | undefined
  if (assetConfigTxn) {
    summary.assetId =
      (assetConfigTxn['asset-id'] as number) || (txn['created-asset-index'] as number)
  }

  const innerTxns = txn['inner-txns'] as Record<string, unknown>[] | undefined
  if (innerTxns && innerTxns.length > 0) {
    summary.hasInnerTransactions = true
    summary.innerTransactionCount = innerTxns.length
  }

  return summary
}

export async function handleSearchTransactions(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  transactions: TransactionSummary[]
  nextToken?: string
  totalResults?: number
}> {
  const { algorand, config } = ctx
  const typedArgs = args as SearchTransactionsArgs
  const limit = Math.min(Math.max(typedArgs.limit || 10, 1), 100)

  // Build the search query
  let search = algorand.client.indexer.searchForTransactions().limit(limit)

  if (typedArgs.address) {
    search = search.address(typedArgs.address)
    if (typedArgs.addressRole) {
      search = search.addressRole(typedArgs.addressRole)
    }
  }

  if (typedArgs.applicationId) {
    search = search.applicationID(typedArgs.applicationId)
  }

  if (typedArgs.assetId) {
    search = search.assetID(typedArgs.assetId)
  }

  if (typedArgs.txType) {
    search = search.txType(typedArgs.txType)
  }

  if (typedArgs.minRound) {
    search = search.minRound(typedArgs.minRound)
  }

  if (typedArgs.maxRound) {
    search = search.maxRound(typedArgs.maxRound)
  }

  if (typedArgs.afterTime) {
    search = search.afterTime(typedArgs.afterTime)
  }

  if (typedArgs.beforeTime) {
    search = search.beforeTime(typedArgs.beforeTime)
  }

  if (typedArgs.nextToken) {
    search = search.nextToken(typedArgs.nextToken)
  }

  const result = await search.do()

  const transactions = (result.transactions || []).map((txn) =>
    summarizeTransaction(txn as unknown as Record<string, unknown>)
  )

  const response: {
    network: string
    transactions: TransactionSummary[]
    nextToken?: string
    totalResults?: number
  } = {
    network: config.network,
    transactions,
  }

  if (result.nextToken) {
    response.nextToken = result.nextToken
  }

  return response
}
