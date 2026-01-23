import type { MCPDefinition, MCPCategory } from './types'
import type { MCPId, MCPSelection } from './index'
import { MCPS, MCP_IDS } from './index'

export function getSelectedMCPs(selected: MCPSelection): MCPDefinition[] {
  return selected.map((id) => MCPS[id])
}

export function getMCPById(id: MCPId): MCPDefinition {
  return MCPS[id]
}

export function isValidMCPId(id: string): id is MCPId {
  return MCP_IDS.includes(id as MCPId)
}

export function requiresDocker(selected: MCPSelection): boolean {
  return getSelectedMCPs(selected).some((mcp) => mcp.requiresDocker)
}

export function requiresAccountProvider(selected: MCPSelection): boolean {
  return getSelectedMCPs(selected).some((mcp) => mcp.requiresAccountProvider)
}

export function requiresGithubPat(selected: MCPSelection): boolean {
  return getSelectedMCPs(selected).some((mcp) => mcp.requiresGithubPat)
}

export function requiresDispenser(selected: MCPSelection): boolean {
  return getSelectedMCPs(selected).some((mcp) => mcp.requiresDispenser)
}

export function getMCPsByCategory(category: MCPCategory): MCPDefinition[] {
  return Object.values(MCPS).filter((mcp) => mcp.category === category)
}
