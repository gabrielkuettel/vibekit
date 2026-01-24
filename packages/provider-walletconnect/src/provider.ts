/**
 * WalletConnect Account Provider
 *
 * Implements AccountProvider using WalletConnect v2 for mobile wallet signing.
 * Supports Pera Wallet, Defly, and other WalletConnect-compatible wallets.
 *
 * Security model:
 * - Private keys never leave the mobile wallet
 * - Signing requests are sent via WalletConnect relay
 * - User must approve each transaction on their device
 *
 * Design:
 * - Cannot create accounts (accounts come from connected wallet)
 * - Session persisted to filesystem for reconnection
 * - Single session at a time (one wallet)
 */

import type { SignClientTypes, SessionTypes } from '@walletconnect/types'

// Dynamic import to handle bundler compatibility
async function getSignClient() {
  const mod = await import('@walletconnect/sign-client')
  // Handle both ESM and CJS exports
  return mod.SignClient ?? (mod as unknown as { default: { SignClient: unknown } }).default?.SignClient
}

/** Type for the SignClient instance */
type SignClientInstance = {
  session: { getAll(): SessionTypes.Struct[] }
  connect(params: {
    requiredNamespaces: Record<string, { chains: string[]; methods: string[]; events: string[] }>
  }): Promise<{ uri?: string; approval: () => Promise<SessionTypes.Struct> }>
  disconnect(params: { topic: string; reason: { code: number; message: string } }): Promise<void>
  request<T>(params: {
    topic: string
    chainId: string
    request: { method: string; params: unknown[] }
  }): Promise<T>
  on(
    event: 'session_delete',
    callback: (event: SignClientTypes.EventArguments['session_delete']) => void
  ): void
  on(
    event: 'session_expire',
    callback: (event: SignClientTypes.EventArguments['session_expire']) => void
  ): void
  on(
    event: 'session_update',
    callback: (event: SignClientTypes.EventArguments['session_update']) => void
  ): void
}
import type {
  AccountProvider,
  AccountInfo,
  AccountWithSigner,
  AccountProviderType,
} from '@vibekit/provider-interface'
import {
  NoSessionError,
  SessionExpiredError,
  CannotCreateAccountError,
  MissingProjectIdError,
  InitializationError,
} from './errors.js'
import { saveSession, loadSession, clearSession } from './session-store.js'
import { generateQR } from './qr-generator.js'
import { createWalletConnectSigner } from './signer.js'
import {
  ALGORAND_CHAINS,
  CHAIN_TO_NETWORK,
  DEFAULT_METADATA,
  type WalletConnectConfig,
  type PairingResult,
  type SessionStatus,
  type SessionAccount,
} from './types.js'

/**
 * WalletConnect-based account provider.
 *
 * Connects to mobile wallets (Pera, Defly) via WalletConnect v2.
 * Users scan a QR code to connect and approve transactions on their device.
 */
export class WalletConnectProvider implements AccountProvider {
  readonly type: AccountProviderType = 'walletconnect'

  private client: SignClientInstance | null = null
  private session: SessionTypes.Struct | null = null
  private config: WalletConnectConfig
  private initialized = false

  constructor(config: WalletConnectConfig) {
    if (!config.projectId) {
      throw new MissingProjectIdError()
    }
    this.config = config
  }

  /**
   * Initialize the WalletConnect SignClient and restore any existing session.
   * Must be called before using other methods.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      const SignClient = await getSignClient()
      this.client = (await SignClient.init({
        projectId: this.config.projectId,
        metadata: this.config.metadata ?? DEFAULT_METADATA,
      })) as SignClientInstance

      // Set up event handlers
      this.setupEventHandlers()

      // Try to restore existing session
      await this.restoreSession()

      this.initialized = true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new InitializationError(message)
    }
  }

  /**
   * Set up WalletConnect event handlers.
   */
  private setupEventHandlers(): void {
    if (!this.client) return

    // Handle session deletion (user disconnected from wallet)
    this.client.on(
      'session_delete',
      async (event: SignClientTypes.EventArguments['session_delete']) => {
        if (this.session?.topic === event.topic) {
          this.session = null
          await clearSession(this.config.configDir)
        }
      }
    )

    // Handle session expiry
    this.client.on(
      'session_expire',
      async (event: SignClientTypes.EventArguments['session_expire']) => {
        if (this.session?.topic === event.topic) {
          this.session = null
          await clearSession(this.config.configDir)
        }
      }
    )

    // Handle session update (accounts changed)
    this.client.on(
      'session_update',
      (event: SignClientTypes.EventArguments['session_update']) => {
        if (this.session?.topic === event.topic) {
          this.session = {
            ...this.session,
            namespaces: event.params.namespaces,
          }
          // Save updated session
          saveSession(this.session, this.config.configDir).catch(console.error)
        }
      }
    )
  }

  /**
   * Try to restore a session from the filesystem.
   */
  private async restoreSession(): Promise<void> {
    const storedSession = await loadSession(this.config.configDir)
    if (!storedSession) {
      return
    }

    // Verify the session still exists in the client
    if (this.client) {
      const activeSessions = this.client.session.getAll()
      const found = activeSessions.find(
        (s: SessionTypes.Struct) => s.topic === storedSession.topic
      )
      if (found) {
        this.session = found
      } else {
        // Session no longer valid, clear stored session
        await clearSession(this.config.configDir)
      }
    }
  }

