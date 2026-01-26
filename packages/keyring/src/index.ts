/**
 * Keyring Package
 *
 * OS keyring abstraction for storing secrets securely.
 * Supports macOS Keychain and Linux Secret Service API.
 */

export { createKeyringStore, isKeyringAvailable } from './keyring.js'
export type { SecretStore } from './types.js'
export {
  KEYRING_KEYS,
  ACCOUNT_KEY_PREFIX,
  accountMnemonicKey,
  accountPrivateKeyKey,
} from './types.js'
