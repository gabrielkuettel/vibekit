/**
 * switch_network tool
 *
 * Switches the MCP server to a different Algorand network.
 * Supports localnet, testnet, and mainnet with configurable endpoints.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { appState, type NetworkType, type NetworkPreset } from '../../state/index.js'
import { parseArgs, type ToolContext } from '../types.js'

export const switchNetworkTool: Tool = {
  name: 'switch_network',
  description:
    'Switch to a different Algorand network (localnet, testnet, mainnet). ' +
    'Uses Nodely free tier endpoints by default for testnet/mainnet. ' +
    'Custom endpoints can be provided to override defaults.',
  inputSchema: {
    type: 'object',
    properties: {
      network: {
        type: 'string',
        enum: ['localnet', 'testnet', 'mainnet'],
        description: 'Target network to switch to.',
      },
      algodServer: {
        type: 'string',
        description: 'Custom algod URL (optional, uses Nodely defaults for testnet/mainnet).',
      },
      indexerServer: {
        type: 'string',
        description: 'Custom indexer URL (optional).',
      },
    },
    required: ['network'],
  },
}

interface SwitchNetworkArgs {
  network: string
  algodServer?: string
  indexerServer?: string
}

export async function handleSwitchNetwork(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{
  success: boolean
  previousNetwork: string
  currentNetwork: string
  algodServer: string
  indexerServer?: string
  kmdServer?: string
  clearedWallet: string | null
  warnings: string[]
}> {
  const typedArgs = parseArgs<SwitchNetworkArgs>(args)
  const { network, algodServer, indexerServer } = typedArgs

  const validNetworks: NetworkType[] = ['localnet', 'testnet', 'mainnet']
  if (!validNetworks.includes(network as NetworkType)) {
    throw new Error(`Invalid network: ${network}. Valid options: ${validNetworks.join(', ')}`)
  }

  let previousNetwork: string
  try {
    previousNetwork = appState.getNetwork().network
  } catch {
    previousNetwork = 'uninitialized'
  }

  const overrides: Partial<NetworkPreset> = {}
  if (algodServer) {
    overrides.algodServer = algodServer
  }
  if (indexerServer) {
    overrides.indexerServer = indexerServer
  }

  const { config: newConfig, clearedWallet } = appState.switchNetwork(
    network as NetworkType,
    overrides
  )

  // Collect warnings
  const warnings: string[] = []

  // Add warning if account was deselected
  if (clearedWallet) {
    warnings.push(
      `Active account "${clearedWallet}" was deselected (network changed to ${network}). ` +
        `Use switch_account to reselect it for this network.`
    )
  }

  if (network !== 'localnet') {
    // Check for provider availability
    if (!appState.isProviderAvailable()) {
      warnings.push(
        `No account provider available. Signing operations will fail on ${network}. ` +
          `Run: vibekit init`
      )
    } else if (!appState.getActiveAccount()) {
      warnings.push(`No account selected. Use switch_account to select an account for signing.`)
    }

    // Check for dispenser token on testnet
    if (network === 'testnet' && !appState.isDispenserTokenConfigured()) {
      warnings.push(
        `TestNet dispenser not configured. fund_account will fail. ` +
          `Run: vibekit dispenser login`
      )
    }
  }

  return {
    success: true,
    previousNetwork,
    currentNetwork: newConfig.network,
    algodServer: newConfig.algodServer,
    indexerServer: newConfig.indexerServer,
    kmdServer: newConfig.kmdServer,
    clearedWallet,
    warnings,
  }
}
