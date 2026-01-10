/**
 * Network Tools
 *
 * Tools for managing Algorand network connections.
 */

import type { ToolRegistration } from '../types.js'
import { switchNetworkTool, handleSwitchNetwork } from './switch-network.js'
import { getNetworkTool, handleGetNetwork } from './get-network.js'

export const networkTools: ToolRegistration[] = [
  { definition: switchNetworkTool, handler: handleSwitchNetwork },
  { definition: getNetworkTool, handler: handleGetNetwork },
]
