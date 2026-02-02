/**
 * Wallet Tools
 *
 * Tools for connecting and managing mobile wallet connections via WalletConnect.
 */

import type { ToolRegistration } from '../types.js'
import { pairWalletTool } from './pair-wallet.js'
import { walletStatusTool } from './wallet-status.js'
import { disconnectWalletTool } from './disconnect-wallet.js'

export const walletTools: ToolRegistration[] = [
  pairWalletTool,
  walletStatusTool,
  disconnectWalletTool,
]
