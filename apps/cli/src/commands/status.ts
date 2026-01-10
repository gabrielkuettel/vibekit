/**
 * Status command - show VibeKit component status
 *
 * Shows the current status of all VibeKit components.
 * Account data is queried from providers (Vault or Keyring).
 */

import pc from 'picocolors'

import { checkDocker, checkDockerCompose, getVaultStatus } from '../lib/vault/docker'
import {
  loadMcpToken,
  lookupToken,
  isVaultBootstrapped,
  hasGithubToken,
  hasMcpToken,
} from '../lib/vault/vault'
import { hasDispenserToken, loadDispenserToken } from '../lib/dispenser'
import { getLocalnetStatus } from '../lib/localnet/status'
import { commandExists, getCommandOutput } from '../utils/shell'
import { decodeJwtPayload } from '../utils/jwt'
import { isKeyringAvailable } from '@vibekit/keyring'
import { VaultProvider, type VaultProviderConfig } from '@vibekit/provider-vault'
import { KeyringProvider } from '@vibekit/provider-keyring'

async function getAccountCount(): Promise<number> {
  let total = 0

  const vaultConfigured = await hasMcpToken()
  if (vaultConfigured) {
    try {
      const token = await loadMcpToken()
      if (token) {
        const config: VaultProviderConfig = {
          url: process.env.VAULT_ADDR || 'http://localhost:8200',
          token,
          transitPath: process.env.VAULT_TRANSIT_PATH || 'transit',
          keyPrefix: process.env.VAULT_KEY_PREFIX || 'algo-',
        }

        const vaultProvider = new VaultProvider(config)
        const available = await vaultProvider.isAvailable()
        if (available) {
          const accounts = await vaultProvider.listAccounts()
          total += accounts.length
        }
      }
    } catch {
      // Vault may be unavailable or sealed
    }
  }

  const keyringAvailable = await isKeyringAvailable()
  if (keyringAvailable) {
    try {
      const keyringProvider = new KeyringProvider()
      const available = await keyringProvider.isAvailable()
      if (available) {
        const accounts = await keyringProvider.listAccounts()
        total += accounts.length
      }
    } catch {
      // Keyring may be unavailable on this platform
    }
  }

  return total
}

