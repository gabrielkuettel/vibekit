/**
 * asset_config tool
 *
 * Reconfigures an Algorand Standard Asset (ASA).
 * Can update manager, reserve, freeze, and clawback addresses.
 * Only the current manager can reconfigure the asset.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { resolveSender } from '../../lib/account-service.js'
import { validateRequiredId, validateOptionalAddress } from '../../lib/validators.js'

export const assetConfigTool: Tool = {
  name: 'asset_config',
  description:
    "Reconfigure an asset's management addresses. " +
    'Sender must be the current manager. ' +
    'Pass empty string to remove an address (makes it immutable). ' +
    'Omitted fields keep their current values.',
  inputSchema: {
    type: 'object',
    properties: {
      assetId: {
        type: 'number',
        description: 'The asset ID to reconfigure',
      },
      manager: {
        type: 'string',
        description: 'New manager address. Empty string removes manager permanently',
      },
      reserve: {
        type: 'string',
        description: 'New reserve address. Empty string removes reserve',
      },
      freeze: {
        type: 'string',
        description: 'New freeze address. Empty string removes freeze capability',
      },
      clawback: {
        type: 'string',
        description: 'New clawback address. Empty string removes clawback capability',
      },
      sender: {
        type: 'string',
        description: 'Must be current manager. Defaults to active account',
      },
    },
    required: ['assetId'],
  },
}

interface AssetConfigArgs {
  assetId: number
  manager?: string
  reserve?: string
  freeze?: string
  clawback?: string
  sender?: string
}

export async function handleAssetConfig(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  success: boolean
  txId: string
  confirmedRound: number
  assetId: number
  network: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<AssetConfigArgs>(args)
  const { assetId, manager, reserve, freeze, clawback, sender } = typedArgs

  validateRequiredId(assetId, 'assetId')
  validateOptionalAddress(manager, 'manager', true)
  validateOptionalAddress(reserve, 'reserve', true)
  validateOptionalAddress(freeze, 'freeze', true)
  validateOptionalAddress(clawback, 'clawback', true)

  const { address: senderAddress } = await resolveSender(algorand, config, sender)
  const assetInfo = await algorand.asset.getById(BigInt(assetId))

  const configOptions: Parameters<typeof algorand.send.assetConfig>[0] = {
    sender: senderAddress,
    assetId: BigInt(assetId),
    manager: manager !== undefined ? manager || undefined : assetInfo.manager,
    reserve: reserve !== undefined ? reserve || undefined : assetInfo.reserve,
    freeze: freeze !== undefined ? freeze || undefined : assetInfo.freeze,
    clawback: clawback !== undefined ? clawback || undefined : assetInfo.clawback,
  }

  const result = await algorand.send.assetConfig(configOptions)

  return {
    success: true,
    txId: result.txIds[0],
    confirmedRound: Number(result.confirmation?.confirmedRound ?? 0),
    assetId,
    network: config.network,
  }
}
