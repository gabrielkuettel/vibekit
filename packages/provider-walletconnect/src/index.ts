/**
 * WalletConnect Provider Package
 *
 * Mobile wallet signing via WalletConnect v2.
 * Connects to Pera Wallet, Defly, and other WalletConnect-compatible wallets.
 *
 * Security model:
 * - Private keys never leave the mobile wallet
 * - User approves each transaction on their device
 * - Session data persisted locally for reconnection
 */

export { WalletConnectProvider } from './provider.js'
export {
  WalletConnectError,
  NoSessionError,
  SessionExpiredError,
  SigningRejectedError,
  SigningTimeoutError,
  MissingProjectIdError,
  CannotCreateAccountError,
  InitializationError,
} from './errors.js'
export {
  ALGORAND_CHAINS,
  CHAIN_TO_NETWORK,
  DEFAULT_METADATA,
  SIGNING_TIMEOUT_MS,
  type WalletConnectConfig,
  type WalletConnectMetadata,
  type PairingResult,
  type SessionStatus,
  type SessionAccount,
  type WalletConnectTransaction,
} from './types.js'
export { generateQR, type GeneratedQR } from './qr-generator.js'
export { saveSession, loadSession, clearSession, hasSession } from './session-store.js'
export { createWalletConnectSigner } from './signer.js'
