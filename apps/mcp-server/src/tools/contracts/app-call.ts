/**
 * app_call tool
 *
 * Calls an ABI method on a deployed smart contract.
 * Supports three modes:
 * 1. appSpec - Full ARC-56/32 JSON for type-safe calls with full ABI decoding
 * 2. appSpecPath - File path to app spec (for large specs)
 * 3. methodSignature - Raw ARC-4 signature (e.g., "hello(string)string") for simple calls
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { ABIMethod, OnApplicationComplete } from 'algosdk'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { readFile } from 'node:fs/promises'

export const appCallTool: Tool = {
  name: 'app_call',
  description:
    'Call an ABI method on a deployed smart contract. Supports three modes: (1) appSpec for inline type-safe calls, (2) appSpecPath for large specs from file, or (3) methodSignature for simple raw calls. One of appSpec, appSpecPath, or methodSignature must be provided.',
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'number',
        description: 'The application ID',
      },
      appSpec: {
        type: 'string',
        description: 'The full ARC-56 or ARC-32 app spec JSON as a string. For small specs only.',
      },
      appSpecPath: {
        type: 'string',
        description:
          'Path to ARC-56/ARC-32 app spec JSON file. Recommended for large specs (>2KB) to avoid truncation issues.',
      },
      methodSignature: {
        type: 'string',
        description:
          'ARC-4 method signature (e.g., "hello(string)string"). Use for simple calls without the full app spec.',
      },
      method: {
        type: 'string',
        description:
          'Method name to call (required when using appSpec/appSpecPath). Ignored when using methodSignature.',
      },
      args: {
        type: 'array',
        description: 'Method arguments in order',
        items: {},
      },
      onComplete: {
        type: 'string',
        enum: ['NoOp', 'OptIn', 'CloseOut', 'DeleteApplication'],
        description: 'On-complete action. Defaults to NoOp.',
      },
      sender: {
        type: 'string',
        description:
          'Sender address. Must be an account in a KMD wallet (use list_accounts to see available). Defaults to the localnet dispenser if not specified.',
      },
    },
    required: ['appId'],
  },
}

interface CallContractArgs {
  appId: number
  method: string
  args?: unknown[]
  onComplete?: 'NoOp' | 'OptIn' | 'CloseOut' | 'DeleteApplication'
  sender?: string
  appSpec?: string // Inline ARC-56/32 JSON
  appSpecPath?: string // Path to ARC-56/32 JSON file
  methodSignature?: string // e.g., "hello(string)string"
}

function parseOnComplete(
  onComplete?: string
):
  | OnApplicationComplete.NoOpOC
  | OnApplicationComplete.OptInOC
  | OnApplicationComplete.CloseOutOC
  | OnApplicationComplete.DeleteApplicationOC
  | undefined {
  switch (onComplete) {
    case 'NoOp':
      return OnApplicationComplete.NoOpOC
    case 'OptIn':
      return OnApplicationComplete.OptInOC
    case 'CloseOut':
      return OnApplicationComplete.CloseOutOC
    case 'DeleteApplication':
      return OnApplicationComplete.DeleteApplicationOC
    default:
      return undefined
  }
}

export async function handleAppCall(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound?: number
  return?: unknown
  appId: number
  method: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<CallContractArgs>(args)
  const {
    appId,
    method,
    args: methodArgs = [],
    onComplete,
    sender,
    appSpec,
    appSpecPath,
    methodSignature,
  } = typedArgs

  if (!appSpec && !appSpecPath && !methodSignature) {
    throw new Error('Must provide either appSpec, appSpecPath, or methodSignature')
  }

  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  let resolvedAppSpec: string | undefined
  if (appSpecPath) {
    resolvedAppSpec = await readFile(appSpecPath, 'utf-8')
  } else if (appSpec) {
    resolvedAppSpec = appSpec
  }

  if (resolvedAppSpec) {
    const appClient = algorand.client.getAppClientById({
      appSpec: resolvedAppSpec,
      appId: BigInt(appId),
      defaultSender: senderAddress,
    })

    const result = await appClient.send.call({
      method,
      args: methodArgs as Parameters<typeof appClient.send.call>[0]['args'],
      onComplete: parseOnComplete(onComplete),
    })

    return {
      success: true,
      txId: result.transaction.txID(),
      confirmedRound: result.confirmation?.confirmedRound
        ? Number(result.confirmation.confirmedRound)
        : undefined,
      return: result.return,
      appId,
      method,
    }
  } else {
    const abiMethod = ABIMethod.fromSignature(methodSignature!)

    const result = await algorand.send.appCallMethodCall({
      appId: BigInt(appId),
      method: abiMethod,
      args: methodArgs as Parameters<typeof algorand.send.appCallMethodCall>[0]['args'],
      sender: senderAddress,
      onComplete: parseOnComplete(onComplete),
    })

    return {
      success: true,
      txId: result.transaction.txID(),
      confirmedRound: result.confirmation?.confirmedRound
        ? Number(result.confirmation.confirmedRound)
        : undefined,
      return: result.return?.returnValue,
      appId,
      method: methodSignature!,
    }
  }
}
