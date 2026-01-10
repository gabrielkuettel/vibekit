/**
 * read_local_state tool
 *
 * Reads local state for a specific account from a deployed application.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { bytesToString, bytesToBase64 } from '../../lib/encoding.js'

export const readLocalStateTool: Tool = {
  name: 'read_local_state',
  description: 'Read local state for a specific account from a deployed application.',
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'number',
        description: 'The application ID',
      },
      address: {
        type: 'string',
        description: 'The account address to read local state for',
      },
      appSpec: {
        type: 'string',
        description: 'Optional app spec JSON for better state decoding',
      },
    },
    required: ['appId', 'address'],
  },
}

interface ReadLocalStateArgs {
  appId: number
  address: string
  appSpec?: string
}

interface StateValue {
  key: string
  value: unknown
  type: 'uint' | 'bytes'
}

export async function handleReadLocalState(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  appId: number
  address: string
  state: StateValue[]
}> {
  const { algorand } = ctx
  const typedArgs = parseArgs<ReadLocalStateArgs>(args)
  const { appId, address, appSpec: appSpecJson } = typedArgs

  // Get account info to read local state
  const accountInfo = await algorand.client.algod.accountApplicationInformation(address, appId).do()

  // Parse state keys from app spec if provided
  let stateKeyMap: Map<string, string> | undefined
  if (appSpecJson) {
    const appSpec = JSON.parse(appSpecJson)
    stateKeyMap = new Map()

    // ARC-56 state schema
    if (appSpec.state?.keys?.local) {
      for (const [name, info] of Object.entries(appSpec.state.keys.local)) {
        const keyInfo = info as { key: string }
        stateKeyMap.set(keyInfo.key, name)
      }
    }
  }

  // Convert local state to readable format
  const state: StateValue[] = []

  if (accountInfo.appLocalState?.keyValue) {
    for (const item of accountInfo.appLocalState.keyValue) {
      const keyString = bytesToString(item.key)
      const keyBase64 = bytesToBase64(item.key)
      const displayKey = stateKeyMap?.get(keyBase64) || stateKeyMap?.get(keyString) || keyString

      if (item.value.type === 1) {
        // Bytes
        const valueString = bytesToString(item.value.bytes)
        state.push({
          key: displayKey,
          value: valueString,
          type: 'bytes',
        })
      } else {
        // Uint
        state.push({
          key: displayKey,
          value: item.value.uint,
          type: 'uint',
        })
      }
    }
  }

  return { appId, address, state }
}
