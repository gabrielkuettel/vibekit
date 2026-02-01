/**
 * Wallet Provider Types
 *
 * Type definitions for the modular wallet provider system.
 */

import type { TransactionSigner } from 'algosdk'
import type { AccountInfo, WalletId } from '@vibekit/provider-interface'

/**
 * WalletConnect chain IDs for Algorand networks.
 */
export const ALGORAND_CHAIN_IDS = {
  mainnet: 416001,
  testnet: 416002,
} as const

/**
 * Chain ID to network mapping.
 */
export const CHAIN_ID_TO_NETWORK: Record<number, 'mainnet' | 'testnet'> = {
  [ALGORAND_CHAIN_IDS.mainnet]: 'mainnet',
  [ALGORAND_CHAIN_IDS.testnet]: 'testnet',
}

/**
 * Pera Wallet config endpoint for getting bridge URLs.
 */
export const PERA_CONFIG_URL = 'https://wc.perawallet.app/config.json'

/**
 * Signing timeout in milliseconds (2 minutes).
 */
export const SIGNING_TIMEOUT_MS = 120_000

/**
 * Default application metadata for WalletConnect.
 */
export const DEFAULT_METADATA: WalletMetadata = {
  name: 'VibeKit',
  description: 'AI-powered Algorand development toolkit',
  url: 'https://getvibekit.ai',
  icons: ['https://getvibekit.ai/icon.png'],
}

/**
 * Application metadata for WalletConnect.
 */
export interface WalletMetadata {
  name: string
  description: string
  url: string
  icons: string[]
}

/**
 * Configuration for wallet providers.
 */
export interface WalletConfig {
  /** Network to connect to */
  network: 'mainnet' | 'testnet'
  /** Directory for session persistence */
  configDir?: string
  /** Application metadata */
  metadata?: WalletMetadata
  /** Custom bridge URL (optional) */
  bridgeUrl?: string
}

/**
 * Pairing request returned when initiating wallet connection.
 */
export interface PairingRequest {
  /** URI for wallet to scan/open */
  uri: string
  /** ASCII art QR code */
  qrAscii: string
  /** Base64 PNG data URL of QR code */
  qrDataUrl: string
  /** Human-readable instructions */
  instructions: string
  /** Promise that resolves when pairing completes */
  approval: Promise<PairingResult>
}

/**
 * Result after successful pairing.
 */
export interface PairingResult {
  walletId: WalletId
  walletName: string
  accounts: AccountInfo[]
  network: 'mainnet' | 'testnet'
}

/**
 * Stored session data for persistence.
 */
export interface StoredSession {
  /** Wallet ID that created this session */
  walletId: WalletId
  /** Bridge URL */
  bridge: string
  /** Session key for encryption */
  key: string
  /** This client's ID */
  clientId: string
  /** Peer's client ID */
  peerId: string
  /** Peer's metadata */
  peerMeta?: WalletMetadata
  /** Connected accounts (Algorand addresses) */
  accounts: string[]
  /** Chain ID */
  chainId: number
  /** Handshake topic */
  handshakeTopic: string
  /** Handshake ID */
  handshakeId: number
  /** Timestamp when session was stored */
  storedAt: number
}

/**
 * Pera config response structure.
 */
export interface PeraConfig {
  servers: string[]
}

/**
 * Transaction to sign via WalletConnect.
 */
export interface WalletConnectTransaction {
  /** Base64-encoded unsigned transaction */
  txn: string
  /** Optional message to display in wallet */
  message?: string
  /** Optional list of signers (empty array means don't sign) */
  signers?: string[]
}

/**
 * Wallet implementation interface.
 * Each wallet (Pera, Defly, etc.) implements this.
 */
export interface WalletImplementation {
  readonly id: WalletId
  readonly name: string
  readonly icon?: string

  /** Initialize the wallet client */
  initialize(config: WalletConfig): Promise<void>

  /** Check if session exists */
  hasSession(): Promise<boolean>

  /** Resume existing session */
  resumeSession(): Promise<AccountInfo[]>

  /** Start new pairing flow */
  requestPairing(): Promise<PairingRequest>

  /** Get current accounts */
  getAccounts(): AccountInfo[]

  /** Create transaction signer for account */
  createSigner(address: string): TransactionSigner

  /** Disconnect and clear session */
  disconnect(): Promise<void>
}
