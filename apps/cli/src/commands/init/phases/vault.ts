/**
 * Vault Bootstrap Phase
 *
 * Sets up HashiCorp Vault for secure key management.
 * Optional step - can be skipped if Docker not available or user declines.
 *
 * Security model:
 * - Unseal keys and root token are displayed ONCE during init
 * - User must save them externally (password manager, etc.)
 * - Keys are never stored automatically - user provides via prompt or env var
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { withSpinner } from '../../../utils/spinner'
import {
  startContainers,
  waitForVault,
  isVaultInitialized,
  isVaultSealed,
  pullImages,
  getVaultStatus,
} from '../../../lib/vault/docker'
import {
  initVault,
  unsealVault,
  configureVault,
  createMcpToken,
  saveMcpToken,
  isVaultBootstrapped,
  getUnsealKeyFromEnv,
  ENV_VAULT_UNSEAL_KEY,
  ENV_VAULT_ROOT_TOKEN,
} from '../../../lib/vault/vault'
import { confirm } from '../../../utils/prompts'
import type { VaultSetupStatus } from '../../../types'

/**
 * Prompt for unseal key (checks env var first)
 * @returns The unseal key or null if cancelled
 */
async function promptForUnsealKey(): Promise<string | null> {
  const envKey = getUnsealKeyFromEnv()
  if (envKey) {
    return envKey
  }

  const key = await p.text({
    message: 'Enter Vault unseal key:',
    placeholder: 'Your unseal key from initial setup',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Unseal key is required'
      }
    },
  })

  if (p.isCancel(key)) {
    return null
  }

  return key as string
}

/**
 * Confirm user has saved credentials securely
 * @returns true if confirmed, false if declined, null if cancelled
 */
async function confirmCredentialsSaved(): Promise<boolean | null> {
  const confirmed = await p.confirm({
    message: 'Have you saved these credentials securely?',
    initialValue: false,
  })

  if (p.isCancel(confirmed)) {
    return null
  }

  return confirmed
}

/**
 * Second confirmation that user has saved credentials
 * @returns true if confirmed, false if declined, null if cancelled
 */
async function confirmCredentialsUnderstood(): Promise<boolean | null> {
  const retry = await p.confirm({
    message: 'I understand and have saved them',
    initialValue: true,
  })

  if (p.isCancel(retry)) {
    return null
  }

  return retry
}

/**
 * Confirm setting up Vault
 * @returns true if confirmed (helper exits on cancel)
 */
async function confirmSetupVault(): Promise<boolean> {
  return confirm(
    'Set up HashiCorp Vault for secure key management? (EXPERIMENTAL - runs Docker container)',
    true
  )
}

export interface VaultBootstrapResult {
  status: VaultSetupStatus
  error?: string
  /** Unseal key to display to user (only set during fresh init) */
  unsealKey?: string
  /** Root token to display to user (only set during fresh init) */
  rootToken?: string
}

export function displayVaultCredentials(unsealKey: string, rootToken: string): void {
  const lines = [
    pc.yellow('These credentials are required to unseal and manage Vault.'),
    pc.yellow('They will NOT be shown again and are NOT stored automatically.'),
    '',
    `${pc.bold('Unseal Key:')}`,
    pc.cyan(`  ${unsealKey}`),
    '',
    `${pc.bold('Root Token:')}`,
    pc.cyan(`  ${rootToken}`),
    '',
    pc.dim('Store these in your password manager or a secure location.'),
  ]

  p.note(lines.join('\n'), pc.bgYellow(pc.black(' SAVE THESE CREDENTIALS ')))
}

