/**
 * Vault token commands - create, revoke, status
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { getVaultStatus } from '../../lib/vault/docker'
import { withSpinner } from '../../utils/spinner'
import {
  createMcpPolicy,
  createMcpToken,
  revokeMcpToken,
  saveMcpToken,
  loadMcpToken,
  hasMcpToken,
  deleteMcpToken,
  lookupToken,
  DEFAULT_MCP_TOKEN_TTL,
} from '../../lib/vault/vault'
import {
  getRootToken,
  confirmCreateNewToken,
  confirmRevokeToken,
  VAULT_TOKEN_HELP,
} from './prompts'

export function parseTokenArgs(args: string[]): { ttl?: string } {
  let ttl: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ttl' && args[i + 1]) {
      ttl = args[i + 1]
    }
  }

  return { ttl }
}

export async function vaultTokenCreate(ttl?: string): Promise<void> {
  p.intro(pc.cyan('Create MCP Token') + ' ' + pc.yellow('[EXPERIMENTAL]'))

  const status = await getVaultStatus()
  if (!status.vaultRunning) {
    p.log.error('Vault is not running. Run: vibekit vault start')
    process.exit(1)
  }
  if (status.vaultSealed) {
    p.log.error('Vault is sealed. Run: vibekit vault unseal')
    process.exit(1)
  }

  const rootToken = await getRootToken()
  if (!rootToken) {
    p.log.error('Root token not found. Run: vibekit init')
    process.exit(1)
  }

  if (await hasMcpToken()) {
    const proceed = await confirmCreateNewToken()
    if (proceed === null || !proceed) {
      p.log.info('Token creation cancelled')
      return
    }
  }

  await withSpinner(
    {
      start: 'Updating MCP policy...',
      success: 'MCP policy updated',
      fail: 'Failed to update policy',
    },
    () => createMcpPolicy(rootToken)
  )

  await withSpinner(
    {
      start: 'Creating MCP token...',
      success: 'MCP token created',
      fail: 'Failed to create token',
    },
    async () => {
      const token = await createMcpToken(rootToken, ttl)
      await saveMcpToken(token)
    }
  )

  p.outro(pc.green('MCP token created!'))

  console.log(`
${pc.bold('Token saved to:')}
  ${pc.cyan('OS keyring (vibekit/config:vault-mcp-token)')}

${pc.bold('Permissions:')}
  ${pc.green('+')} Sign with transit keys
  ${pc.green('+')} Read public keys
  ${pc.green('+')} List keys
  ${pc.green('+')} Create keys
  ${pc.red('-')} Delete keys (root token only)

${pc.bold('Expiry:')} ${pc.yellow(ttl || DEFAULT_MCP_TOKEN_TTL)}
`)
}

export async function vaultTokenRevoke(): Promise<void> {
  p.intro(pc.cyan('Revoke MCP Token'))

  const mcpToken = await loadMcpToken()
  if (!mcpToken) {
    p.log.error('No MCP token found')
    process.exit(1)
  }

  const confirmed = await confirmRevokeToken()
  if (confirmed === null || !confirmed) {
    p.log.info('Revocation cancelled')
    return
  }

  const status = await getVaultStatus()
  if (!status.vaultRunning || status.vaultSealed) {
    // Vault unavailable - just delete the local file
    await withSpinner(
      {
        start: 'Deleting token file...',
        success: 'Token file deleted',
        fail: 'Failed to delete token',
      },
      () => deleteMcpToken()
    )
    p.log.warn('Vault is not running. Token file deleted but token may still be valid in Vault.')
    return
  }

  const rootToken = await getRootToken()
  if (!rootToken) {
    p.log.error('Root token not found. Run: vibekit init')
    process.exit(1)
  }

  // Use manual spinner here because we need to delete the local token even if revoke fails
  const s = p.spinner()
  s.start('Revoking token...')
  try {
    await revokeMcpToken(rootToken, mcpToken)
    await deleteMcpToken()
    s.stop('Token revoked')
  } catch (error) {
    s.stop('Failed to revoke token')
    p.log.error(error instanceof Error ? error.message : 'Unknown error')
    // Still delete the local file so user isn't stuck with invalid token
    await deleteMcpToken()
    process.exit(1)
  }

  p.outro(pc.green('MCP token revoked'))

  console.log(`
${pc.dim('The MCP server will no longer be able to authenticate.')}
${pc.dim('Run "vibekit vault token create" to create a new token.')}
`)
}

export async function vaultTokenStatus(): Promise<void> {
  p.intro(pc.cyan('MCP Token Status'))

  const mcpToken = await loadMcpToken()

  if (!mcpToken) {
    console.log()
    console.log(pc.yellow('No MCP token found'))
    console.log(pc.dim('Run "vibekit vault token create" to create one'))
    return
  }

  console.log()
  console.log(pc.bold('Token Storage:'))
  console.log(`  ${pc.cyan('OS keyring (vibekit/config:vault-mcp-token)')}`)

  const info = await lookupToken(mcpToken)

  if (!info) {
    console.log()
    console.log(pc.yellow('Token is invalid or expired'))
    console.log(pc.dim('Run "vibekit vault token create" to create a new one'))
    return
  }

  console.log()
  console.log(pc.bold('Token Info:'))
  console.log(`  Display Name: ${info.displayName}`)
  console.log(`  Accessor:     ${pc.dim(info.accessor)}`)
  console.log(`  Policies:     ${info.policies.join(', ')}`)
  console.log(`  Created:      ${info.createdAt}`)

  if (info.expiresAt) {
    const expiry = new Date(info.expiresAt)
    const now = new Date()
    const hoursLeft = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60))

    if (hoursLeft < 24) {
      console.log(`  Expires:      ${pc.red(info.expiresAt)} (${hoursLeft}h remaining)`)
    } else {
      const daysLeft = Math.round(hoursLeft / 24)
      console.log(`  Expires:      ${pc.yellow(info.expiresAt)} (${daysLeft}d remaining)`)
    }
  } else {
    console.log(`  Expires:      ${pc.green('Never')}`)
  }

  console.log()
  console.log(pc.bold('Permissions:'))
  console.log(`  ${pc.green('+')} Sign with transit keys (transit/sign/*)`)
  console.log(`  ${pc.green('+')} Read public keys (transit/keys/*)`)
  console.log(`  ${pc.green('+')} List keys (transit/keys)`)
  console.log(`  ${pc.green('+')} Create keys (transit/keys/*)`)
  console.log(`  ${pc.red('-')} Delete keys`)
  console.log(`  ${pc.red('-')} Manage policies`)
}

export function vaultTokenHelp(): void {
  console.log(VAULT_TOKEN_HELP)
}
