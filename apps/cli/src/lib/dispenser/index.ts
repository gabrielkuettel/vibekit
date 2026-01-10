/**
 * Dispenser Service Layer
 *
 * Pure business logic - no CLI dependencies (@clack/prompts, picocolors).
 * Used by: commands/dispenser/, commands/init/phases/auth.ts
 */

export * from './auth'
export * from './login'

import { createKeyringStore, KEYRING_KEYS } from '@vibekit/keyring'
import { lazy } from '../../utils/lazy'

const getStore = lazy(() => createKeyringStore())

export async function hasDispenserToken(): Promise<boolean> {
  return getStore().has(KEYRING_KEYS.DISPENSER_TOKEN)
}

export async function loadDispenserToken(): Promise<string | null> {
  return getStore().get(KEYRING_KEYS.DISPENSER_TOKEN)
}
