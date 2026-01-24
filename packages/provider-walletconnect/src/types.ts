/**
 * WalletConnect Provider Types
 *
 * TypeScript types for WalletConnect integration.
 */

import type { SessionTypes } from '@walletconnect/types'

/**
 * WalletConnect chain IDs for Algorand networks.
 */
export const ALGORAND_CHAINS = {
  mainnet: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k', // 416001
  testnet: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe', // 416002
} as const

/**
 * Chain ID to network mapping.
 */
export const CHAIN_TO_NETWORK: Record<string, 'mainnet' | 'testnet'> = {
  [ALGORAND_CHAINS.mainnet]: 'mainnet',
  [ALGORAND_CHAINS.testnet]: 'testnet',
}

/**
 * Configuration for WalletConnect provider.
 */
export interface WalletConnectConfig {
  /** WalletConnect Project ID from cloud.walletconnect.com */
  projectId: string
  /** Target network ('mainnet' or 'testnet') */
  network: 'mainnet' | 'testnet'
  /** Config directory for session storage (default: ~/.config/vibekit) */
  configDir?: string
  /** Application metadata */
  metadata?: WalletConnectMetadata
}

/**
 * Application metadata for WalletConnect.
 */
export interface WalletConnectMetadata {
  name: string
  description: string
  url: string
  icons: string[]
}

/**
 * Default application metadata.
 */
export const DEFAULT_METADATA: WalletConnectMetadata = {
  name: 'VibeKit',
  description: 'AI-powered Algorand development toolkit',
  url: 'https://getvibekit.ai',
  icons: ['https://getvibekit.ai/icon.png'],
}

/**
 * Pairing result with QR code and URI.
 */
export interface PairingResult {
  /** WalletConnect URI for pairing */
  uri: string
  /** ASCII QR code representation */
  qrAscii: string
  /** QR code as data URL (PNG base64) */
  qrDataUrl: string
  /** Network hint message */
  networkHint: string
}

/**
 * Session status information.
 */
export interface SessionStatus {
  /** Whether a session is active */
  connected: boolean
  /** Wallet name (e.g., "Pera Wallet") */
  walletName?: string
  /** Connected accounts */
  accounts: SessionAccount[]
  /** Connected chain */
  chain?: string
  /** Session expiry timestamp */
  expiresAt?: number
}

/**
 * Account from WalletConnect session.
 */
export interface SessionAccount {
  /** Account name (e.g., "wallet-1") */
  name: string
  /** Algorand address */
  address: string
}

/**
 * Stored session data.
 */
export interface StoredSession {
  /** WalletConnect session topic */
  topic: string
  /** Session data */
  session: SessionTypes.Struct
  /** Timestamp when session was stored */
  storedAt: number
}

/**
 * Transaction to sign via WalletConnect.
 */
export interface WalletConnectTransaction {
  /** Base64-encoded unsigned transaction */
  txn: string
  /** Optional message to display in wallet */
  message?: string
  /** Optional list of signers (empty means don't sign) */
  signers?: string[]
}

/**
 * Signing timeout in milliseconds (2 minutes).
 */
export const SIGNING_TIMEOUT_MS = 120_000
