/**
 * Pera Wallet Implementation
 *
 * WalletConnect v1 implementation for Pera Wallet.
 * Uses Pera's bridge infrastructure for mobile wallet connections.
 */

import WalletConnectModule from '@walletconnect/client'
import type { IConnector, IClientMeta, IWalletConnectOptions } from '@walletconnect/types'
import type { TransactionSigner } from 'algosdk'
import type { AccountInfo, WalletId } from '@vibekit/provider-interface'
import type {
  WalletImplementation,
  WalletConfig,
  PairingRequest,
  StoredSession,
  PeraConfig,
} from '../types.js'
import {
  ALGORAND_CHAIN_IDS,
  PERA_CONFIG_URL,
  DEFAULT_METADATA,
  CHAIN_ID_TO_NETWORK,
} from '../types.js'
import { saveSession, loadSession, clearSession } from '../session-store.js'
import { generateQR } from '../qr-generator.js'
import { createWalletConnectSigner } from '../signer.js'
import { BridgeFetchError, InitializationError, NoSessionError } from '../errors.js'

// Handle both ESM and CJS module formats
const WalletConnect =
  (WalletConnectModule as { default?: new (opts: IWalletConnectOptions) => IConnector }).default ??
  (WalletConnectModule as new (opts: IWalletConnectOptions) => IConnector)

/**
 * Fetch bridge URL from Pera's config endpoint.
 */
async function fetchBridgeUrl(): Promise<string> {
  try {
    const response = await fetch(PERA_CONFIG_URL)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const config = (await response.json()) as PeraConfig
    if (!config.servers || config.servers.length === 0) {
      throw new Error('No bridge servers in config')
    }
    return config.servers[0]
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new BridgeFetchError(message)
  }
}

/**
 * Convert metadata to WalletConnect's IClientMeta format.
 */
function toClientMeta(metadata: typeof DEFAULT_METADATA): IClientMeta {
  return {
    name: metadata.name,
    description: metadata.description,
    url: metadata.url,
    icons: metadata.icons,
  }
}

/**
 * Pera Wallet implementation using WalletConnect v1.
 */
export class PeraWallet implements WalletImplementation {
  readonly id: WalletId = 'pera'
  readonly name = 'Pera Wallet'
  readonly icon = 'https://perawallet.app/icon.png'

  private connector: IConnector | null = null
  private accounts: AccountInfo[] = []
  private config: WalletConfig | null = null
  private bridgeUrl: string | null = null
  private initialized = false

  async initialize(config: WalletConfig): Promise<void> {
    if (this.initialized) return

    this.config = config

    try {
      // Get bridge URL (from config or fetch from Pera)
      this.bridgeUrl = config.bridgeUrl ?? (await fetchBridgeUrl())

      // Try to restore existing session
      const storedSession = await loadSession('pera')
      if (storedSession) {
        const clientMeta = toClientMeta(config.metadata ?? DEFAULT_METADATA)
        this.connector = new WalletConnect({
          bridge: storedSession.bridge,
          session: {
            connected: true,
            accounts: storedSession.accounts,
            chainId: storedSession.chainId,
            bridge: storedSession.bridge,
            key: storedSession.key,
            clientId: storedSession.clientId,
            clientMeta,
            peerId: storedSession.peerId,
            peerMeta: storedSession.peerMeta ? toClientMeta(storedSession.peerMeta) : null,
            handshakeId: storedSession.handshakeId,
            handshakeTopic: storedSession.handshakeTopic,
          },
          clientMeta,
        })

        // Extract accounts from restored session
        this.accounts = storedSession.accounts.map((address, index) => ({
          name: `pera-${index + 1}`,
          address,
        }))

        // Set up event handlers
        this.setupEventHandlers()
      }

      this.initialized = true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new InitializationError(message)
    }
  }

  private setupEventHandlers(): void {
    if (!this.connector) return

    // Handle disconnect
    this.connector.on('disconnect', async () => {
      this.connector = null
      this.accounts = []
      await clearSession('pera')
    })

    // Handle session update (accounts changed)
    this.connector.on(
      'session_update',
      async (
        error: Error | null,
        payload: { params: Array<{ accounts: string[]; chainId: number }> } | null
      ) => {
        if (error) return

        if (this.connector && payload?.params[0]?.accounts) {
          const addresses = payload.params[0].accounts
          this.accounts = addresses.map((address, index) => ({
            name: `pera-${index + 1}`,
            address,
          }))
          await this.saveCurrentSession()
        }
      }
    )
  }

