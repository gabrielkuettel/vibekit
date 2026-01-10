/**
 * Vault status command - display vault status
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { getVaultStatus } from '../../lib/vault/docker'
import {
  loadMcpToken,
  lookupToken,
  getUnsealKeyFromEnv,
  getRootTokenFromEnv,
  ENV_VAULT_UNSEAL_KEY,
  ENV_VAULT_ROOT_TOKEN,
} from '../../lib/vault/vault'

export async function vaultStatus(): Promise<void> {
  p.intro(pc.cyan('Vault Status') + ' ' + pc.yellow('[EXPERIMENTAL]'))

  const status = await getVaultStatus()
  const mcpToken = await loadMcpToken()

  console.log()
  console.log(pc.bold('Bootstrap:'))
  console.log(`  Configured: ${status.initialized ? pc.green('Yes') : pc.yellow('No')}`)

  console.log()
  console.log(pc.bold('Container:'))
  console.log(`  Vault: ${status.vaultRunning ? pc.green('Running') : pc.red('Stopped')}`)

  if (status.vaultRunning) {
    console.log()
    console.log(pc.bold('Vault:'))
    console.log(`  Status: ${status.vaultSealed ? pc.yellow('Sealed') : pc.green('Unsealed')}`)
    console.log(`  URL:    ${pc.cyan(status.vaultUrl)}`)
  }

  console.log()
  console.log(pc.bold('Credentials:'))
  const envUnsealKey = getUnsealKeyFromEnv()
  const envRootToken = getRootTokenFromEnv()
  if (envUnsealKey) {
    console.log(`  Unseal Key: ${pc.green('Set via ' + ENV_VAULT_UNSEAL_KEY)}`)
  } else {
    console.log(`  Unseal Key: ${pc.dim('Not set (will prompt when needed)')}`)
  }
  if (envRootToken) {
    console.log(`  Root Token: ${pc.green('Set via ' + ENV_VAULT_ROOT_TOKEN)}`)
  } else {
    console.log(`  Root Token: ${pc.dim('Not set (will prompt when needed)')}`)
  }

  console.log()
  console.log(pc.bold('MCP Token:'))
  if (mcpToken) {
    const info = await lookupToken(mcpToken)
    if (info) {
      console.log(`  Saved:   ${pc.green('Yes')}`)
      console.log(`  Store:   ${pc.dim('OS keyring')}`)
      console.log(`  Expires: ${info.expiresAt ? pc.yellow(info.expiresAt) : pc.green('Never')}`)
    } else {
      console.log(`  Saved:   ${pc.yellow('Yes (but invalid/expired)')}`)
      console.log(`  Store:   ${pc.dim('OS keyring')}`)
    }
  } else {
    console.log(`  Saved: ${pc.yellow('No')}`)
    console.log(`  ${pc.dim('Run "vibekit vault token create" to create one')}`)
  }

  console.log()

  if (!status.initialized) {
    console.log(pc.dim('Run "vibekit init" to set up Vault'))
  } else if (!status.vaultRunning) {
    console.log(pc.dim('Run "vibekit vault start" to start Vault'))
  } else if (status.vaultSealed) {
    console.log(pc.dim('Run "vibekit vault unseal" to unseal Vault'))
  } else if (!mcpToken) {
    console.log(pc.dim('Run "vibekit vault token create" to create an MCP token'))
  } else {
    console.log(pc.dim('Vault is ready. Create accounts with "vibekit account create <name>"'))
  }
}
