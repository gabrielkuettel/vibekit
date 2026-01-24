// Vault-specific paths (CLI only)

import { join } from 'path'
import { getVibekitDir } from '@vibekit/config'

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

export const VAULT_URL = 'http://localhost:8200'
