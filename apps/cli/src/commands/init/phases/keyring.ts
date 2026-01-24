/**
 * Keyring Bootstrap Phase
 *
 * Verifies keyring is available and ready for use.
 * Unlike Vault, keyring doesn't require setup - just verification.
 */

import * as p from '@clack/prompts'
import { isKeyringAvailable } from '@vibekit/keyring'
import { initAccountsDb } from '@vibekit/provider-keyring'
import type { KeyringSetupStatus } from '../../../types'

export interface KeyringBootstrapResult {
  status: KeyringSetupStatus
  error?: string
}

export async function keyringBootstrapStep(): Promise<KeyringBootstrapResult> {
  const s = p.spinner()

  s.start('Verifying keyring access...')

  try {
    const available = await isKeyringAvailable()

    if (!available) {
      s.stop('Keyring unavailable')
      p.log.warn('OS keyring is not accessible.')
      p.log.info('On Linux, ensure libsecret is installed:')
      p.log.message('  sudo apt-get install libsecret-1-dev')
      p.log.info('Headless systems should use Vault instead.')
      return { status: 'unavailable', error: 'Keyring not accessible' }
    }

    // Initialize accounts database
    initAccountsDb()

    s.stop('Keyring ready')
    return { status: 'completed' }
  } catch (error) {
    s.stop('Keyring error')
    const msg = error instanceof Error ? error.message : 'Unknown error'
    p.log.error(msg)
    return { status: 'error', error: msg }
  }
}
