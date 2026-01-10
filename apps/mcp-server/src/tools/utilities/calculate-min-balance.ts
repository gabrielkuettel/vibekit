/**
 * calculate_min_balance tool
 *
 * Calculates the minimum balance requirement (MBR) for an Algorand account
 * based on its state (assets, apps, boxes).
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext } from '../types.js'

// Algorand MBR constants (in microALGO)
const BASE_MBR = 100_000
const ASSET_MBR = 100_000
const APP_BASE_MBR = 100_000
const APP_OPTED_IN_MBR = 100_000
const BOX_FLAT_MBR = 2_500
const BOX_BYTE_MBR = 400

export const calculateMinBalanceTool: Tool = {
  name: 'calculate_min_balance',
  description:
    'Calculate the minimum balance requirement (MBR) for an Algorand account. ' +
    'MBR depends on assets opted into, apps created/opted into, and boxes. ' +
    'Note: This does not include global/local state schema costs (28,500 per uint, 50,000 per byte-slice) ' +
    "as those require knowing each app's schema.",
  inputSchema: {
    type: 'object',
    properties: {
      numAssets: {
        type: 'number',
        description: 'Number of assets opted into (includes created assets). Default: 0',
      },
      numCreatedApps: {
        type: 'number',
        description: 'Number of apps created by this account. Default: 0',
      },
      numOptedInApps: {
        type: 'number',
        description: 'Number of apps opted into (excluding created apps). Default: 0',
      },
      numExtraAppPages: {
        type: 'number',
        description: 'Total extra app pages across all created apps. Default: 0',
      },
      numBoxes: {
        type: 'number',
        description: 'Number of boxes across all apps created by this account. Default: 0',
      },
      totalBoxBytes: {
        type: 'number',
        description:
          'Sum of (nameLength + valueSize) for all boxes. Each box costs 2,500 + 400 * bytes. Default: 0',
      },
    },
    required: [],
  },
}

interface MinBalanceBreakdown {
  base: number
  assets: number
  createdApps: number
  optedInApps: number
  boxes: number
}

export async function handleCalculateMinBalance(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{
  minBalanceMicroAlgo: number
  minBalanceAlgo: number
  breakdown: MinBalanceBreakdown
}> {
  const numAssets = (args.numAssets as number) ?? 0
  const numCreatedApps = (args.numCreatedApps as number) ?? 0
  const numOptedInApps = (args.numOptedInApps as number) ?? 0
  const numExtraAppPages = (args.numExtraAppPages as number) ?? 0
  const numBoxes = (args.numBoxes as number) ?? 0
  const totalBoxBytes = (args.totalBoxBytes as number) ?? 0

  const inputs = {
    numAssets,
    numCreatedApps,
    numOptedInApps,
    numExtraAppPages,
    numBoxes,
    totalBoxBytes,
  }
  for (const [name, value] of Object.entries(inputs)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`${name} must be a finite number`)
    }
    if (value < 0 || !Number.isInteger(value)) {
      throw new Error(`${name} must be a non-negative integer`)
    }
  }

  // Calculate breakdown
  const breakdown: MinBalanceBreakdown = {
    base: BASE_MBR,
    assets: numAssets * ASSET_MBR,
    createdApps:
      numCreatedApps * APP_BASE_MBR * (1 + numExtraAppPages / Math.max(numCreatedApps, 1)),
    optedInApps: numOptedInApps * APP_OPTED_IN_MBR,
    boxes: numBoxes * BOX_FLAT_MBR + totalBoxBytes * BOX_BYTE_MBR,
  }

  // Recalculate created apps MBR correctly: each app costs 100,000 * (1 + its extra pages)
  // Since we only have total extra pages, we approximate as: numCreatedApps * 100,000 + numExtraAppPages * 100,000
  breakdown.createdApps = numCreatedApps * APP_BASE_MBR + numExtraAppPages * APP_BASE_MBR

  const minBalanceMicroAlgo =
    breakdown.base +
    breakdown.assets +
    breakdown.createdApps +
    breakdown.optedInApps +
    breakdown.boxes

  return {
    minBalanceMicroAlgo,
    minBalanceAlgo: minBalanceMicroAlgo / 1_000_000,
    breakdown,
  }
}