  private async saveCurrentSession(): Promise<void> {
    if (!this.connector?.connected || !this.config) return

    const session = this.connector.session
    const storedSession: Omit<StoredSession, 'walletId' | 'storedAt'> = {
      bridge: session.bridge,
      key: session.key,
      clientId: session.clientId,
      peerId: session.peerId,
      peerMeta: session.peerMeta
        ? {
            name: session.peerMeta.name,
            description: session.peerMeta.description,
            url: session.peerMeta.url,
            icons: session.peerMeta.icons,
          }
        : undefined,
      accounts: session.accounts,
      chainId: session.chainId,
      handshakeTopic: session.handshakeTopic,
      handshakeId: session.handshakeId,
    }
    await saveSession('pera', storedSession)
  }

  async hasSession(): Promise<boolean> {
    const session = await loadSession('pera')
    return session !== null
  }

  async resumeSession(): Promise<AccountInfo[]> {
    if (!this.connector?.connected) {
      return []
    }

    const addresses = this.connector.accounts
    if (!addresses || addresses.length === 0) {
      return []
    }

    this.accounts = addresses.map((address: string, index: number) => ({
      name: `pera-${index + 1}`,
      address,
    }))

    return this.accounts
  }

  async requestPairing(): Promise<PairingRequest> {
    if (!this.config || !this.bridgeUrl) {
      throw new InitializationError('Pera wallet not initialized')
    }

    const chainId = ALGORAND_CHAIN_IDS[this.config.network]
    const clientMeta = toClientMeta(this.config.metadata ?? DEFAULT_METADATA)

    // Create new connector for pairing
    this.connector = new WalletConnect({
      bridge: this.bridgeUrl,
      clientMeta,
    })

    // Set up event handlers
    this.setupEventHandlers()

    // Create session (generates URI)
    if (!this.connector.connected) {
      await this.connector.createSession({ chainId })
    }

    const uri = this.connector.uri
    if (!uri) {
      throw new InitializationError('Failed to generate WalletConnect URI')
    }

    // Generate QR codes
    const qr = await generateQR(uri)

    // Create approval promise that resolves when pairing completes
    const approval = new Promise<{
      walletId: WalletId
      walletName: string
      accounts: AccountInfo[]
      network: 'mainnet' | 'testnet'
    }>((resolve, reject) => {
      this.connector!.on('connect', async (error: Error | null) => {
        if (error) {
          reject(error)
          return
        }

        // Session established, save it
        await this.saveCurrentSession()

        const addresses = this.connector!.accounts
        this.accounts = addresses.map((address: string, index: number) => ({
          name: `pera-${index + 1}`,
          address,
        }))

        const connectedChainId = this.connector!.chainId
        const network = CHAIN_ID_TO_NETWORK[connectedChainId] || 'testnet'

        resolve({
          walletId: 'pera',
          walletName: this.name,
          accounts: this.accounts,
          network,
        })
      })

      this.connector!.on('disconnect', () => {
        reject(new NoSessionError('Connection was rejected or closed'))
      })
    })

    const networkName = this.config.network === 'mainnet' ? 'MainNet' : 'TestNet'

    return {
      uri,
      qrAscii: qr.ascii,
      qrDataUrl: qr.dataUrl,
      instructions: `Open Pera Wallet on ${networkName} and scan this QR code to connect.`,
      approval,
    }
  }

  getAccounts(): AccountInfo[] {
    return this.accounts
  }

  createSigner(address: string): TransactionSigner {
    if (!this.connector?.connected) {
      throw new NoSessionError()
    }

    // Verify the address belongs to this session
    const account = this.accounts.find((a) => a.address === address)
    if (!account) {
      throw new Error(`Address ${address} not found in connected accounts`)
    }

    return createWalletConnectSigner(this.connector)
  }

  async disconnect(): Promise<void> {
    if (this.connector?.connected) {
      try {
        await this.connector.killSession()
      } catch {
        // Ignore disconnect errors - session may already be invalid
      }
    }

    this.connector = null
    this.accounts = []
    await clearSession('pera')
  }
}
