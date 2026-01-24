/**
 * WalletConnect Errors
 *
 * Custom error types for WalletConnect operations.
 */

/**
 * Base error class for WalletConnect operations.
 */
export class WalletConnectError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly hint?: string
  ) {
    super(message)
    this.name = 'WalletConnectError'
  }
}

/**
 * Error thrown when no session exists.
 */
export class NoSessionError extends WalletConnectError {
  constructor() {
    super(
      'No WalletConnect session. Scan the QR code with your mobile wallet to connect.',
      'NO_SESSION',
      'Use walletconnect action=pair to generate a QR code.'
    )
    this.name = 'NoSessionError'
  }
}

/**
 * Error thrown when session has expired.
 */
export class SessionExpiredError extends WalletConnectError {
  constructor() {
    super(
      'WalletConnect session has expired. Please reconnect.',
      'SESSION_EXPIRED',
      'Use walletconnect action=pair to generate a new QR code.'
    )
    this.name = 'SessionExpiredError'
  }
}

/**
 * Error thrown when user rejects signing request.
 */
export class SigningRejectedError extends WalletConnectError {
  constructor() {
    super(
      'Transaction signing was rejected in the wallet.',
      'SIGNING_REJECTED',
      'The user declined to sign the transaction in their mobile wallet.'
    )
    this.name = 'SigningRejectedError'
  }
}

/**
 * Error thrown when signing times out.
 */
export class SigningTimeoutError extends WalletConnectError {
  constructor(timeoutMs: number) {
    super(
      `Transaction signing timed out after ${timeoutMs / 1000} seconds.`,
      'SIGNING_TIMEOUT',
      'Open your mobile wallet and approve or reject the transaction.'
    )
    this.name = 'SigningTimeoutError'
  }
}

/**
 * Error thrown when WalletConnect Project ID is missing.
 */
export class MissingProjectIdError extends WalletConnectError {
  constructor() {
    super(
      'WalletConnect Project ID is not configured.',
      'MISSING_PROJECT_ID',
      'Set WALLETCONNECT_PROJECT_ID environment variable. Get one at https://cloud.walletconnect.com'
    )
    this.name = 'MissingProjectIdError'
  }
}

/**
 * Error thrown when trying to create an account (not supported).
 */
export class CannotCreateAccountError extends WalletConnectError {
  constructor() {
    super(
      'Cannot create accounts with WalletConnect. Accounts come from your connected wallet.',
      'CANNOT_CREATE_ACCOUNT',
      'Connect your mobile wallet using walletconnect action=pair.'
    )
    this.name = 'CannotCreateAccountError'
  }
}

/**
 * Error thrown for initialization failures.
 */
export class InitializationError extends WalletConnectError {
  constructor(cause: string) {
    super(
      `Failed to initialize WalletConnect: ${cause}`,
      'INITIALIZATION_FAILED',
      'Check your network connection and WalletConnect Project ID.'
    )
    this.name = 'InitializationError'
  }
}
