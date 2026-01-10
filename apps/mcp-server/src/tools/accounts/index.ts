/**
 * Account Tools
 *
 * Tools for querying and managing accounts.
 * Supports Vault and Keyring account providers.
 */

import type { ToolRegistration } from '../types.js'

import { listAccountsTool, handleListAccounts } from './list-accounts.js'
import { getAccountInfoTool, handleGetAccountInfo } from './get-account-info.js'
import { fundAccountTool, handleFundAccount } from './fund-account.js'
import { sendPaymentTool, handleSendPayment } from './send-payment.js'
import { createAccountTool, handleCreateAccount } from './create-account.js'
import { switchAccountTool, handleSwitchAccount } from './switch-account.js'
import { getActiveAccountTool, handleGetActiveAccount } from './get-active-account.js'

// Re-export requireProviderAvailable from service for backwards compatibility
export { requireProviderAvailable } from '../../lib/account-service.js'

export const accountTools: ToolRegistration[] = [
  { definition: listAccountsTool, handler: handleListAccounts },
  { definition: getAccountInfoTool, handler: handleGetAccountInfo },
  { definition: fundAccountTool, handler: handleFundAccount },
  { definition: sendPaymentTool, handler: handleSendPayment },
  { definition: createAccountTool, handler: handleCreateAccount },
  { definition: switchAccountTool, handler: handleSwitchAccount },
  { definition: getActiveAccountTool, handler: handleGetActiveAccount },
]
