/**
 * Indexer Tools
 *
 * Tools for querying historical blockchain data via the Algorand Indexer.
 * Focused on development workflows: transaction verification, contract debugging, and asset queries.
 */

import type { ToolRegistration } from '../types.js'

import { lookupTransactionTool, handleLookupTransaction } from './lookup-transaction.js'
import { searchTransactionsTool, handleSearchTransactions } from './search-transactions.js'
import { lookupApplicationTool, handleLookupApplication } from './lookup-application.js'
import {
  lookupApplicationLogsTool,
  handleLookupApplicationLogs,
} from './lookup-application-logs.js'
import { lookupAssetTool, handleLookupAsset } from './lookup-asset.js'

export const indexerTools: ToolRegistration[] = [
  { definition: lookupTransactionTool, handler: handleLookupTransaction },
  { definition: searchTransactionsTool, handler: handleSearchTransactions },
  { definition: lookupApplicationTool, handler: handleLookupApplication },
  { definition: lookupApplicationLogsTool, handler: handleLookupApplicationLogs },
  { definition: lookupAssetTool, handler: handleLookupAsset },
]
