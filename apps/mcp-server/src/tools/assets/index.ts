/**
 * Asset Tools
 *
 * Tools for Algorand Standard Asset (ASA) operations.
 * Supports creating, transferring, and managing assets.
 */

import type { ToolRegistration } from '../types.js'

import { createAssetTool, handleCreateAsset } from './create-asset.js'
import { getAssetInfoTool, handleGetAssetInfo } from './get-asset-info.js'
import { assetOptInTool, handleAssetOptIn } from './asset-opt-in.js'
import { assetTransferTool, handleAssetTransfer } from './asset-transfer.js'
import { assetOptOutTool, handleAssetOptOut } from './asset-opt-out.js'
import { assetFreezeTool, handleAssetFreeze } from './asset-freeze.js'
import { assetConfigTool, handleAssetConfig } from './asset-config.js'
import { assetDestroyTool, handleAssetDestroy } from './asset-destroy.js'

export const assetTools: ToolRegistration[] = [
  { definition: createAssetTool, handler: handleCreateAsset },
  { definition: getAssetInfoTool, handler: handleGetAssetInfo },
  { definition: assetOptInTool, handler: handleAssetOptIn },
  { definition: assetTransferTool, handler: handleAssetTransfer },
  { definition: assetOptOutTool, handler: handleAssetOptOut },
  { definition: assetFreezeTool, handler: handleAssetFreeze },
  { definition: assetConfigTool, handler: handleAssetConfig },
  { definition: assetDestroyTool, handler: handleAssetDestroy },
]
