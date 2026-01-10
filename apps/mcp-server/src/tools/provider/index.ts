/**
 * Provider Tools
 *
 * Tools for managing account providers (Vault and Keyring).
 */

import type { ToolRegistration } from '../types.js'
import { getProviderTool, handleGetProvider } from './get-provider.js'

export const providerTools: ToolRegistration[] = [
  { definition: getProviderTool, handler: handleGetProvider },
]
