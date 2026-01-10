/**
 * send_atomic_group tool
 *
 * Sends multiple transactions as an atomic group. Either all transactions
 * succeed, or they all fail. Supports up to 16 transactions per group.
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
import algosdk, { ABIMethod, OnApplicationComplete } from 'algosdk'
import { microAlgo } from '@algorandfoundation/algokit-utils'
import type { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { readFile } from 'node:fs/promises'

export const sendAtomicGroupTool: Tool = {
  name: 'send_atomic_group',
  description: `Send multiple transactions as an atomic group. All transactions succeed or all fail together. Maximum 16 transactions per group.

Transaction types and their fields:
- payment: receiver, amount
- asset_transfer: assetId, receiver, amount (optional: clawbackTarget)
- asset_opt_in: assetId
- asset_opt_out: assetId, closeAssetTo
- asset_create: total (optional: decimals, assetName, unitName, url, defaultFrozen, manager, reserve, freeze, clawback)
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
      transactions: {
        type: 'array',
        description: 'Array of transactions to execute atomically (max 16)',
        minItems: 1,
        maxItems: 16,
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
                'payment',
                'asset_transfer',
                'asset_opt_in',
                'asset_opt_out',
                'asset_create',
                'asset_config',
                'asset_freeze',
                'asset_destroy',
                'app_call',
                'app_opt_in',
                'app_close_out',
                'app_delete',
              ],
              description: 'Transaction type',
            },
            sender: {
              type: 'string',
              description:
                'Sender address. Must be an account managed by the configured provider. If omitted, uses the active account.',
            },
            // Payment fields
            receiver: {
              type: 'string',
              description: '(payment, asset_transfer) Receiver address',
            },
            amount: {
              type: 'number',
              description:
                '(payment) Amount in microAlgos. (asset_transfer, asset_create) Amount in base units.',
            },
            // Asset fields
            assetId: {
              type: 'number',
              description: '(asset_*) The asset ID',
            },
            // Asset create fields
            total: {
              type: 'number',
              description: '(asset_create) Total supply of the asset',
            },
            decimals: {
              type: 'number',
              description: '(asset_create) Number of decimals (0-19)',
            },
            assetName: {
              type: 'string',
              description: '(asset_create) Asset name',
            },
            unitName: {
              type: 'string',
              description: '(asset_create) Unit name',
            },
            url: {
              type: 'string',
              description: '(asset_create) Asset URL',
            },
            defaultFrozen: {
              type: 'boolean',
              description: '(asset_create) Whether holdings are frozen by default',
            },
            manager: {
              type: 'string',
              description: '(asset_create, asset_config) Manager address',
            },
            reserve: {
              type: 'string',
              description: '(asset_create, asset_config) Reserve address',
            },
            freeze: {
              type: 'string',
              description: '(asset_create, asset_config) Freeze address',
            },
            clawback: {
              type: 'string',
              description: '(asset_create, asset_config) Clawback address',
            },
            // Asset freeze fields
            freezeTarget: {
              type: 'string',
              description: '(asset_freeze) Account to freeze/unfreeze',
            },
            frozen: {
              type: 'boolean',
              description: '(asset_freeze) Whether to freeze (true) or unfreeze (false)',
            },
            // Asset transfer fields
            clawbackTarget: {
              type: 'string',
              description: '(asset_transfer) For clawback: the account to claw back from',
            },
            closeAssetTo: {
              type: 'string',
              description: '(asset_opt_out) Account to send remaining balance to',
            },
            // App call fields
            appId: {
              type: 'number',
              description: '(app_*) The application ID',
            },
            methodSignature: {
              type: 'string',
              description: '(app_call) ARC-4 method signature (e.g., "hello(string)string")',
            },
            appSpec: {
              type: 'string',
              description: '(app_call) Full ARC-56/32 app spec JSON as string',
            },
            appSpecPath: {
              type: 'string',
              description: '(app_call) Path to ARC-56/32 app spec JSON file',
            },
            method: {
              type: 'string',
              description: '(app_call) Method name when using appSpec/appSpecPath',
            },
            args: {
              type: 'array',
              description: '(app_call) Method arguments',
              items: {},
            },
            extraFee: {
              type: 'number',
              description:
                '(app_call) Extra fee in microALGO to cover inner transactions (e.g., 1000 per inner txn)',
            },
            maxFee: {
              type: 'number',
              description:
                '(app_call) Max fee in microALGO. Required when using coverAppCallInnerTransactionFees.',
            },
            // Common fields
            note: {
              type: 'string',
              description: 'Optional transaction note (max 1000 bytes)',
            },
          },
          required: ['type'],
        },
      },
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

// Transaction specification types
interface BaseTxnSpec {
  type: string
  sender?: string
  note?: string
}

interface PaymentTxnSpec extends BaseTxnSpec {
  type: 'payment'
  receiver: string
  amount: number
}

interface AssetTransferTxnSpec extends BaseTxnSpec {
  type: 'asset_transfer'
  assetId: number
  receiver: string
  amount: number
  clawbackTarget?: string
}

interface AssetOptInTxnSpec extends BaseTxnSpec {
  type: 'asset_opt_in'
  assetId: number
}

interface AssetOptOutTxnSpec extends BaseTxnSpec {
  type: 'asset_opt_out'
  assetId: number
  closeAssetTo: string
}

interface AssetCreateTxnSpec extends BaseTxnSpec {
  type: 'asset_create'
  total: number
  decimals?: number
  assetName?: string
  unitName?: string
  url?: string
  defaultFrozen?: boolean
  manager?: string
  reserve?: string
  freeze?: string
  clawback?: string
}

interface AssetConfigTxnSpec extends BaseTxnSpec {
  type: 'asset_config'
  assetId: number
  manager?: string
  reserve?: string
  freeze?: string
  clawback?: string
}

interface AssetFreezeTxnSpec extends BaseTxnSpec {
  type: 'asset_freeze'
  assetId: number
  freezeTarget: string
  frozen: boolean
}

interface AssetDestroyTxnSpec extends BaseTxnSpec {
  type: 'asset_destroy'
  assetId: number
}

interface AppCallTxnSpec extends BaseTxnSpec {
  type: 'app_call'
  appId: number
  methodSignature?: string
  appSpec?: string
  appSpecPath?: string
  method?: string
  args?: unknown[]
  extraFee?: number // Extra fee in microALGO to cover inner transactions
  maxFee?: number // Max fee in microALGO (required when using coverAppCallInnerTransactionFees)
}

interface AppOptInTxnSpec extends BaseTxnSpec {
  type: 'app_opt_in'
  appId: number
  methodSignature?: string
  appSpec?: string
  appSpecPath?: string
  method?: string
  args?: unknown[]
  extraFee?: number
  maxFee?: number
}

interface AppCloseOutTxnSpec extends BaseTxnSpec {
  type: 'app_close_out'
  appId: number
  methodSignature?: string
  appSpec?: string
  appSpecPath?: string
  method?: string
  args?: unknown[]
  extraFee?: number
  maxFee?: number
}

interface AppDeleteTxnSpec extends BaseTxnSpec {
  type: 'app_delete'
  appId: number
  methodSignature?: string
  appSpec?: string
  appSpecPath?: string
  method?: string
  args?: unknown[]
  extraFee?: number
  maxFee?: number
}

type TxnSpec =
  | PaymentTxnSpec
  | AssetTransferTxnSpec
  | AssetOptInTxnSpec
  | AssetOptOutTxnSpec
  | AssetCreateTxnSpec
  | AssetConfigTxnSpec
  | AssetFreezeTxnSpec
  | AssetDestroyTxnSpec
  | AppCallTxnSpec
  | AppOptInTxnSpec
  | AppCloseOutTxnSpec
  | AppDeleteTxnSpec

// Transaction argument types (for ABI method call args)
// These allow passing transaction objects directly in the args array for methods like optInToAsset(pay,uint64)void
interface PayTxnArg {
  type: 'pay'
  receiver: string
  amount: number
  sender?: string // defaults to app_call sender
  note?: string // unique note to avoid duplicate transaction IDs
}

interface AxferTxnArg {
  type: 'axfer'
  assetId: number
  receiver: string
  amount: number
  sender?: string
  note?: string
}

interface AcfgTxnArg {
  type: 'acfg'
  assetId?: number // undefined for create
  manager?: string
  reserve?: string
  freeze?: string
  clawback?: string
  // Create fields
  total?: number
  decimals?: number
  assetName?: string
  unitName?: string
  url?: string
  defaultFrozen?: boolean
  sender?: string
  note?: string
}

interface AfrzTxnArg {
  type: 'afrz'
  assetId: number
  freezeTarget: string
  frozen: boolean
  sender?: string
  note?: string
}

type TxnArg = PayTxnArg | AxferTxnArg | AcfgTxnArg | AfrzTxnArg

interface AtomicGroupArgs {
  transactions: TxnSpec[]
  populateAppCallResources?: boolean
  coverAppCallInnerTransactionFees?: boolean
}

/**
 * Resolve app spec from inline string or file path
 */
