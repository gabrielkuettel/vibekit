/**
 * read_global_state tool
 *
 * Reads global state from a deployed application.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { bytesToString, bytesToBase64 } from '../../lib/encoding.js'

export const readGlobalStateTool: Tool = {
  name: 'read_global_state',
  description: 'Read global state from a deployed application. Returns decoded key-value pairs.',
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'number',
        description: 'The application ID',
      },
      appSpec: {
        type: 'string',
        description: 'Optional app spec JSON for better state decoding',
      },
    },
    required: ['appId'],
  },
}

interface ReadGlobalStateArgs {
  appId: number
  appSpec?: string
}

interface StateValue {
  key: string
  value: unknown
  type: 'uint' | 'bytes'
}

export async function handleReadGlobalState(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  appId: number
  state: StateValue[]
}> {
  const { algorand } = ctx
  const typedArgs = parseArgs<ReadGlobalStateArgs>(args)
  const { appId, appSpec: appSpecJson } = typedArgs

  // Get app info to read global state
  const appInfo = await algorand.client.algod.getApplicationByID(appId).do()

  // Parse state keys from app spec if provided
  let stateKeyMap: Map<string, string> | undefined
  if (appSpecJson) {
    const appSpec = JSON.parse(appSpecJson)
    stateKeyMap = new Map()

    // ARC-56 state schema
    if (appSpec.state?.keys?.global) {
      for (const [name, info] of Object.entries(appSpec.state.keys.global)) {
        const keyInfo = info as { key: string }
        stateKeyMap.set(keyInfo.key, name)
      }
    }
  }

  // Convert global state to readable format
  const state: StateValue[] = []

  if (appInfo.params.globalState) {
    for (const item of appInfo.params.globalState) {
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

  return { appId, state }
}