async function resumeExistingVault(): Promise<VaultBootstrapResult> {
  const status = await getVaultStatus()

  if (status.vaultRunning && !status.vaultSealed) {
    p.log.success('Vault is already running')
    return { status: 'completed' }
  }

  if (!status.vaultRunning) {
    await withSpinner(
      {
        start: 'Starting Vault...',
        success: 'Vault container started',
        fail: 'Failed to start Vault',
      },
      async () => {
        await startContainers()
        const ready = await waitForVault()
        if (!ready) throw new Error('Vault did not become ready in time')
      }
    )
  }

  const sealed = await isVaultSealed()
  if (!sealed) {
    return { status: 'completed' }
  }

  p.log.info('Vault is sealed and requires your unseal key.')
  console.log(pc.dim(`Tip: Set ${ENV_VAULT_UNSEAL_KEY} environment variable for automation`))
  console.log()

  const unsealKey = await promptForUnsealKey()
  if (!unsealKey) {
    return { status: 'error', error: 'Unseal key not provided' }
  }

  await withSpinner(
    { start: 'Unsealing Vault...', success: 'Vault unsealed', fail: 'Failed to unseal Vault' },
    () => unsealVault(unsealKey)
  )
  return { status: 'completed' }
}

async function freshVaultSetup(): Promise<VaultBootstrapResult> {
  const s = p.spinner()

  s.start('Pulling Vault image...')
  try {
    await pullImages()
  } catch (error) {
    s.stop('Failed to pull image')
    const msg = error instanceof Error ? error.message : 'Unknown error'
    p.log.error(msg)
    return { status: 'error', error: msg }
  }
  s.stop('Vault image ready')

  s.start('Configuring Vault...')

  let unsealKey: string
  let rootToken: string

  try {
    await startContainers()

    const vaultReady = await waitForVault()
    if (!vaultReady) {
      throw new Error('Vault did not become ready in time')
    }

    const initialized = await isVaultInitialized()

    if (!initialized) {
      const initResult = await initVault()
      unsealKey = initResult.keys[0]
      rootToken = initResult.rootToken
      await unsealVault(unsealKey)
    } else {
      // Edge case: Vault data exists but no credentials saved
      s.stop('Vault configuration issue')
      p.log.error('Vault is already initialized but credentials are not available.')
      p.log.info('This may happen if Vault was initialized previously.')
      p.log.info('Options:')
      p.log.message(
        `  1. If you have the credentials, set ${ENV_VAULT_UNSEAL_KEY} and ${ENV_VAULT_ROOT_TOKEN}`
      )
      p.log.message('  2. Run "vibekit remove" to reset and start fresh')
      return { status: 'error', error: 'Vault initialized without stored credentials' }
    }

    await configureVault(rootToken)

    const mcpToken = await createMcpToken(rootToken)
    await saveMcpToken(mcpToken)

    s.stop('Vault configured')
  } catch (error) {
    s.stop('Vault setup failed')
    const msg = error instanceof Error ? error.message : 'Unknown error'
    p.log.error(msg)
    return { status: 'error', error: msg }
  }

  displayVaultCredentials(unsealKey, rootToken)

  const confirmed = await confirmCredentialsSaved()
  if (confirmed === null) {
    return { status: 'error', error: 'Setup cancelled' }
  }

  if (!confirmed) {
    p.log.warn('You MUST save these credentials to use Vault after restart.')
    const retry = await confirmCredentialsUnderstood()
    if (retry === null || !retry) {
      p.log.error('Cannot proceed without saving credentials.')
      p.log.info('The credentials are displayed above. Please save them.')
      return { status: 'completed', unsealKey, rootToken }
    }
  }

  return { status: 'completed', unsealKey, rootToken }
}

export async function vaultBootstrapStep(
  dockerAvailable: boolean,
  dockerRunning: boolean
): Promise<VaultBootstrapResult> {
  if (!dockerAvailable) {
    return { status: 'no-docker' }
  }

  if (!dockerRunning) {
    p.log.warn('Docker is not running. Vault setup will be skipped.')
    p.log.info('Start Docker and run: vibekit init')
    return { status: 'no-docker' }
  }

  if (isVaultBootstrapped()) {
    return resumeExistingVault()
  }

  const shouldSetup = await confirmSetupVault()
  if (!shouldSetup) {
    p.log.info('Vault setup skipped')
    p.log.message(`  ${pc.dim('Run "vibekit init" later to set up')}`)
    return { status: 'skipped' }
  }

  return freshVaultSetup()
}
