/**
 * Utility Tools
 *
 * Pure utility tools for common Algorand operations that don't require network calls.
 */

import type { ToolRegistration } from '../types.js'
import {
  getApplicationAddressTool,
  handleGetApplicationAddress,
} from './get-application-address.js'
import { validateAddressTool, handleValidateAddress } from './validate-address.js'
import { algoToMicroAlgoTool, handleAlgoToMicroAlgo } from './algo-to-microalgo.js'
import { microAlgoToAlgoTool, handleMicroAlgoToAlgo } from './microalgo-to-algo.js'
import { calculateMinBalanceTool, handleCalculateMinBalance } from './calculate-min-balance.js'

export const utilityTools: ToolRegistration[] = [
  { definition: getApplicationAddressTool, handler: handleGetApplicationAddress },
  { definition: validateAddressTool, handler: handleValidateAddress },
  { definition: algoToMicroAlgoTool, handler: handleAlgoToMicroAlgo },
  { definition: microAlgoToAlgoTool, handler: handleMicroAlgoToAlgo },
  { definition: calculateMinBalanceTool, handler: handleCalculateMinBalance },
]
