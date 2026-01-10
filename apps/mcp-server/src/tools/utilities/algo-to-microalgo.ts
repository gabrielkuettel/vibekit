/**
 * algo_to_microalgo tool
 *
 * Converts ALGO to microALGO.
 * 1 ALGO = 1,000,000 microALGO
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { ToolContext } from '../types.js'

export const algoToMicroAlgoTool: Tool = {
  name: 'algo_to_microalgo',
  description:
    'Convert ALGO to microALGO. ' +
    '1 ALGO = 1,000,000 microALGO. ' +
    'Useful for preparing transaction amounts.',
  inputSchema: {
    type: 'object',
    properties: {
      algo: {
        type: 'number',
        description: 'Amount in ALGO to convert',
      },
    },
    required: ['algo'],
  },
}

export async function handleAlgoToMicroAlgo(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{
  algo: number
  microAlgo: number
}> {
  const algo = args.algo as number

  if (typeof algo !== 'number' || !Number.isFinite(algo)) {
    throw new Error('algo must be a finite number')
  }

  if (algo < 0) {
    throw new Error('algo must be non-negative')
  }

  const microAlgo = Math.round(algo * 1_000_000)

  return {
    algo,
    microAlgo,
  }
}
