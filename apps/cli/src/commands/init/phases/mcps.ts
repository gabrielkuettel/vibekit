/**
 * MCP selection phase - choose which MCP servers to install
 */

import pc from 'picocolors'

import { select } from '../../../utils/prompts'
import {
  getMCPsByCategory,
  type MCPId,
  type MCPSelection,
  type MCPDefinition,
} from '../../../config'

interface MCPOption {
  value: MCPId
  label: string
  hint?: string
}

function buildMCPOptions(mcps: MCPDefinition[], dockerAvailable: boolean): MCPOption[] {
  return mcps.map((mcp) => {
    let hint = mcp.description

    // Add Docker warning for local MCPs when Docker is not available
    if (mcp.requiresDocker && !dockerAvailable) {
      hint = `${hint} - ${pc.yellow('requires Docker')}`
    }

    return {
      value: mcp.id as MCPId,
      label: mcp.displayName,
      hint,
    }
  })
}

/**
 * Prompt user to select which MCPs to install
 */
export async function selectMCPsStep(dockerAvailable: boolean): Promise<MCPSelection> {
  const selected: MCPId[] = []

  // Documentation MCP (single select)
  const docMCPs = getMCPsByCategory('documentation')
  const docOptions = buildMCPOptions(docMCPs, dockerAvailable)
  const docSelected = await select({
    message: 'Documentation MCP:',
    options: docOptions,
    initialValue: 'kappa' as MCPId,
  })
  selected.push(docSelected)

  // Development MCP (single select)
  const devMCPs = getMCPsByCategory('development')
  const devOptions = buildMCPOptions(devMCPs, dockerAvailable)
  const devSelected = await select({
    message: 'Development MCP:',
    options: devOptions,
    initialValue: 'vibekit' as MCPId,
  })
  selected.push(devSelected)

  return selected
}
