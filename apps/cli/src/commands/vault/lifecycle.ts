/**
 * Vault lifecycle commands - start, stop, unseal
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import {
  startContainers,
  stopContainers,
  getVaultStatus,
  waitForVault,
  isVaultSealed,
} from '../../lib/vault/docker'
import { withSpinner } from '../../utils/spinner'
import { isVaultBootstrapped, unsealVault, ENV_VAULT_UNSEAL_KEY } from '../../lib/vault/vault'
import { promptForUnsealKey } from './prompts'

export async function vaultStart(): Promise<void> {
  p.intro(pc.cyan('Starting Vault') + ' ' + pc.yellow('[EXPERIMENTAL]'))

  if (!isVaultBootstrapped()) {
    p.log.error('Vault is not bootstrapped. Run: vibekit init')
    process.exit(1)
  }

  await withSpinner(
    {
      start: 'Starting Vault container...',
      success: 'Vault container started',
      fail: 'Failed to start container',
    },
    () => startContainers()
  )

  await withSpinner(
    { start: 'Waiting for Vault...', success: 'Vault ready', fail: 'Vault not ready' },
    async () => {
      const ready = await waitForVault()
      if (!ready) throw new Error('Vault did not become ready in time')
    }
  )

  const sealed = await isVaultSealed()
  if (sealed) {
    p.log.info('Vault is sealed and requires your unseal key.')
    p.log.info(`Tip: Set ${ENV_VAULT_UNSEAL_KEY} environment variable for automation`)

    const unsealKey = await promptForUnsealKey()
    if (!unsealKey) {
      p.log.error('Unseal key not provided')
      process.exit(1)
    }

    await withSpinner(
      { start: 'Unsealing Vault...', success: 'Vault unsealed', fail: 'Failed to unseal' },
      () => unsealVault(unsealKey)
    )
  }

  p.outro(pc.green('Vault is running'))

  console.log(`
${pc.bold('Vault:')}
  URL: ${pc.cyan('http://localhost:8200')}
`)
}

export async function vaultStop(): Promise<void> {
  p.intro(pc.cyan('Stopping Vault'))

  await withSpinner(
    {
      start: 'Stopping container...',
      success: 'Container stopped',
      fail: 'Failed to stop container',
    },
    () => stopContainers()
  )

  p.outro(pc.green('Vault stopped'))
}

export async function vaultUnseal(): Promise<void> {
  p.intro(pc.cyan('Unseal Vault'))

  const status = await getVaultStatus()
  if (!status.vaultRunning) {
    p.log.error('Vault is not running. Run: vibekit vault start')
    process.exit(1)
  }

  const sealed = await isVaultSealed()
  if (!sealed) {
    p.log.success('Vault is already unsealed')
    return
  }

  p.log.info(`Tip: Set ${ENV_VAULT_UNSEAL_KEY} environment variable for automation`)

  const unsealKey = await promptForUnsealKey()
  if (!unsealKey) {
    p.log.error('Unseal key not provided')
    process.exit(1)
  }

  await withSpinner(
    { start: 'Unsealing Vault...', success: 'Vault unsealed', fail: 'Failed to unseal' },
    () => unsealVault(unsealKey)
  )

  p.outro(pc.green('Vault unsealed'))
}
