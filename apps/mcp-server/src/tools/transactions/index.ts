/**
 * Transaction Tools
 *
 * Tools for composing, simulating, and sending atomic transaction groups.
 */

import type { ToolRegistration } from '../types.js'

import { sendAtomicGroupTool, handleSendAtomicGroup } from './send-atomic-group.js'
import { simulateTransactionTool, handleSimulateTransaction } from './simulate-transaction.js'

export const transactionTools: ToolRegistration[] = [
  { definition: sendAtomicGroupTool, handler: handleSendAtomicGroup },
  { definition: simulateTransactionTool, handler: handleSimulateTransaction },
]
