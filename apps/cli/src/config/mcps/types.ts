import type { AgentId } from '../agents'

export type MCPType = 'local' | 'remote'

export type MCPCategory = 'documentation' | 'development'

export interface AgentMCPConfig {
  /** Key to use in the agent's MCP servers section */
  serverKey: string
  /** Configuration object for this MCP */
  config: Record<string, unknown>
}

export interface MCPDefinition {
  /** Unique identifier for the MCP */
  id: string

  /** Display name shown in UI */
  displayName: string

  /** Description of what this MCP provides */
  description: string

  /** Type of MCP (local requires Docker, remote is cloud-hosted) */
  type: MCPType

  /** Category for grouping MCPs in selection UI */
  category: MCPCategory

  /** Whether this MCP requires Docker to run (local MCPs typically do) */
  requiresDocker?: boolean

  /** Whether this MCP needs an account provider (Vault/Keyring) */
  requiresAccountProvider?: boolean

  /** Whether this MCP needs a GitHub PAT */
  requiresGithubPat?: boolean

  /** Whether this MCP needs dispenser for funding accounts */
  requiresDispenser?: boolean

  /** Get the agent-specific configuration for this MCP */
  getAgentConfig: (agentId: AgentId) => AgentMCPConfig | undefined

  /** Optional hint shown during selection */
  hint?: string
}
