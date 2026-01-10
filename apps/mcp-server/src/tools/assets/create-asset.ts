/**
 * create_asset tool
 *
 * Creates a new Algorand Standard Asset (ASA).
 * Supports fungible tokens, NFTs, and configurable asset parameters.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import {
  validateRequiredPositiveAmount,
  validateDecimals,
  validateAssetName,
  validateUnitName,
  validateAssetUrl,
  validateOptionalAddress,
  validateMetadataHash,
} from '../../lib/validators.js'

export const createAssetTool: Tool = {
  name: 'create_asset',
  description:
    'Create a new Algorand Standard Asset (ASA). ' +
    'Use for fungible tokens (decimals > 0) or NFTs (total=1, decimals=0). ' +
    'The creator automatically holds all units and can configure manager/reserve/freeze/clawback addresses.',
  inputSchema: {
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description:
          'Total supply in smallest divisible unit. For NFTs use 1. For fungible tokens, account for decimals (e.g., 1000000 with decimals=6 = 1.0 token)',
      },
      decimals: {
        type: 'number',
        description:
          'Number of decimal places (0-19). Use 0 for NFTs, 6 for ALGO-like tokens. Default: 0',
      },
      assetName: {
        type: 'string',
        description: 'Full asset name (max 32 bytes). Example: "My Token"',
      },
      unitName: {
        type: 'string',
        description: 'Ticker/unit name (max 8 bytes). Example: "MTK"',
      },
      url: {
        type: 'string',
        description: 'Metadata URL (max 96 bytes). For NFTs, often points to IPFS metadata',
      },
      metadataHash: {
        type: 'string',
        description: 'Optional 32-byte metadata hash (hex or base64 encoded)',
      },
      defaultFrozen: {
        type: 'boolean',
        description: 'If true, asset holdings are frozen by default. Default: false',
      },
      manager: {
        type: 'string',
        description:
          'Address that can reconfigure or destroy the asset. If omitted, uses creator address',
      },
      reserve: {
        type: 'string',
        description: 'Address holding non-circulating supply (informational only)',
      },
      freeze: {
        type: 'string',
        description: 'Address that can freeze/unfreeze asset holdings',
      },
      clawback: {
        type: 'string',
        description: 'Address that can revoke assets from any holder',
      },
      sender: {
        type: 'string',
        description: 'Creator address. Defaults to active account',
      },
    },
    required: ['total'],
  },
}

interface CreateAssetArgs {
  total: number
  decimals?: number
  assetName?: string
  unitName?: string
  url?: string
  metadataHash?: string
  defaultFrozen?: boolean
  manager?: string
  reserve?: string
  freeze?: string
  clawback?: string
  sender?: string
}

export async function handleCreateAsset(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  assetId: number
  txId: string
  confirmedRound: number
  network: string
  creator: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<CreateAssetArgs>(args)
  const {
    total,
    decimals = 0,
    assetName,
    unitName,
    url,
    metadataHash,
    defaultFrozen = false,
    manager,
    reserve,
    freeze,
    clawback,
    sender,
  } = typedArgs

  validateRequiredPositiveAmount(total, 'total')
  validateDecimals(decimals)
  validateAssetName(assetName)
  validateUnitName(unitName)
  validateAssetUrl(url)
  validateOptionalAddress(manager, 'manager')
  validateOptionalAddress(reserve, 'reserve')
  validateOptionalAddress(freeze, 'freeze')
  validateOptionalAddress(clawback, 'clawback')

  const { address: senderAddress } = await resolveSender(algorand, config, sender)

  const metadataHashBytes = validateMetadataHash(metadataHash)

  const result = await algorand.send.assetCreate({
    sender: senderAddress,
    total: BigInt(total),
    decimals,
    assetName,
    unitName,
    url,
    metadataHash: metadataHashBytes,
    defaultFrozen,
    manager: manager || senderAddress,
    reserve,
    freeze,
    clawback,
  })

  // Extract asset ID from the confirmed transaction
  const assetId = Number(result.assetId)

  return {
    success: true,
    assetId,
    txId: result.txIds[0],
    confirmedRound: Number(result.confirmation?.confirmedRound ?? 0),
    network: config.network,
    creator: senderAddress,
  }
}
