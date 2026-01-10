// Vibekit config paths - all stored flat in ~/.config/vibekit

import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'

export function getVibekitDir(): string {
  return join(homedir(), '.config', 'vibekit')
}

export function getDockerComposePath(): string {
  return join(getVibekitDir(), 'vault-docker-compose.yml')
}

export function getVaultSealKeysPath(): string {
  return join(getVibekitDir(), 'vault-seal-keys.json')
}

/** @deprecated Legacy token file path, kept for migration only */
export function getVaultTokenPath(): string {
  return join(getVibekitDir(), 'vault-root-token')
}

export async function ensureVibekitDir(): Promise<void> {
  const dir = getVibekitDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true, mode: 0o700 })
  }
}

export function isVibekitInitialized(): boolean {
  return existsSync(getVibekitDir())
}

export const VAULT_URL = 'http://localhost:8200'