export async function commandStatus(): Promise<void> {
  console.log()
  console.log(pc.bold(pc.cyan('VibeKit Status')))
  console.log()

  // Docker
  console.log(pc.bold('Docker:'))
  const hasDocker = await checkDocker()
  const hasCompose = await checkDockerCompose()

  if (!hasDocker) {
    console.log(`  Status: ${pc.red('Not installed')}`)
  } else if (!hasCompose) {
    console.log(`  Docker:  ${pc.green('Installed')}`)
    console.log(`  Compose: ${pc.red('Not found')}`)
  } else {
    // Check if running
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      await execAsync('docker info')
      console.log(`  Status: ${pc.green('Running')}`)
    } catch {
      console.log(`  Status: ${pc.yellow('Installed but not running')}`)
    }
  }

  // Account Providers
  console.log()
  console.log(pc.bold('Account Providers:'))

  // Detect providers dynamically
  const vaultConfigured = await hasMcpToken()
  const keyringAvailable = await isKeyringAvailable()

  if (!vaultConfigured && !keyringAvailable) {
    console.log(`  ${pc.yellow('Not configured')}`)
    console.log(`  ${pc.dim('Run "vibekit init" to set up')}`)
  }

  // Show Vault status if configured (MCP token exists)
  if (vaultConfigured) {
    console.log(`  ${pc.bold('Vault:')}`)

    if (!isVaultBootstrapped()) {
      console.log(`    Bootstrap: ${pc.yellow('Not configured')}`)
      console.log(`    ${pc.dim('Run "vibekit init" to set up')}`)
    } else {
      console.log(`    Bootstrap: ${pc.green('Configured')}`)

      const status = await getVaultStatus()
      if (!status.vaultRunning) {
        console.log(`    Container: ${pc.red('Stopped')}`)
        console.log(`    ${pc.dim('Run "vibekit vault start" to start')}`)
      } else {
        console.log(`    Container: ${pc.green('Running')}`)
        console.log(
          `    Status:    ${status.vaultSealed ? pc.yellow('Sealed') : pc.green('Unsealed')}`
        )
      }

      // MCP Token
      const mcpToken = await loadMcpToken()
      if (!mcpToken) {
        console.log(`    MCP Token: ${pc.yellow('Not created')}`)
        console.log(`    ${pc.dim('Run "vibekit vault token create" to create')}`)
      } else {
        const info = await lookupToken(mcpToken)
        if (info) {
          if (info.expiresAt) {
            const expiry = new Date(info.expiresAt)
            const now = new Date()
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (daysLeft < 7) {
              console.log(`    MCP Token: ${pc.yellow(`Expires in ${daysLeft}d`)}`)
            } else {
              console.log(`    MCP Token: ${pc.green('Valid')}`)
            }
          } else {
            console.log(`    MCP Token: ${pc.green('Valid (no expiry)')}`)
          }
        } else {
          console.log(`    MCP Token: ${pc.red('Invalid/expired')}`)
        }
      }
    }
  }

  // Show Keyring status if available
  if (keyringAvailable) {
    console.log(`  ${pc.bold('Keyring:')}`)
    console.log(`    Status: ${pc.green('Available')}`)
  }

  // AlgoKit
  console.log()
  console.log(pc.bold('AlgoKit:'))
  if (await commandExists('algokit')) {
    const version = await getCommandOutput('algokit', ['--version'])
    console.log(`  Version: ${pc.green(version || 'unknown')}`)
  } else {
    console.log(`  Status: ${pc.yellow('Not installed')}`)
  }

  // LocalNet
  console.log()
  console.log(pc.bold('LocalNet:'))
  const localnetStatus = await getLocalnetStatus()
  if (!localnetStatus.algodRunning && !localnetStatus.indexerRunning) {
    console.log(`  Algod:   ${pc.yellow('Stopped')}`)
    console.log(`  Indexer: ${pc.yellow('Stopped')}`)
    console.log(`  ${pc.dim('Run "algokit localnet start" to start')}`)
  } else {
    console.log(
      `  Algod:   ${localnetStatus.algodRunning ? pc.green('Running') : pc.yellow('Stopped')}`
    )
    console.log(
      `  Indexer: ${localnetStatus.indexerRunning ? pc.green('Running') : pc.yellow('Stopped')}`
    )
  }

  // Accounts
  console.log()
  console.log(pc.bold('Accounts:'))
  const accountCount = await getAccountCount()
  if (accountCount === 0) {
    console.log(`  Count: ${pc.dim('None')}`)
    console.log(`  ${pc.dim('Ask your AI agent to use create_account')}`)
  } else {
    console.log(`  Total: ${pc.cyan(String(accountCount))}`)
    console.log(`  ${pc.dim('Ask your AI agent to use list_accounts for details')}`)
  }

  // TestNet Dispenser
  console.log()
  console.log(pc.bold('TestNet Dispenser:'))
  if (!(await hasDispenserToken())) {
    console.log(`  Token: ${pc.yellow('Not configured')}`)
    console.log(`  ${pc.dim('Run "vibekit dispenser login" to authenticate')}`)
  } else {
    try {
      const token = await loadDispenserToken()
      if (token) {
        const payload = decodeJwtPayload(token)

        if (payload && typeof payload.exp === 'number') {
          const expiresAt = new Date(payload.exp * 1000)
          const now = new Date()
          const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (daysLeft > 0) {
            console.log(`  Token: ${pc.green(`Valid (${daysLeft}d remaining)`)}`)
          } else {
            console.log(`  Token: ${pc.red('Expired')}`)
            console.log(`  ${pc.dim('Run "vibekit dispenser login" to refresh')}`)
          }
        } else {
          console.log(`  Token: ${pc.green('Configured')}`)
        }
      }
    } catch {
      console.log(`  Token: ${pc.yellow('Error reading token')}`)
    }
  }

  // GitHub
  console.log()
  console.log(pc.bold('GitHub:'))
  if (await hasGithubToken()) {
    console.log(`  Token: ${pc.green('Configured')}`)
  } else {
    console.log(`  Token: ${pc.yellow('Not configured')}`)
    console.log(`  ${pc.dim('Add GITHUB_TOKEN to MCP config for repo search')}`)
  }

  console.log()
}
