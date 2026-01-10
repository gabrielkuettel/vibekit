/**
 * Keyring Provider Package
 *
 * OS keyring-based account provider for Algorand key management.
 * Uses the native OS keyring (macOS Keychain, Linux libsecret) for secure storage.
 *
 * Security model:
 * - Keys are encrypted by the OS keyring
 * - Keys are loaded into memory for signing
 * - No Docker or external services required
 * - Simpler setup than Vault, but keys leave secure storage during signing
 */

export { KeyringProvider } from './provider.js'
export {
  generateKey,
  keyFromMnemonic,
  createSigner,
  encodePrivateKey,
  decodePrivateKey,
  addressFromPrivateKey,
} from './keys.js'
export type { GeneratedKey } from './keys.js'