async function resolveAppSpec(appSpec?: string, appSpecPath?: string): Promise<string | undefined> {
  if (appSpecPath) {
    return readFile(appSpecPath, 'utf-8')
  }
  return appSpec
}

/**
 * Check if an argument is a transaction object (for ABI method call args)
 */
function isTransactionArg(arg: unknown): arg is TxnArg {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    'type' in arg &&
    ['pay', 'axfer', 'acfg', 'afrz'].includes((arg as TxnArg).type)
  )
}

/**
 * Build a transaction from a transaction argument object
 * Used for ABI method calls where a transaction is expected as an argument
 */
async function buildTransactionArg(
  algorand: AlgorandClient,
  arg: TxnArg,
  defaultSender: string
): Promise<algosdk.Transaction> {
  const sender = arg.sender || defaultSender
  const note = arg.note ? new TextEncoder().encode(arg.note) : undefined

  switch (arg.type) {
    case 'pay': {
      return algorand.createTransaction.payment({
        sender,
        receiver: arg.receiver,
        amount: microAlgo(BigInt(arg.amount)),
        note,
      })
    }
    case 'axfer': {
      return algorand.createTransaction.assetTransfer({
        sender,
        assetId: BigInt(arg.assetId),
        receiver: arg.receiver,
        amount: BigInt(arg.amount),
        note,
      })
    }
    case 'acfg': {
      if (arg.assetId) {
        // Asset config (reconfigure existing asset)
        return algorand.createTransaction.assetConfig({
          sender,
          assetId: BigInt(arg.assetId),
          manager: arg.manager,
          reserve: arg.reserve,
          freeze: arg.freeze,
          clawback: arg.clawback,
          note,
        })
      } else {
        // Asset create
        return algorand.createTransaction.assetCreate({
          sender,
          total: BigInt(arg.total ?? 0),
          decimals: arg.decimals ?? 0,
          assetName: arg.assetName,
          unitName: arg.unitName,
          url: arg.url,
          defaultFrozen: arg.defaultFrozen ?? false,
          manager: arg.manager,
          reserve: arg.reserve,
          freeze: arg.freeze,
          clawback: arg.clawback,
          note,
        })
      }
    }
    case 'afrz': {
      return algorand.createTransaction.assetFreeze({
        sender,
        assetId: BigInt(arg.assetId),
        account: arg.freezeTarget,
        frozen: arg.frozen,
        note,
      })
    }
    default: {
      const _exhaustive: never = arg
      throw new Error(`Unknown transaction arg type: ${(_exhaustive as TxnArg).type}`)
    }
  }
}

