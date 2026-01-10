/**
 * app_opt_in tool
 *
 * Opts an account into an application.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { OnApplicationComplete } from 'algosdk'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { readFile } from 'node:fs/promises'

export const appOptInTool: Tool = {
  name: 'app_opt_in',
  description:
    'Opt an account into an application. Required before the account can have local state. Most contracts implement an ABI method for opt-in - provide appSpec/appSpecPath and method to use it. Use appSpecPath for large specs (>2KB). Falls back to a bare opt-in call if no method is specified.',
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'number',
        description: 'The application ID',
      },
      appSpec: {
        type: 'string',
        description: 'App spec JSON for ABI method call. For small specs only.',
      },
      appSpecPath: {
        type: 'string',
        description:
          'Path to ARC-56/ARC-32 app spec JSON file. Recommended for large specs (>2KB) to avoid truncation issues.',
      },
      method: {
        type: 'string',
        description:
          'ABI method name for opt-in (e.g., "opt_in", "optIn"). Required with appSpec/appSpecPath.',
      },
      args: {
        type: 'array',
        description: 'Method arguments if the opt-in method requires them',
        items: {},
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

interface OptInArgs {
  appId: number
  appSpec?: string
  appSpecPath?: string
  method?: string
  args?: unknown[]
  sender?: string
}

export async function handleAppOptIn(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound?: number
  appId: number
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<OptInArgs>(args)
  const { appId, appSpec, appSpecPath, method, args: methodArgs, sender } = typedArgs

  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  let resolvedAppSpec: string | undefined
  if (appSpecPath) {
    resolvedAppSpec = await readFile(appSpecPath, 'utf-8')
  } else if (appSpec) {
    resolvedAppSpec = appSpec
  }

  if (method && resolvedAppSpec) {
    const appClient = algorand.client.getAppClientById({
      appSpec: resolvedAppSpec,
      appId: BigInt(appId),
      defaultSender: senderAddress,
    })

    const result = await appClient.send.call({
      method,
      args: (methodArgs || []) as Parameters<typeof appClient.send.call>[0]['args'],
      onComplete: OnApplicationComplete.OptInOC,
    })

    return {
      success: true,
      txId: result.transaction.txID(),
      confirmedRound: result.confirmation?.confirmedRound
        ? Number(result.confirmation.confirmedRound)
        : undefined,
      appId,
    }
  }

  const result = await algorand.send.appCall({
    sender: senderAddress,
    appId: BigInt(appId),
    onComplete: OnApplicationComplete.OptInOC,
  })

  return {
    success: true,
    txId: result.transaction.txID(),
    confirmedRound: result.confirmation?.confirmedRound
      ? Number(result.confirmation.confirmedRound)
      : undefined,
    appId,
  }
}
