/**
 * get_network tool
 *
 * Returns the currently active network configuration.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { appState, NETWORK_PRESETS } from '../../state/index.js'
import type { ToolContext } from '../types.js'

export const getNetworkTool: Tool = {
  name: 'get_network',
  description:
    'Get the currently active Algorand network and connection information. ' +
    'Shows algod, indexer, and KMD endpoints, plus signing capability status.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
}

export async function handleGetNetwork(
  _args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{
  network: string
  algodServer: string
  indexerServer?: string
  kmdServer?: string
  isLocalnet: boolean
  canSign: boolean
  signingMethod: string
  canFund: boolean
  fundingMethod: string
  availableNetworks: string[]
}> {
  const config = appState.getNetwork()
  const activeAccount = appState.getActiveAccount()
  const isProviderAvailable = appState.isProviderAvailable()
  const activeAccountProvider = appState.getActiveAccountProvider()
  const isDispenserConfigured = appState.isDispenserTokenConfigured()

  // Provider label for display (capitalize first letter)
  const providerLabel = activeAccountProvider
    ? activeAccountProvider.charAt(0).toUpperCase() + activeAccountProvider.slice(1)
    : 'Provider'

  // Determine signing capability
  let canSign: boolean
  let signingMethod: string

  if (config.network === 'localnet') {
    // Localnet: can always sign (dispenser fallback)
    canSign = true
    signingMethod = activeAccount
      ? `${providerLabel} account: ${activeAccount}`
      : 'KMD dispenser (default)'
  } else if (isProviderAvailable && activeAccount) {
    // Testnet/mainnet with account selected
    canSign = true
    signingMethod = `${providerLabel} account: ${activeAccount}`
  } else if (isProviderAvailable) {
    // Provider available but no account selected
    canSign = false
    signingMethod = `${providerLabel} available, but no account selected (use switch_account)`
  } else {
    // No provider
    canSign = false
    signingMethod = 'No signing method configured (use vibekit init)'
  }

  // Determine funding capability
  let canFund: boolean
  let fundingMethod: string

  if (config.network === 'localnet') {
    canFund = true
    fundingMethod = 'KMD dispenser'
  } else if (config.network === 'testnet') {
    canFund = isDispenserConfigured
    fundingMethod = isDispenserConfigured
      ? 'AlgoKit TestNet Dispenser API'
      : 'Not configured (run: vibekit dispenser login)'
  } else {
    // Mainnet
    canFund = false
    fundingMethod = 'Not available on mainnet'
  }

  return {
    network: config.network,
    algodServer: config.algodServer,
    indexerServer: config.indexerServer,
    kmdServer: config.kmdServer,
    isLocalnet: config.network === 'localnet',
    canSign,
    signingMethod,
    canFund,
    fundingMethod,
    availableNetworks: Object.keys(NETWORK_PRESETS),
  }
}
