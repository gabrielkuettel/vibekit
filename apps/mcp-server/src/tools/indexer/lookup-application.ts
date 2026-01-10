/**
 * indexer_lookup_application tool
 *
 * Look up application details from the indexer.
 * Includes historical information and state schemas not available from algod.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { hashProgram } from './utils.js'

export const lookupApplicationTool: Tool = {
  name: 'indexer_lookup_application',
  description:
    'Look up application details using indexer. Returns creator, state schemas, and program hashes.',
  inputSchema: {
    type: 'object',
    properties: {
      applicationId: {
        type: 'number',
        description: 'The application ID to look up',
      },
    },
    required: ['applicationId'],
  },
}

interface LookupApplicationArgs {
  applicationId: number
}

interface ApplicationInfo {
  applicationId: number
  creator: string
  deleted: boolean
  createdAtRound?: number
  deletedAtRound?: number
  globalStateSchema: {
    numUint: number
    numByteSlice: number
  }
  localStateSchema: {
    numUint: number
    numByteSlice: number
  }
  approvalProgramHash: string
  clearStateProgramHash: string
  extraProgramPages?: number
  globalState?: Array<{
    key: string
    value: unknown
    type: 'uint' | 'bytes'
  }>
}

function decodeStateKey(base64Key: string): string {
  try {
    return Buffer.from(base64Key, 'base64').toString('utf-8')
  } catch {
    return base64Key
  }
}

function decodeStateValue(value: Record<string, unknown>): {
  value: unknown
  type: 'uint' | 'bytes'
} {
  if (value.type === 1) {
    // Bytes
    try {
      const decoded = Buffer.from(value.bytes as string, 'base64').toString('utf-8')
      return { value: decoded, type: 'bytes' }
    } catch {
      return { value: value.bytes, type: 'bytes' }
    }
  } else {
    // Uint
    return { value: value.uint, type: 'uint' }
  }
}

export async function handleLookupApplication(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  application: ApplicationInfo
}> {
  const { algorand, config } = ctx
  const { applicationId } = parseArgs<LookupApplicationArgs>(args)

  const result = await algorand.client.indexer.lookupApplications(applicationId).do()
  const app = result.application as unknown as Record<string, unknown>
  const params = app.params as Record<string, unknown>

  const appInfo: ApplicationInfo = {
    applicationId: app.id as number,
    creator: params.creator as string,
    deleted: (app.deleted as boolean) || false,
    globalStateSchema: {
      numUint: (params.globalStateSchema as Record<string, number>)?.numUint || 0,
      numByteSlice: (params.globalStateSchema as Record<string, number>)?.numByteSlice || 0,
    },
    localStateSchema: {
      numUint: (params.localStateSchema as Record<string, number>)?.numUint || 0,
      numByteSlice: (params.localStateSchema as Record<string, number>)?.numByteSlice || 0,
    },
    approvalProgramHash: hashProgram(params.approvalProgram as string | Uint8Array),
    clearStateProgramHash: hashProgram(params.clearStateProgram as string | Uint8Array),
  }

  if (app.createdAtRound) {
    appInfo.createdAtRound = app.createdAtRound as number
  }

  if (app.deletedAtRound) {
    appInfo.deletedAtRound = app.deletedAtRound as number
  }

  if (params.extraProgramPages) {
    appInfo.extraProgramPages = params.extraProgramPages as number
  }

  const globalState = params.globalState as Array<Record<string, unknown>> | undefined
  if (globalState && globalState.length > 0) {
    appInfo.globalState = globalState.map((item) => {
      const key = decodeStateKey(item.key as string)
      const { value, type } = decodeStateValue(item.value as Record<string, unknown>)
      return { key, value, type }
    })
  }

  return {
    network: config.network,
    application: appInfo,
  }
}
