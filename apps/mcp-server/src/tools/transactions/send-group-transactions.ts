/**
 * send_group_transactions tool
 *
 * Sends 1-16 transactions as an atomic group. Either all transactions
 * succeed, or they all fail together.
 *
 * Supported transaction types:
 * - payment: ALGO transfers
 * - asset_transfer: ASA transfers
 * - asset_opt_in: Opt into an ASA
 * - asset_opt_out: Opt out of an ASA
 * - asset_create: Create a new ASA
 * - asset_config: Reconfigure an ASA
 * - asset_freeze: Freeze/unfreeze an ASA holding
 * - asset_destroy: Destroy an ASA
 * - app_call: Call a smart contract method
 * - app_opt_in: Opt into a smart contract
 * - app_close_out: Close out of a smart contract
 * - app_delete: Delete a smart contract
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { transactionsSchema } from './schema.js'
import { sendTransactions } from './shared.js'
import type { TxnSpec } from './types.js'

export const sendGroupTransactionsTool: Tool = {
  name: 'send_group_transactions',
  description: `Send 1-16 transactions as an atomic group. All transactions succeed or all fail together.

Transaction types and their fields:
- payment: receiver, amount (optional: closeRemainderTo)
- asset_transfer: assetId, receiver, amount (optional: clawbackTarget, closeAssetTo)
- asset_opt_in: assetId
- asset_opt_out: assetId, closeAssetTo (optional: ensureZeroBalance)
- asset_create: total (optional: decimals, assetName, unitName, url, metadataHash, defaultFrozen, manager, reserve, freeze, clawback)
- asset_config: assetId (optional: manager, reserve, freeze, clawback)
- asset_freeze: assetId, freezeTarget, frozen
- asset_destroy: assetId
- app_call: appId + (methodSignature OR appSpec/appSpecPath + method) (optional: args, extraFee)
- app_opt_in: appId (optional: methodSignature or appSpec + method, args, extraFee)
- app_close_out: appId (optional: methodSignature or appSpec + method, args, extraFee)
- app_delete: appId (optional: methodSignature or appSpec + method, args, extraFee)

For methods with transaction args (pay, axfer, etc.), pass transaction objects in the args array:
- pay: {"type": "pay", "receiver": "...", "amount": 100000}
- axfer: {"type": "axfer", "assetId": 123, "receiver": "...", "amount": 1}
- acfg: {"type": "acfg", "assetId": 123, "manager": "..."} (or omit assetId for create)
- afrz: {"type": "afrz", "assetId": 123, "freezeTarget": "...", "frozen": true}

Example: optInToAsset(pay,uint64)void
args: [{"type": "pay", "receiver": "APPADDR", "amount": 100000}, 1659]

Inner transaction fees: If a contract sends inner transactions with fee=0 (fee pooling):
- If you know how many inner txns: use extraFee (e.g., 1000 per inner txn, so 2 inners = extraFee: 2000)
- If unsure: use coverAppCallInnerTransactionFees: true to auto-calculate (requires maxFee on each app_call as safety limit)

All transactions accept optional: sender (defaults to active account), note

Examples:

1. Simple atomic group (payment + asset transfer):
{"transactions": [
  {"type": "payment", "receiver": "ADDR...", "amount": 100000},
  {"type": "asset_transfer", "assetId": 123, "receiver": "ADDR...", "amount": 1}
]}

2. ABI method call with transaction argument:
{"transactions": [
  {"type": "app_call", "appId": 456, "methodSignature": "deposit(pay,uint64)void",
   "args": [{"type": "pay", "receiver": "APPADDR...", "amount": 100000}, 42]}
]}

3. Covering inner transaction fees:
{"transactions": [
  {"type": "app_call", "appId": 456, "methodSignature": "withdraw()void", "maxFee": 5000}
], "coverAppCallInnerTransactionFees": true}`,
  inputSchema: {
    type: 'object',
    properties: {
      transactions: transactionsSchema,
      populateAppCallResources: {
        type: 'boolean',
        description:
          'Auto-populate app call resources (accounts, apps, assets, boxes) via simulation. Defaults to true.',
        default: true,
      },
      coverAppCallInnerTransactionFees: {
        type: 'boolean',
        description:
          'Auto-calculate and cover fees for inner transactions via simulation. Defaults to false.',
        default: false,
      },
    },
    required: ['transactions'],
  },
}

interface SendGroupTransactionsArgs {
  transactions: TxnSpec[]
  populateAppCallResources?: boolean
  coverAppCallInnerTransactionFees?: boolean
}

export async function handleSendGroupTransactions(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  groupId: string
  txIds: string[]
  confirmedRound?: number
  returns?: unknown[]
  transactionCount: number
  network: string
}> {
  const { algorand, config } = ctx
  const { transactions, populateAppCallResources, coverAppCallInnerTransactionFees } =
    parseArgs<SendGroupTransactionsArgs>(args)

  const result = await sendTransactions(
    { transactions, populateAppCallResources, coverAppCallInnerTransactionFees },
    algorand,
    config,
    resolveSender
  )

  return {
    success: true,
    groupId: result.groupId,
    txIds: result.txIds,
    confirmedRound: result.confirmedRound,
    returns: result.returns,
    transactionCount: transactions.length,
    network: result.network,
  }
}
