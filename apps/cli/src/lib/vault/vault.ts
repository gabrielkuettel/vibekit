// Vault operations - init, unseal, configure, token management

import { existsSync } from 'fs'
import { VAULT_URL, getDockerComposePath } from './paths'
import type { VaultSealData, VaultInitResult, McpTokenInfo } from './types'
import { createKeyringStore, KEYRING_KEYS } from '@vibekit/keyring'
import {
  setGithubToken as dbSetGithubToken,
  getGithubToken as dbGetGithubToken,
  hasGithubToken as dbHasGithubToken,
} from '@vibekit/db'
import { lazy } from '../../utils/lazy'

const getKeyring = lazy(() => createKeyringStore())

// Environment variable names for automation
export const ENV_VAULT_UNSEAL_KEY = 'VAULT_UNSEAL_KEY'
export const ENV_VAULT_ROOT_TOKEN = 'VAULT_ROOT_TOKEN'

const TRANSIT_PATH = 'transit'
const KV_PATH = 'vibekit'
const MCP_POLICY_NAME = 'mcp-signer'
export const DEFAULT_MCP_TOKEN_TTL = '768h' // 32 days (Vault's default max TTL)

// MCP signer policy - allows signing, creating, and reading keys (not deleting)
const MCP_SIGNER_POLICY = `
# Policy: mcp-signer
# Allows signing, creating, and reading transit keys
# Also allows managing wallet metadata in KV store

# Sign with any key
path "transit/sign/*" {
  capabilities = ["create", "update"]
}

# Create and read keys (for create_wallet and list_wallets)
# Note: Vault Transit requires both "create" and "update" to create keys
path "transit/keys/*" {
  capabilities = ["create", "update", "read"]
}

# List keys (for list_wallets)
path "transit/keys" {
  capabilities = ["list"]
}

# KV v2: Read and write wallet metadata
path "vibekit/data/wallets/*" {
  capabilities = ["create", "update", "read", "delete"]
}

# KV v2: List wallets directory (exact path)
path "vibekit/metadata/wallets" {
  capabilities = ["list"]
}

# KV v2: Read/delete individual wallet metadata (glob for children)
path "vibekit/metadata/wallets/*" {
  capabilities = ["list", "read", "delete"]
}
`.trim()

export async function initVault(): Promise<VaultInitResult> {
  const response = await fetch(`${VAULT_URL}/v1/sys/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret_shares: 1,
      secret_threshold: 1,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to initialize Vault: ${response.statusText}`)
  }

  const data = (await response.json()) as {
    keys: string[]
    keys_base64: string[]
    root_token: string
  }

  return {
    keys: data.keys,
    keysBase64: data.keys_base64,
    rootToken: data.root_token,
  }
}

/**
 * Unseal Vault with the provided key.
 * Note: The Vault unseal API does not require authentication.
 */
export async function unsealVault(key: string): Promise<void> {
  const response = await fetch(`${VAULT_URL}/v1/sys/unseal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })

  if (!response.ok) {
    throw new Error(`Failed to unseal: ${response.statusText}`)
  }

  const data = (await response.json()) as { sealed: boolean }
  if (data.sealed) {
    throw new Error('Invalid unseal key')
  }
}

async function mountTransitEngine(token: string): Promise<void> {
  const response = await fetch(`${VAULT_URL}/v1/sys/mounts/${TRANSIT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Vault-Token': token,
    },
    body: JSON.stringify({
      type: 'transit',
      config: { force_no_cache: true },
    }),
  })

  // 400 with "path is already in use" is OK
  if (!response.ok && response.status !== 400) {
    throw new Error(`Failed to mount transit engine: ${response.statusText}`)
  }
}

