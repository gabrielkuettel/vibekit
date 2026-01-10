/**
 * microalgo_to_algo tool
 *
 * Converts microALGO to ALGO.
 * 1 ALGO = 1,000,000 microALGO
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext } from '../types.js'

export const microAlgoToAlgoTool: Tool = {
  name: 'microalgo_to_algo',
  description:
    'Convert microALGO to ALGO. ' +
    '1 ALGO = 1,000,000 microALGO. ' +
    'Useful for displaying human-readable amounts.',
  inputSchema: {
    type: 'object',
    properties: {
      microAlgo: {
        type: 'number',
        description: 'Amount in microALGO to convert',
      },
    },
    required: ['microAlgo'],
  },
}

export async function handleMicroAlgoToAlgo(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{
  microAlgo: number
  algo: number
}> {
  const microAlgo = args.microAlgo as number

  if (typeof microAlgo !== 'number' || !Number.isFinite(microAlgo)) {
    throw new Error('microAlgo must be a finite number')
  }

  if (microAlgo < 0) {
    throw new Error('microAlgo must be non-negative')
  }

  const algo = microAlgo / 1_000_000

  return {
    microAlgo,
    algo,
  }
}
