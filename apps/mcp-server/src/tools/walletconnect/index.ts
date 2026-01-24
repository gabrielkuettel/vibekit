/**
 * WalletConnect Tools
 *
 * Tools for managing WalletConnect sessions with mobile wallets.
 * Supports connecting to Pera Wallet, Defly, and other WalletConnect-compatible wallets.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext, type ToolRegistration } from '../types.js'
import { appState } from '../../state/index.js'

export const walletConnectTool: Tool = {
  name: 'walletconnect',
  description:
    'Manage WalletConnect session for mobile wallet signing (Pera, Defly). ' +
    'Use action=pair to show QR code for connecting. ' +
    'Use action=status to check connection. ' +
    'Use action=disconnect to end session.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['pair', 'status', 'disconnect'],
        description:
          'Action to perform: ' +
          'pair = show QR code to connect wallet; ' +
          'status = check connection status; ' +
          'disconnect = end session.',
      },
    },
    required: ['action'],
  },
}

interface WalletConnectArgs {
  action: 'pair' | 'status' | 'disconnect'
}

interface PairResult {
  action: 'pair'
  network: string
  networkHint: string
  uri: string
  qrCode: string
  instructions: string
}

interface StatusResult {
  action: 'status'
  connected: boolean
  walletName?: string
  chain?: string
  accounts: Array<{ name: string; address: string }>
  expiresAt?: string
}

interface DisconnectResult {
  action: 'disconnect'
  disconnected: boolean
  message: string
}

type WalletConnectResult = PairResult | StatusResult | DisconnectResult

export async function handleWalletConnect(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<WalletConnectResult> {
  const { action } = parseArgs<WalletConnectArgs>(args)
  const { config } = ctx

  // Check if we're on localnet (WalletConnect not supported)
  if (config.network === 'localnet') {
    throw new Error(
      'WalletConnect is not available on localnet.\n' +
        'Mobile wallets cannot connect to your local network.\n' +
        'Switch to testnet or mainnet: switch_network testnet'
    )
  }

  switch (action) {
    case 'pair':
      return handlePair(config.network as 'mainnet' | 'testnet')
    case 'status':
      return handleStatus()
    case 'disconnect':
      return handleDisconnect()
    default:
      throw new Error(`Unknown action: ${action}. Valid actions: pair, status, disconnect`)
  }
}

async function handlePair(network: 'mainnet' | 'testnet'): Promise<PairResult> {
  const provider = await appState.getWalletConnectProvider()
  const result = await provider.requestPairing()

  const networkName = network === 'mainnet' ? 'MainNet' : 'TestNet'

  return {
    action: 'pair',
    network: networkName,
    networkHint: result.networkHint,
    uri: result.uri,
    qrCode: result.qrAscii,
    instructions:
      `Scan this QR code with your mobile wallet (Pera, Defly).\n` +
      `${result.networkHint}\n\n` +
      `After scanning, use walletconnect action=status to verify the connection.`,
  }
}

async function handleStatus(): Promise<StatusResult> {
  const provider = await appState.getWalletConnectProvider()
  const status = provider.getSession()

  return {
    action: 'status',
    connected: status.connected,
    walletName: status.walletName,
    chain: status.chain,
    accounts: status.accounts,
    expiresAt: status.expiresAt ? new Date(status.expiresAt).toISOString() : undefined,
  }
}

async function handleDisconnect(): Promise<DisconnectResult> {
  const provider = await appState.getWalletConnectProvider()
  await provider.disconnect()

  return {
    action: 'disconnect',
    disconnected: true,
    message: 'WalletConnect session ended. Use walletconnect action=pair to reconnect.',
  }
}

export const walletConnectTools: ToolRegistration[] = [
  { definition: walletConnectTool, handler: handleWalletConnect },
]
