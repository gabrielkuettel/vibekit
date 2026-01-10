/**
 * get_asset_info tool
 *
 * Retrieves detailed information about an Algorand Standard Asset (ASA).
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { validateRequiredId } from '../../lib/validators.js'

export const getAssetInfoTool: Tool = {
  name: 'get_asset_info',
  description:
    'Get detailed information about an Algorand Standard Asset (ASA) by its ID. ' +
    'Returns creator, total supply, decimals, name, and management addresses.',
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID to query',
      },
    },
    required: ['assetId'],
  },
}

interface GetAssetInfoArgs {
  assetId: number
}

export async function handleGetAssetInfo(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  assetId: number
  creator: string
  total: string
  decimals: number
  unitName: string | undefined
  assetName: string | undefined
  url: string | undefined
  manager: string | undefined
  reserve: string | undefined
  freeze: string | undefined
  clawback: string | undefined
  defaultFrozen: boolean
  network: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<GetAssetInfoArgs>(args)
  const { assetId } = typedArgs

  validateRequiredId(assetId, 'assetId')

  const assetInfo = await algorand.asset.getById(BigInt(assetId))

  return {
    assetId,
    creator: assetInfo.creator,
    total: assetInfo.total.toString(),
    decimals: assetInfo.decimals,
    unitName: assetInfo.unitName,
    assetName: assetInfo.assetName,
    url: assetInfo.url,
    manager: assetInfo.manager,
    reserve: assetInfo.reserve,
    freeze: assetInfo.freeze,
    clawback: assetInfo.clawback,
    defaultFrozen: assetInfo.defaultFrozen ?? false,
    network: config.network,
  }
}