  /**
   * Request a new pairing - generates QR code for wallet to scan.
   *
   * @returns Pairing result with QR codes and URI
   */
  async requestPairing(): Promise<PairingResult> {
    this.ensureInitialized()

    const chainId = ALGORAND_CHAINS[this.config.network]

    // Create connection request
    const { uri, approval } = await this.client!.connect({
      requiredNamespaces: {
        algorand: {
          chains: [chainId],
          methods: ['algo_signTxn'],
          events: [],
        },
      },
    })

    if (!uri) {
      throw new Error('Failed to generate WalletConnect URI')
    }

    // Generate QR codes
    const qr = await generateQR(uri)

    // Start waiting for approval in background
    this.waitForApproval(approval()).catch(console.error)

    const networkName = this.config.network === 'mainnet' ? 'MainNet' : 'TestNet'
    const networkHint = `Make sure your wallet is set to ${networkName} before scanning.`

    return {
      uri,
      qrAscii: qr.ascii,
      qrDataUrl: qr.dataUrl,
      networkHint,
    }
  }

  /**
   * Wait for session approval and save it.
   */
  private async waitForApproval(approval: Promise<SessionTypes.Struct>): Promise<void> {
    try {
      const session = await approval
      this.session = session
      await saveSession(session, this.config.configDir)
    } catch (error) {
      // User rejected or connection failed - session remains null
      console.error('WalletConnect pairing failed:', error)
    }
  }

  /**
   * Disconnect the current session.
   */
  async disconnect(): Promise<void> {
    this.ensureInitialized()

    if (this.session && this.client) {
      try {
        await this.client.disconnect({
          topic: this.session.topic,
          reason: {
            code: 6000,
            message: 'User disconnected',
          },
        })
      } catch {
        // Ignore disconnect errors - session may already be invalid
      }
    }

    this.session = null
    await clearSession(this.config.configDir)
  }

  /**
   * Get current session status.
   */
  getSession(): SessionStatus {
    if (!this.session) {
      return {
        connected: false,
        accounts: [],
      }
    }

    // Check if session has expired
    if (this.session.expiry && this.session.expiry * 1000 < Date.now()) {
      return {
        connected: false,
        accounts: [],
      }
    }

    const accounts = this.getAccountsFromSession()
    const walletName = this.session.peer?.metadata?.name

    // Get the chain from session namespaces
    const algorandNamespace = this.session.namespaces['algorand']
    const chain = algorandNamespace?.chains?.[0]

    return {
      connected: true,
      walletName,
      accounts,
      chain: chain ? CHAIN_TO_NETWORK[chain] : undefined,
      expiresAt: this.session.expiry ? this.session.expiry * 1000 : undefined,
    }
  }

  /**
   * Extract accounts from the current session.
   */
  private getAccountsFromSession(): SessionAccount[] {
    if (!this.session) {
      return []
    }

    const algorandNamespace = this.session.namespaces['algorand']
    if (!algorandNamespace?.accounts) {
      return []
    }

    // Accounts are in format "algorand:chainId:address"
    return algorandNamespace.accounts.map((account, index) => {
      const parts = account.split(':')
      const address = parts[parts.length - 1]
      return {
        name: `wallet-${index + 1}`,
        address,
      }
    })
  }

  /**
   * Ensure the provider has been initialized.
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.client) {
      throw new Error('WalletConnectProvider not initialized. Call initialize() first.')
    }
  }

  /**
   * Ensure there is an active session.
   */
  private ensureSession(): SessionTypes.Struct {
    if (!this.session) {
      throw new NoSessionError()
    }

    // Check expiry
    if (this.session.expiry && this.session.expiry * 1000 < Date.now()) {
      this.session = null
      throw new SessionExpiredError()
    }

    return this.session
  }

  // ============================================
  // AccountProvider interface implementation
  // ============================================

  /**
   * List all accounts from the connected wallet.
   */
  async listAccounts(): Promise<AccountInfo[]> {
    this.ensureInitialized()

    const accounts = this.getAccountsFromSession()
    return accounts.map((acc) => ({
      name: acc.name,
      address: acc.address,
    }))
  }

  /**
   * Create a new account.
   * NOT SUPPORTED - accounts come from the connected wallet.
   */
  async createAccount(_name: string): Promise<AccountInfo> {
    throw new CannotCreateAccountError()
  }

  /**
   * Get account by name.
   */
  async getAccount(name: string): Promise<AccountInfo | null> {
    this.ensureInitialized()

    const accounts = this.getAccountsFromSession()
    const account = accounts.find((acc) => acc.name === name)

    if (!account) {
      return null
    }

    return {
      name: account.name,
      address: account.address,
    }
  }

  /**
   * Get an account with signer.
   */
  async getAccountWithSigner(accountName: string): Promise<AccountWithSigner> {
    this.ensureInitialized()
    this.ensureSession()

    const accounts = this.getAccountsFromSession()
    const account = accounts.find((acc) => acc.name === accountName)

    if (!account) {
      throw new Error(`Account not found: ${accountName}`)
    }

    const signer = createWalletConnectSigner(
      this.client!,
      () => this.session,
      this.config.network
    )

    return {
      address: account.address,
      signer,
    }
  }

  /**
   * Check if the provider is available (has active session).
   */
  async isAvailable(): Promise<boolean> {
    if (!this.initialized) {
      return false
    }

    if (!this.session) {
      return false
    }

    // Check expiry
    if (this.session.expiry && this.session.expiry * 1000 < Date.now()) {
      return false
    }

    return true
  }
}
