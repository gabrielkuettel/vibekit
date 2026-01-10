/**
 * read_box tool
 *
 * Reads a box value from a deployed application.
 * Supports both simple box names and BoxMap compound keys.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { ABIUintType, decodeAddress } from 'algosdk'
import { encodeBase64 } from '../../lib/encoding.js'

export const readBoxTool: Tool = {
  name: 'read_box',
  description: `Read a box value from a deployed application.

Supports two modes:
1. Simple box: Provide boxName for UTF-8 encoded box names
2. BoxMap: Provide keyPrefix + key + keyType for compound BoxMap keys

BoxMap keys are encoded as: prefix bytes + ABI-encoded key

Examples:
- Simple box: { "appId": 123, "boxName": "myBox" }
- BoxMap with uint64 key: { "appId": 123, "keyPrefix": "boxMap", "key": 1, "keyType": "uint64" }
- BoxMap with address key: { "appId": 123, "keyPrefix": "users", "key": "ABC123...", "keyType": "address" }
- BoxMap with string key: { "appId": 123, "keyPrefix": "names", "key": "alice", "keyType": "string" }`,
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'number',
        description: 'The application ID',
      },
      boxName: {
        type: 'string',
        description: 'The box name (will be encoded as UTF-8 bytes). Use this for simple boxes.',
      },
      keyPrefix: {
        type: 'string',
        description: 'The BoxMap key prefix. Use with key and keyType for BoxMap lookups.',
      },
      key: {
        type: ['string', 'number'],
        description:
          'The BoxMap key value. For uint64, use a number. For address or string, use a string.',
      },
      keyType: {
        type: 'string',
        enum: ['uint64', 'address', 'string'],
        description: 'The type of the BoxMap key. Defaults to "uint64" if not specified.',
      },
      appSpec: {
        type: 'string',
        description: 'Optional app spec JSON for better value decoding',
      },
    },
    required: ['appId'],
  },
}

interface ReadBoxArgs {
  appId: number
  boxName?: string
  keyPrefix?: string
  key?: string | number
  keyType?: 'uint64' | 'address' | 'string'
  appSpec?: string
}

/**
 * Encode a BoxMap key based on its type
 */
function encodeBoxMapKey(
  key: string | number,
  keyType: 'uint64' | 'address' | 'string'
): Uint8Array {
  switch (keyType) {
    case 'uint64': {
      const value = typeof key === 'number' ? BigInt(key) : BigInt(key)
      return new ABIUintType(64).encode(value)
    }
    case 'address': {
      if (typeof key !== 'string') {
        throw new Error('Address key must be a string')
      }
      return decodeAddress(key).publicKey
    }
    case 'string': {
      const strKey = typeof key === 'string' ? key : String(key)
      return new TextEncoder().encode(strKey)
    }
  }
}

/**
 * Build the box name bytes from either a simple name or BoxMap parameters
 */
function buildBoxNameBytes(args: ReadBoxArgs): {
  boxNameBytes: Uint8Array
  boxNameDisplay: string
} {
  const { boxName, keyPrefix, key, keyType } = args

  // BoxMap mode: keyPrefix + key
  if (keyPrefix !== undefined && key !== undefined) {
    const prefixBytes = new TextEncoder().encode(keyPrefix)
    const keyBytes = encodeBoxMapKey(key, keyType ?? 'uint64')

    // Combine prefix + key
    const boxNameBytes = new Uint8Array(prefixBytes.length + keyBytes.length)
    boxNameBytes.set(prefixBytes)
    boxNameBytes.set(keyBytes, prefixBytes.length)

    return {
      boxNameBytes,
      boxNameDisplay: `${keyPrefix}[${key}]`,
    }
  }

  // Simple box mode
  if (boxName !== undefined) {
    return {
      boxNameBytes: new TextEncoder().encode(boxName),
      boxNameDisplay: boxName,
    }
  }

  throw new Error('Either boxName or keyPrefix+key must be provided to identify the box')
}

export async function handleReadBox(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  appId: number
  boxName: string
  exists: boolean
  value?: string
  valueBase64?: string
  size?: number
}> {
  const { algorand } = ctx
  const typedArgs = parseArgs<ReadBoxArgs>(args)
  const { appId } = typedArgs

  // Build box name bytes (handles both simple and BoxMap modes)
  const { boxNameBytes, boxNameDisplay } = buildBoxNameBytes(typedArgs)

  try {
    const boxResponse = await algorand.client.algod
      .getApplicationBoxByName(appId, boxNameBytes)
      .do()

    // Convert Uint8Array to string and base64
    const valueArray = new Uint8Array(boxResponse.value)
    const valueString = new TextDecoder().decode(valueArray)
    const valueBase64 = encodeBase64(valueArray)

    return {
      appId,
      boxName: boxNameDisplay,
      exists: true,
      value: valueString,
      valueBase64,
      size: valueArray.length,
    }
  } catch (error) {
    // Box doesn't exist or other error
    if (error instanceof Error && error.message.includes('box not found')) {
      return {
        appId,
        boxName: boxNameDisplay,
        exists: false,
      }
    }
    throw error
  }
}
