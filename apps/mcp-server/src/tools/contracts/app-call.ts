/**
 * app_call tool
 *
 * Calls an ABI method on a deployed smart contract.
 * Thin wrapper around sendTransactions() for app calls.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { sendTransactions } from '../transactions/index.js'

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
      sender: {
        type: 'string',
        description: 'Sender address. Defaults to active account.',
      },
      extraFee: {
        type: 'number',
        description: 'Extra fee in microALGO to cover inner transactions',
      },
      maxFee: {
        type: 'number',
        description: 'Max fee in microALGO',
      },
    },
    required: ['appId'],
  },
}

interface CallContractArgs {
  appId: number
  method?: string
  args?: unknown[]
  sender?: string
  appSpec?: string
  appSpecPath?: string
  methodSignature?: string
  extraFee?: number
  maxFee?: number
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
    sender,
    appSpec,
    appSpecPath,
    methodSignature,
    extraFee,
    maxFee,
  } = typedArgs

  if (!appSpec && !appSpecPath && !methodSignature) {
    throw new Error('Must provide either appSpec, appSpecPath, or methodSignature')
  }

  const result = await sendTransactions(
    {
      transactions: [
        {
          type: 'app_call',
          appId,
          methodSignature,
          appSpec,
          appSpecPath,
          method,
          args: methodArgs,
          extraFee,
          maxFee,
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
    confirmedRound: result.confirmedRound,
    return: result.returns?.[0],
    appId,
    method: methodSignature || method || '',
  }
}
