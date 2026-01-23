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
  value: MCPId | 'skip'
  label: string
  hint?: string
}

function buildMCPOptions(
  mcps: MCPDefinition[],
  dockerAvailable: boolean,
  includeSkip: boolean = false
): MCPOption[] {
  const options: MCPOption[] = mcps.map((mcp) => {
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

  if (includeSkip) {
    options.push({
      value: 'skip',
      label: pc.dim('Skip'),
      hint: 'Do not configure this MCP',
    })
  }

  return options
}

/**
 * Prompt user to select which MCPs to install
 */
export async function selectMCPsStep(dockerAvailable: boolean): Promise<MCPSelection> {
  const selected: MCPId[] = []

  // Documentation MCP (single select with skip option)
  const docMCPs = getMCPsByCategory('documentation')
  const docOptions = buildMCPOptions(docMCPs, dockerAvailable, true)
  const docSelected = await select({
    message: 'Documentation MCP:',
    options: docOptions,
    initialValue: 'kappa' as MCPId | 'skip',
  })
  if (docSelected !== 'skip') {
    selected.push(docSelected as MCPId)
  }

  // Development MCP (single select with skip option)
  const devMCPs = getMCPsByCategory('development')
  const devOptions = buildMCPOptions(devMCPs, dockerAvailable, true)
  const devSelected = await select({
    message: 'Development MCP:',
    options: devOptions,
    initialValue: 'vibekit' as MCPId | 'skip',
  })
  if (devSelected !== 'skip') {
    selected.push(devSelected as MCPId)
  }

  return selected
}
