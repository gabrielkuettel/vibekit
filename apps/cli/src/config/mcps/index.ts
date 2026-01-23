import { vibekit } from './vibekit'
import { algorandRemote } from './algorand-remote'
import { kappa } from './kappa'
import { context7 } from './context7'

export type { MCPDefinition, MCPType, MCPCategory, AgentMCPConfig } from './types'

export const MCPS = {
  vibekit,
  'algorand-remote': algorandRemote,
  kappa,
  context7,
} as const

export type MCPId = keyof typeof MCPS
export const MCP_IDS = Object.keys(MCPS) as MCPId[]
export type MCPSelection = MCPId[]

export {
  getSelectedMCPs,
  getMCPById,
  getMCPsByCategory,
  isValidMCPId,
  requiresDocker,
  requiresAccountProvider,
  requiresGithubPat,
  requiresDispenser,
} from './utils'
