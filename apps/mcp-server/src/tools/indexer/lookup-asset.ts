/**
 * indexer_lookup_asset tool
 *
 * Look up asset details from the indexer.
 * Provides historical information not available from algod.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'

export const lookupAssetTool: Tool = {
  name: 'indexer_lookup_asset',
  description:
    'Look up asset details using indexer. Returns asset parameters and historical information including creation round.',
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID to look up',
      },
    },
    required: ['assetId'],
  },
}

interface LookupAssetArgs {
  assetId: number
}

interface AssetInfo {
  assetId: number
  deleted: boolean
  createdAtRound?: number
  deletedAtRound?: number
  params: {
    creator: string
    total: string // BigInt as string
    decimals: number
    defaultFrozen: boolean
    unitName?: string
    name?: string
    url?: string
    metadataHash?: string
    manager?: string
    reserve?: string
    freeze?: string
    clawback?: string
  }
}

export async function handleLookupAsset(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  asset: AssetInfo
}> {
  const { algorand, config } = ctx
  const { assetId } = parseArgs<LookupAssetArgs>(args)

  const result = await algorand.client.indexer.lookupAssetByID(assetId).do()
  const asset = result.asset as unknown as Record<string, unknown>
  const params = asset.params as Record<string, unknown>

  const assetInfo: AssetInfo = {
    assetId: asset.index as number,
    deleted: (asset.deleted as boolean) || false,
    params: {
      creator: params.creator as string,
      total: String(params.total),
      decimals: params.decimals as number,
      defaultFrozen: (params.defaultFrozen as boolean) || false,
    },
  }

  if (asset.createdAtRound) {
    assetInfo.createdAtRound = asset.createdAtRound as number
  }

  if (asset.deletedAtRound) {
    assetInfo.deletedAtRound = asset.deletedAtRound as number
  }

  // Optional asset parameters
  if (params.unitName) {
    assetInfo.params.unitName = params.unitName as string
  }

  if (params.name) {
    assetInfo.params.name = params.name as string
  }

  if (params.url) {
    assetInfo.params.url = params.url as string
  }

  if (params.metadataHash) {
    // Decode metadata hash from base64 to hex if string, or handle Uint8Array
    try {
      const metadataHash = params.metadataHash
      if (metadataHash instanceof Uint8Array) {
        assetInfo.params.metadataHash = Buffer.from(metadataHash).toString('hex')
      } else {
        const hash = Buffer.from(metadataHash as string, 'base64').toString('hex')
        assetInfo.params.metadataHash = hash
      }
    } catch {
      assetInfo.params.metadataHash = params.metadataHash as string
    }
  }

  if (params.manager) {
    assetInfo.params.manager = params.manager as string
  }

  if (params.reserve) {
    assetInfo.params.reserve = params.reserve as string
  }

  if (params.freeze) {
    assetInfo.params.freeze = params.freeze as string
  }

  if (params.clawback) {
    assetInfo.params.clawback = params.clawback as string
  }

  return {
    network: config.network,
    asset: assetInfo,
  }
}
