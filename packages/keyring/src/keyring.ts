/**
 * Keyring Implementation
 *
 * Cross-platform keyring operations using @napi-rs/keyring.
 * Supports macOS Keychain, Linux Secret Service, and Windows Credential Manager.
 */

import type { SecretStore } from './types.js'

const SERVICE = 'vibekit'

const KEYRING_UNAVAILABLE_MESSAGE =
  'Keyring not available. Headless systems should use the Vault provider instead.'

function rethrowKeyringError(error: unknown): never {
  if (error instanceof Error && error.message.includes('secret-tool')) {
    throw new Error(KEYRING_UNAVAILABLE_MESSAGE)
  }
  throw error
}

/**
 * Create a SecretStore backed by the OS keyring.
 *
 * Uses:
 * - macOS: Keychain
 * - Linux: Secret Service API (GNOME Keyring, KWallet, etc.)
 * - Windows: Credential Manager
 *
 * @throws Error if keyring is not available (e.g., headless Linux)
 */
export function createKeyringStore(): SecretStore {
  // Lazy load keyring to avoid issues if keyring is unavailable
  let keyringModule: typeof import('@napi-rs/keyring') | null = null

  async function getKeyring(): Promise<typeof import('@napi-rs/keyring')> {
    if (!keyringModule) {
      keyringModule = await import('@napi-rs/keyring')
    }
    return keyringModule
  }

  return {
    async get(key: string): Promise<string | null> {
      try {
        const { AsyncEntry } = await getKeyring()
        const entry = new AsyncEntry(SERVICE, key)
        const password = await entry.getPassword()
        return password ?? null
      } catch (error) {
        rethrowKeyringError(error)
      }
    },

    async set(key: string, value: string): Promise<void> {
      try {
        const { AsyncEntry } = await getKeyring()
        const entry = new AsyncEntry(SERVICE, key)
        await entry.setPassword(value)
      } catch (error) {
        rethrowKeyringError(error)
      }
    },

    async delete(key: string): Promise<void> {
      try {
        const { AsyncEntry } = await getKeyring()
        const entry = new AsyncEntry(SERVICE, key)
        await entry.deletePassword()
      } catch (error) {
        // Ignore errors when deleting non-existent keys
        if (error instanceof Error && error.message.includes('not found')) {
          return
        }
        rethrowKeyringError(error)
      }
    },

    async has(key: string): Promise<boolean> {
      const value = await this.get(key)
      return value !== null
    },

    async findKeys(prefix: string): Promise<string[]> {
      try {
        const { findCredentialsAsync } = await getKeyring()
        const credentials = await findCredentialsAsync(SERVICE)
        return credentials.filter((c) => c.account.startsWith(prefix)).map((c) => c.account)
      } catch (error) {
        rethrowKeyringError(error)
      }
    },
  }
}

/**
 * Check if the OS keyring is available.
 * Returns false on headless Linux without a keyring service.
 */
export async function isKeyringAvailable(): Promise<boolean> {
  try {
    const store = createKeyringStore()
    // Try to access the keyring - this will error if not available
    await store.get('__vibekit_keyring_check__')
    return true
  } catch {
    return false
  }
}