/**
 * Process method arguments, converting transaction objects to Transaction instances
 */
async function processMethodArgs(
  algorand: AlgorandClient,
  args: unknown[],
  defaultSender: string
): Promise<unknown[]> {
  const processedArgs: unknown[] = []
  for (const arg of args) {
    if (isTransactionArg(arg)) {
      const txn = await buildTransactionArg(algorand, arg, defaultSender)
      processedArgs.push(txn)
    } else {
      processedArgs.push(arg)
    }
  }
  return processedArgs
}

export async function handleSendAtomicGroup(
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
  const {
    transactions,
    populateAppCallResources = true,
    coverAppCallInnerTransactionFees = false,
  } = parseArgs<AtomicGroupArgs>(args)

  if (!transactions || transactions.length === 0) {
    throw new Error('At least one transaction is required')
  }

  if (transactions.length > 16) {
    throw new Error('Maximum 16 transactions per atomic group')
  }

  // Step 1: Register signers for all unique senders
  const uniqueSenders = new Set<string | undefined>()
  for (const txn of transactions) {
    uniqueSenders.add(txn.sender) // undefined means "use default"
  }

  const senderAddresses = new Map<string | undefined, string>()
  for (const sender of uniqueSenders) {
    const { address } = await resolveSender(algorand, config, sender)
    senderAddresses.set(sender, address)
  }

  // Helper to get resolved sender address
  const getSender = (sender?: string): string => {
    return senderAddresses.get(sender)!
  }

  // Step 2: Build the transaction group
  const composer = algorand.newGroup()
  const methodReturns: Array<{ index: number; hasReturn: boolean }> = []

  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i]
    const sender = getSender(txn.sender)
    const note = txn.note ? new TextEncoder().encode(txn.note) : undefined

    switch (txn.type) {
      case 'payment': {
        const spec = txn as PaymentTxnSpec
        if (!spec.receiver) throw new Error(`Transaction ${i}: receiver is required for payment`)
        if (spec.amount === undefined)
          throw new Error(`Transaction ${i}: amount is required for payment`)
        composer.addPayment({
          sender,
          receiver: spec.receiver,
          amount: microAlgo(BigInt(spec.amount)),
          note,
        })
        break
      }

      case 'asset_transfer': {
        const spec = txn as AssetTransferTxnSpec
        if (!spec.assetId)
          throw new Error(`Transaction ${i}: assetId is required for asset_transfer`)
        if (!spec.receiver)
          throw new Error(`Transaction ${i}: receiver is required for asset_transfer`)
        if (spec.amount === undefined)
          throw new Error(`Transaction ${i}: amount is required for asset_transfer`)
        composer.addAssetTransfer({
          sender,
          assetId: BigInt(spec.assetId),
          receiver: spec.receiver,
          amount: BigInt(spec.amount),
          clawbackTarget: spec.clawbackTarget,
          note,
        })
        break
      }

      case 'asset_opt_in': {
        const spec = txn as AssetOptInTxnSpec
        if (!spec.assetId) throw new Error(`Transaction ${i}: assetId is required for asset_opt_in`)
        composer.addAssetOptIn({
          sender,
          assetId: BigInt(spec.assetId),
          note,
        })
        break
      }

      case 'asset_opt_out': {
        const spec = txn as AssetOptOutTxnSpec
        if (!spec.assetId)
          throw new Error(`Transaction ${i}: assetId is required for asset_opt_out`)
        if (!spec.closeAssetTo)
          throw new Error(`Transaction ${i}: closeAssetTo is required for asset_opt_out`)
        composer.addAssetOptOut({
          sender,
          assetId: BigInt(spec.assetId),
          creator: spec.closeAssetTo,
          note,
        })
        break
      }

      case 'asset_create': {
        const spec = txn as AssetCreateTxnSpec
        if (spec.total === undefined)
          throw new Error(`Transaction ${i}: total is required for asset_create`)
        composer.addAssetCreate({
          sender,
          total: BigInt(spec.total),
          decimals: spec.decimals ?? 0,
          assetName: spec.assetName,
          unitName: spec.unitName,
          url: spec.url,
          defaultFrozen: spec.defaultFrozen ?? false,
          manager: spec.manager,
          reserve: spec.reserve,
          freeze: spec.freeze,
          clawback: spec.clawback,
          note,
        })
        break
      }

      case 'asset_config': {
        const spec = txn as AssetConfigTxnSpec
        if (!spec.assetId) throw new Error(`Transaction ${i}: assetId is required for asset_config`)
        composer.addAssetConfig({
          sender,
          assetId: BigInt(spec.assetId),
          manager: spec.manager,
          reserve: spec.reserve,
          freeze: spec.freeze,
          clawback: spec.clawback,
          note,
        })
        break
      }

      case 'asset_freeze': {
        const spec = txn as AssetFreezeTxnSpec
        if (!spec.assetId) throw new Error(`Transaction ${i}: assetId is required for asset_freeze`)
        if (!spec.freezeTarget)
          throw new Error(`Transaction ${i}: freezeTarget is required for asset_freeze`)
        if (spec.frozen === undefined)
          throw new Error(`Transaction ${i}: frozen is required for asset_freeze`)
        composer.addAssetFreeze({
          sender,
          assetId: BigInt(spec.assetId),
          account: spec.freezeTarget,
          frozen: spec.frozen,
          note,
        })
        break
      }

      case 'asset_destroy': {
        const spec = txn as AssetDestroyTxnSpec
        if (!spec.assetId)
          throw new Error(`Transaction ${i}: assetId is required for asset_destroy`)
        composer.addAssetDestroy({
          sender,
          assetId: BigInt(spec.assetId),
          note,
        })
        break
      }

      case 'app_call':
      case 'app_opt_in':
      case 'app_close_out':
      case 'app_delete': {
        const spec = txn as AppCallTxnSpec | AppOptInTxnSpec | AppCloseOutTxnSpec | AppDeleteTxnSpec
        if (!spec.appId) throw new Error(`Transaction ${i}: appId is required for ${txn.type}`)

        // Determine onComplete based on type
        let onComplete: OnApplicationComplete
        switch (txn.type) {
          case 'app_opt_in':
            onComplete = OnApplicationComplete.OptInOC
            break
          case 'app_close_out':
            onComplete = OnApplicationComplete.CloseOutOC
            break
          case 'app_delete':
            onComplete = OnApplicationComplete.DeleteApplicationOC
            break
          default:
            onComplete = OnApplicationComplete.NoOpOC
        }

        // Check if this is an ABI method call or bare call
        const resolvedAppSpec = await resolveAppSpec(spec.appSpec, spec.appSpecPath)
        const hasMethod = spec.methodSignature || (resolvedAppSpec && spec.method)

        if (hasMethod) {
          // Process args - convert transaction objects to Transaction instances
          const processedArgs = await processMethodArgs(algorand, spec.args ?? [], sender)

          // ABI method call
          const extraFee = spec.extraFee ? microAlgo(BigInt(spec.extraFee)) : undefined
          const maxFee = spec.maxFee ? microAlgo(BigInt(spec.maxFee)) : undefined
          if (spec.methodSignature) {
            // Use raw method signature
            const abiMethod = ABIMethod.fromSignature(spec.methodSignature)
            composer.addAppCallMethodCall({
              sender,
              appId: BigInt(spec.appId),
              method: abiMethod,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              args: processedArgs as any,
              onComplete,
              note,
              extraFee,
              maxFee,
            })
            methodReturns.push({ index: i, hasReturn: true })
          } else if (resolvedAppSpec && spec.method) {
            // Use app spec - parse to get method
            const appSpecJson = JSON.parse(resolvedAppSpec)
            // Find method in contract.methods (ARC-56) or methods (ARC-32)
            const methods = appSpecJson.contract?.methods || appSpecJson.methods || []
            const methodDef = methods.find((m: { name: string }) => m.name === spec.method)
            if (!methodDef) {
              throw new Error(`Transaction ${i}: method "${spec.method}" not found in app spec`)
            }
            // Build method signature from definition
            const argTypes = (methodDef.args || []).map((a: { type: string }) => a.type).join(',')
            const returnType = methodDef.returns?.type || 'void'
            const methodSig = `${spec.method}(${argTypes})${returnType}`
            const abiMethod = ABIMethod.fromSignature(methodSig)
            composer.addAppCallMethodCall({
              sender,
              appId: BigInt(spec.appId),
              method: abiMethod,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              args: processedArgs as any,
              onComplete,
              note,
              extraFee,
              maxFee,
            })
            methodReturns.push({ index: i, hasReturn: true })
          }
        } else {
          // Bare app call (no ABI method)
          const extraFee = spec.extraFee ? microAlgo(BigInt(spec.extraFee)) : undefined
          const maxFee = spec.maxFee ? microAlgo(BigInt(spec.maxFee)) : undefined
          composer.addAppCall({
            sender,
            appId: BigInt(spec.appId),
            onComplete,
            note,
            extraFee,
            maxFee,
          })
        }
        break
      }

      default:
        throw new Error(`Transaction ${i}: unknown type "${(txn as BaseTxnSpec).type}"`)
    }
  }

  // Step 3: Send the group
  const result = await composer.send({
    populateAppCallResources,
    coverAppCallInnerTransactionFees,
  })

  // Extract return values for ABI method calls
  const returns: unknown[] = []
  if (result.returns && result.returns.length > 0) {
    for (const ret of result.returns) {
      returns.push(ret.returnValue)
    }
  }

  return {
    success: true,
    groupId: result.groupId,
    txIds: result.txIds,
    confirmedRound: result.confirmations?.[0]?.confirmedRound
      ? Number(result.confirmations[0].confirmedRound)
      : undefined,
    returns: returns.length > 0 ? returns : undefined,
    transactionCount: transactions.length,
    network: config.network,
  }
}
