/**
 * Transaction Tools
 *
 * Tools for composing and sending atomic transaction groups.
 */

import type { ToolRegistration } from '../types.js'

import { sendAtomicGroupTool, handleSendAtomicGroup } from './send-atomic-group.js'

export const transactionTools: ToolRegistration[] = [
  { definition: sendAtomicGroupTool, handler: handleSendAtomicGroup },
]
