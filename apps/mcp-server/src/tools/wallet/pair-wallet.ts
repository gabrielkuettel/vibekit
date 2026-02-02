/**
 * Pair Wallet Tool
 *
 * Connect to a mobile wallet (Pera, Defly, etc.) via QR code.
 */

import type { ToolRegistration } from '../types.js'
import { appState } from '../../state/index.js'
import type { WalletId } from '@vibekit/provider-interface'

interface PairWalletArgs {
  wallet?: WalletId
}

export const pairWalletTool: ToolRegistration = {
  definition: {
    name: 'pair_wallet',
    description:
      'Connect to a mobile wallet (Pera, Defly, etc.) via QR code. ' +
      'Returns a QR code to scan with your mobile wallet app. ' +
      'Only available on testnet/mainnet (not localnet).',
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          enum: ['pera'],
          description: 'Wallet to connect to (default: pera)',
        },
      },
    },
  },
  handler: async (args: Record<string, unknown>) => {
    const { wallet = 'pera' } = args as PairWalletArgs

    // Get or create wallet provider
    const walletProvider = await appState.getWalletProvider(wallet)

    // Check if already connected
    if (await walletProvider.hasSession()) {
      const status = await walletProvider.getStatus()
      if (status.ready && status.connection) {
        return {
          success: true,
          message: `Already connected to ${status.connection.walletName}`,
          accounts: status.connection.accounts.map((a) => ({
            name: a.name,
            address: a.address,
          })),
          hint: 'Use disconnect_wallet to disconnect and pair with a different wallet.',
        }
      }
    }

    // Request new pairing
    const pairingRequest = await walletProvider.requestPairing()

    // Return QR code and instructions
    const result = {
      success: true,
      message: `Scan this QR code with ${wallet === 'pera' ? 'Pera Wallet' : wallet} to connect`,
      qrCode: pairingRequest.qrAscii,
      uri: pairingRequest.uri,
      instructions: [
        `1. Open ${wallet === 'pera' ? 'Pera Wallet' : wallet} on your mobile device`,
        '2. Tap the scan/connect button',
        '3. Scan the QR code above',
        '4. Approve the connection request',
      ],
      hint: 'The connection will be saved and can be reused in future sessions.',
    }

    // Wait for approval in background (non-blocking)
    // The actual approval happens when the user scans and approves
    pairingRequest.approval
      .then(async (pairingResult) => {
        // Set first account as active
        if (pairingResult.accounts.length > 0) {
          appState.setActiveAccount(pairingResult.accounts[0].name, 'wallet')
        }
      })
      .catch(() => {
        // Pairing failed or timed out - handled silently
      })

    return result
  },
}