async function mountKvEngine(token: string): Promise<void> {
  const response = await fetch(`${VAULT_URL}/v1/sys/mounts/${KV_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Vault-Token': token,
    },
    body: JSON.stringify({
      type: 'kv',
      options: { version: '2' },
    }),
  })

  // 400 with "path is already in use" is OK
  if (!response.ok && response.status !== 400) {
    throw new Error(`Failed to mount KV engine: ${response.statusText}`)
  }
}

export async function createMcpPolicy(token: string): Promise<void> {
  const response = await fetch(`${VAULT_URL}/v1/sys/policies/acl/${MCP_POLICY_NAME}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Vault-Token': token,
    },
    body: JSON.stringify({
      policy: MCP_SIGNER_POLICY,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create MCP policy: ${response.statusText} - ${text}`)
  }
}

export async function createMcpToken(
  rootToken: string,
  ttl: string = DEFAULT_MCP_TOKEN_TTL
): Promise<string> {
  const body: Record<string, unknown> = {
    policies: [MCP_POLICY_NAME],
    renewable: true,
    display_name: 'mcp-signer-token',
    ttl,
  }

  const response = await fetch(`${VAULT_URL}/v1/auth/token/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Vault-Token': rootToken,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to create MCP token: ${response.statusText} - ${text}`)
  }

  const data = (await response.json()) as {
    auth: {
      client_token: string
      accessor: string
      policies: string[]
      lease_duration: number
    }
  }

  return data.auth.client_token
}

export async function revokeMcpToken(rootToken: string, mcpToken: string): Promise<void> {
  const response = await fetch(`${VAULT_URL}/v1/auth/token/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Vault-Token': rootToken,
    },
    body: JSON.stringify({
      token: mcpToken,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to revoke MCP token: ${response.statusText} - ${text}`)
  }
}

export async function lookupToken(token: string): Promise<McpTokenInfo | null> {
  try {
    const response = await fetch(`${VAULT_URL}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': token,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as {
      data: {
        accessor: string
        creation_time: number
        display_name: string
        expire_time: string | null
        policies: string[]
        ttl: number
      }
    }

    return {
      accessor: data.data.accessor,
      displayName: data.data.display_name,
      policies: data.data.policies,
      createdAt: new Date(data.data.creation_time * 1000).toISOString(),
      expiresAt: data.data.expire_time,
      ttlSeconds: data.data.ttl,
    }
  } catch {
    return null
  }
}

export async function configureVault(token: string): Promise<void> {
  await mountTransitEngine(token)
  await mountKvEngine(token)
  await createMcpPolicy(token)
}

/**
 * Check if Vault has been bootstrapped (docker-compose file exists).
 * This is the primary indicator that Vault was initialized.
 */
export function isVaultBootstrapped(): boolean {
  return existsSync(getDockerComposePath())
}

/**
 * Get unseal key from environment variable.
 * Returns null if not set.
 */
export function getUnsealKeyFromEnv(): string | null {
  return process.env[ENV_VAULT_UNSEAL_KEY] || null
}

/**
 * Get root token from environment variable.
 * Returns null if not set.
 */
export function getRootTokenFromEnv(): string | null {
  return process.env[ENV_VAULT_ROOT_TOKEN] || null
}

// MCP token - stored in OS keyring
export async function saveMcpToken(token: string): Promise<void> {
  await getKeyring().set(KEYRING_KEYS.VAULT_MCP_TOKEN, token)
}

export async function loadMcpToken(): Promise<string | null> {
  return getKeyring().get(KEYRING_KEYS.VAULT_MCP_TOKEN)
}

export async function hasMcpToken(): Promise<boolean> {
  return getKeyring().has(KEYRING_KEYS.VAULT_MCP_TOKEN)
}

export async function deleteMcpToken(): Promise<void> {
  await getKeyring().delete(KEYRING_KEYS.VAULT_MCP_TOKEN)
}

// GitHub token - stored in SQLite (low-grade secret)
export function saveGithubToken(token: string): void {
  dbSetGithubToken(token)
}

export function loadGithubToken(): string | null {
  return dbGetGithubToken()
}

export function hasGithubToken(): boolean {
  return dbHasGithubToken()
}
