/**
 * Central Configuration
 */

export { version as VERSION } from '../../package.json'

export { URLS, type UrlKey } from './urls'

export { MCP_ENV_VARS } from './network'

export {
  AGENTS,
  AGENT_IDS,
  type AgentId,
  type AgentSelection,
  type AgentDefinition,
  getEnabledAgents,
  getAgentConfigPath,
  getAgentSkillsDir,
  getAgentTemplateFile,
  getAllAgentSkillsDirs,
  getAgentById,
  isValidAgentId,
} from './agents'

export {
  MCPS,
  MCP_IDS,
  type MCPId,
  type MCPSelection,
  type MCPDefinition,
  type MCPType,
  type MCPCategory,
  type AgentMCPConfig,
  getSelectedMCPs,
  getMCPById,
  getMCPsByCategory,
  isValidMCPId,
  requiresDocker,
  requiresAccountProvider,
  requiresGithubPat,
  requiresDispenser,
} from './mcps'
