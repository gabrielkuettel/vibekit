/**
 * app_deploy tool
 *
 * Deploys a new instance of a smart contract using the app spec.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { readFile } from 'node:fs/promises'

export const appDeployTool: Tool = {
  name: 'app_deploy',
  description: `Deploy a new instance of a smart contract. Provide either appSpec (inline JSON) or appSpecPath (file path). Use appSpecPath for large app specs (>2KB) to avoid truncation.

Create patterns:
- Bare create (omit method): For contracts with no constructor or a parameterless create. Most contracts use this.
- ABI create (provide method + args): For contracts requiring constructor arguments. Specify the create method name (e.g., "createApplication", "create") and pass args.

Returns the new application ID and app address.`,
  inputSchema: {
    type: 'object',
    properties: {
      appSpec: {
        type: 'string',
        description: 'The ARC-56 or ARC-32 app spec JSON as a string. For small specs only.',
      },
      appSpecPath: {
        type: 'string',
        description:
          'Path to ARC-56/ARC-32 app spec JSON file. Recommended for large specs (>2KB) to avoid truncation issues.',
      },
      method: {
        type: 'string',
        description:
          'ABI method name for create (e.g., "createApplication"). If not provided, uses bare create.',
      },
      args: {
        type: 'array',
        description: 'Arguments for the ABI create method, in order.',
        items: {},
      },
      deployTimeParams: {
        type: 'object',
        description: 'Optional template parameters for deploy-time substitution',
        additionalProperties: true,
      },
      sender: {
        type: 'string',
        description:
          'Sender address. Must be an account in a KMD wallet (use list_accounts to see available). Defaults to the localnet dispenser if not specified.',
      },
    },
  },
}

interface DeployContractArgs {
  appSpec?: string
  appSpecPath?: string
  method?: string
  args?: unknown[]
  deployTimeParams?: Record<string, string | number | bigint | Uint8Array>
  sender?: string
}

export async function handleAppDeploy(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  appId: number
  appAddress: string
  txId: string
  confirmedRound?: number
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<DeployContractArgs>(args)
  const { appSpec, appSpecPath, method, args: methodArgs, deployTimeParams, sender } = typedArgs

  // Resolve app spec from either inline or file
  let resolvedAppSpec: string
  if (appSpecPath) {
    resolvedAppSpec = await readFile(appSpecPath, 'utf-8')
  } else if (appSpec) {
    resolvedAppSpec = appSpec
  } else {
    throw new Error('Must provide either appSpec or appSpecPath')
  }

  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  const factory = algorand.client.getAppFactory({
    appSpec: resolvedAppSpec,
    defaultSender: senderAddress,
    deployTimeParams,
  })

  // Deploy using ABI create method if provided, otherwise bare create
  if (method) {
    const { appClient, result } = await factory.send.create({
      method,
      args: methodArgs as Parameters<typeof factory.send.create>[0]['args'],
    })
    return {
      success: true,
      appId: Number(appClient.appId),
      appAddress: appClient.appAddress.toString(),
      txId: result.transaction.txID(),
      confirmedRound: result.confirmation?.confirmedRound
        ? Number(result.confirmation.confirmedRound)
        : undefined,
    }
  } else {
    const { appClient, result } = await factory.send.bare.create()
    return {
      success: true,
      appId: Number(appClient.appId),
      appAddress: appClient.appAddress.toString(),
      txId: result.transaction.txID(),
      confirmedRound: result.confirmation?.confirmedRound
        ? Number(result.confirmation.confirmedRound)
        : undefined,
    }
  }
}
