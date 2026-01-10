/**
 * Remove command - stop containers and remove all configs
 *
 * Permanently deletes all VibeKit data including:
 * - Vault container and volumes
 * - Secrets from OS keyring
 * - Configuration directory
 */

import * as p from '@clack/prompts'
import { rm } from 'fs/promises'
import { existsSync } from 'fs'

import { stopContainers } from '../../lib/vault/docker'
import { getVibekitDir } from '../../lib/vault/paths'
import { isKeyringAvailable } from '@vibekit/keyring'
import { withSpinner } from '../../utils/spinner'
import { displayRemoveWarning, confirmRemove } from './prompts'
import { clearKeyringSecrets } from '../../lib/keyring'

export async function commandRemove(): Promise<void> {
  const vibekitDir = getVibekitDir()
  const keyringAvailable = await isKeyringAvailable()

  if (!existsSync(vibekitDir)) {
    p.log.info('VibeKit is not installed (no config directory found)')
    return
  }

  displayRemoveWarning(vibekitDir)

  const confirmed = await confirmRemove()
  if (confirmed === null || !confirmed) {
    p.log.info('Remove cancelled')
    return
  }

  const s = p.spinner()

  // Stop Vault container and remove volumes (ignore errors if not running)
  s.start('Stopping Vault and removing volumes...')
  try {
    await stopContainers(true) // true = remove named volumes
    s.stop('Vault stopped and volumes removed')
  } catch {
    s.stop('Vault container not running')
  }

  // Clear keyring secrets
  if (keyringAvailable) {
    s.start('Clearing secrets from OS keyring...')
    try {
      const { cleared, errors } = await clearKeyringSecrets()
      if (errors.length > 0) {
        s.stop(`Cleared ${cleared} secrets (${errors.length} errors)`)
        for (const error of errors) {
          p.log.warn(error)
        }
      } else if (cleared > 0) {
        s.stop(`Cleared ${cleared} secrets from keyring`)
      } else {
        s.stop('No secrets in keyring')
      }
    } catch (error) {
      s.stop('Failed to clear keyring')
      const msg = error instanceof Error ? error.message : 'Unknown error'
      p.log.warn(msg)
    }
  }

  await withSpinner(
    {
      start: 'Removing configuration files...',
      success: 'Configuration files removed',
      fail: 'Failed to remove configuration files',
    },
    () => rm(vibekitDir, { recursive: true, force: true })
  )

  console.log()
  p.log.success('VibeKit removed completely')
  console.log()
}
