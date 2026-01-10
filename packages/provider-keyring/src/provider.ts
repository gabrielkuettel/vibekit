/**
 * Keyring Account Provider
 *
 * Implements AccountProvider using the OS keyring for key storage.
 * Private keys are stored encrypted by the OS keyring (macOS Keychain, Linux libsecret).
 *
 * Security model:
 * - Keys are stored encrypted by the OS
 * - Keys are loaded into memory for signing (less secure than Vault)
 * - No Docker or external services required
 *
 * Design: This provider is a pure key manager. It does NOT query network
 * state (balances, etc.). The MCP handler queries balances using a fresh
 * AlgorandClient.
 *
 * State storage:
 * - All account data is stored in keyring entries (no external files)
 * - account:{name}:mnemonic → mnemonic phrase
 * - account:{name}:privateKey → encoded private key
 * - account:{name}:metadata → JSON with name, address, createdAt
 */

import type {
  AccountProvider,
  AccountInfo,
  AccountWithSigner,
  AccountProviderType,
} from '@vibekit/provider-interface'
import {
  createKeyringStore,
  accountMnemonicKey,
  accountPrivateKeyKey,
  accountMetadataKey,
  ACCOUNT_KEY_PREFIX,
  type SecretStore,
} from '@vibekit/keyring'
import {
  generateKey,
  keyFromMnemonic,
  createSigner,
  encodePrivateKey,
  decodePrivateKey,
  addressFromPrivateKey,
} from './keys.js'

/**
 * Account metadata stored in keyring.
 */
interface AccountMetadata {
  name: string
  address: string
  createdAt: string
}

/**
 * Keyring-based account provider.
 *
 * Uses the OS keyring to store:
 * - Mnemonics (for CLI display/backup)
 * - Private keys (for fast signing)
 * - Metadata (name, address, createdAt)
 *
 * All state is in keyring entries - no external files needed.
 */
export class KeyringProvider implements AccountProvider {
  readonly type: AccountProviderType = 'keyring'

  private keyring: SecretStore

  constructor() {
    this.keyring = createKeyringStore()
  }

  /**
   * List all accounts.
   * Scans keyring for metadata entries to discover accounts.
   */
  async listAccounts(): Promise<AccountInfo[]> {
    const metadataKeys = await this.keyring.findKeys(ACCOUNT_KEY_PREFIX)
    const metadataEntries = metadataKeys.filter((key) => key.endsWith(':metadata'))

    const accounts: AccountInfo[] = []
    for (const key of metadataEntries) {
      const metadataJson = await this.keyring.get(key)
      if (metadataJson) {
        try {
          const metadata = JSON.parse(metadataJson) as AccountMetadata
          accounts.push({
            name: metadata.name,
            address: metadata.address,
          })
        } catch {
          // Skip entries with malformed JSON metadata
        }
      }
    }

    return accounts
  }

  /**
   * Create a new account.
   * Does NOT fund the account - use fund_account tool for that.
   *
   * @param name - Account name
   */
  async createAccount(name: string): Promise<AccountInfo> {
    const existingMetadata = await this.keyring.get(accountMetadataKey(name))
    if (existingMetadata) {
      const metadata = JSON.parse(existingMetadata) as AccountMetadata
      return {
        name: metadata.name,
        address: metadata.address,
        isNew: false,
      }
    }

    const key = generateKey()

    await this.keyring.set(accountMnemonicKey(name), key.mnemonic)
    await this.keyring.set(accountPrivateKeyKey(name), encodePrivateKey(key.privateKey))

    const metadata: AccountMetadata = {
      name,
      address: key.address,
      createdAt: new Date().toISOString(),
    }
    await this.keyring.set(accountMetadataKey(name), JSON.stringify(metadata))

    return {
      name,
      address: key.address,
      isNew: true,
    }
  }

  /**
   * Get account by name.
   */
  async getAccount(name: string): Promise<AccountInfo | null> {
    const metadataJson = await this.keyring.get(accountMetadataKey(name))
    if (!metadataJson) return null

    try {
      const metadata = JSON.parse(metadataJson) as AccountMetadata
      return {
        name: metadata.name,
        address: metadata.address,
      }
    } catch {
      return null
    }
  }

  /**
   * Get account with signer.
   */
  async getAccountWithSigner(accountName: string): Promise<AccountWithSigner> {
    const encodedKey = await this.keyring.get(accountPrivateKeyKey(accountName))
    if (!encodedKey) {
      throw new Error(`Account not found in keyring: ${accountName}`)
    }

    const privateKey = decodePrivateKey(encodedKey)
    const address = addressFromPrivateKey(privateKey)
    const signer = createSigner(privateKey)

    return {
      address,
      signer,
    }
  }

  /**
   * Get the mnemonic for an account.
   * Used by CLI for display/backup purposes.
   */
  async getMnemonic(name: string): Promise<string | null> {
    return this.keyring.get(accountMnemonicKey(name))
  }

  /**
   * Get account metadata.
   * Returns name, address, createdAt.
   */
  async getAccountMetadata(name: string): Promise<AccountMetadata | null> {
    const metadataJson = await this.keyring.get(accountMetadataKey(name))
    if (!metadataJson) return null

    try {
      return JSON.parse(metadataJson) as AccountMetadata
    } catch {
      return null
    }
  }

  /**
   * Import an account from a mnemonic.
   *
   * @param name - Account name
   * @param mnemonic - 25-word Algorand mnemonic
   */
  async importAccount(name: string, mnemonic: string): Promise<AccountInfo> {
    const existingMetadata = await this.keyring.get(accountMetadataKey(name))
    if (existingMetadata) {
      throw new Error(`Account already exists: ${name}`)
    }

    const key = keyFromMnemonic(mnemonic)

    await this.keyring.set(accountMnemonicKey(name), key.mnemonic)
    await this.keyring.set(accountPrivateKeyKey(name), encodePrivateKey(key.privateKey))

    const metadata: AccountMetadata = {
      name,
      address: key.address,
      createdAt: new Date().toISOString(),
    }
    await this.keyring.set(accountMetadataKey(name), JSON.stringify(metadata))

    return {
      name,
      address: key.address,
      isNew: true,
    }
  }

  /**
   * Remove an account.
   */
  async removeAccount(name: string): Promise<void> {
    await this.keyring.delete(accountMnemonicKey(name))
    await this.keyring.delete(accountPrivateKeyKey(name))
    await this.keyring.delete(accountMetadataKey(name))
  }

  /**
   * Check if the provider is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.keyring.has('__check__')
      return true
    } catch {
      return false
    }
  }
}
