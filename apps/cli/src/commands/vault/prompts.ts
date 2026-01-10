/**
 * Vault command prompts - user interaction prompts for vault operations
 */

import pc from 'picocolors'

import {
  getUnsealKeyFromEnv,
  getRootTokenFromEnv,
  ENV_VAULT_UNSEAL_KEY,
  ENV_VAULT_ROOT_TOKEN,
} from '../../lib/vault/vault'
import { confirmOrNull, passwordOrNull } from '../../utils/prompts'

export const VAULT_HELP = `
${pc.bold('vibekit vault')} - Manage HashiCorp Vault for secure key management
${pc.yellow('[EXPERIMENTAL]')} - Runs a Docker container on your machine

${pc.bold('Usage:')}
  vibekit vault <command>

${pc.bold('Commands:')}
  start         Start Vault container and unseal
  stop          Stop Vault container
  unseal        Unseal a running Vault (prompts for key)
  status        Show current status
  token create  Create MCP token (limited permissions)
  token revoke  Revoke MCP token
  token status  Show MCP token info

${pc.bold('Description:')}
  Vault provides enterprise-grade key management for Algorand accounts.
  Private keys are stored securely in Vault and never leave the server.

${pc.bold('Security Model:')}
  Unseal Key:  Required to unseal Vault after restart (you provide)
  Root Token:  Full Vault access (you provide when needed)
  MCP Token:   Limited to signing (for MCP server, stored in OS keyring)

${pc.bold('Environment Variables (for automation):')}
  ${ENV_VAULT_UNSEAL_KEY}   Unseal key for automatic unsealing
  ${ENV_VAULT_ROOT_TOKEN}   Root token for administrative operations

${pc.bold('Setup flow:')}
  1. Run ${pc.cyan('vibekit init')} to set up Vault (save displayed credentials!)
  2. Run ${pc.cyan('vibekit vault token create')} to create an MCP token
  3. Run ${pc.cyan('vibekit vault start')} after reboots (prompts for unseal key)
  4. Create accounts with ${pc.cyan('vibekit account create <name>')}

${pc.bold('Example:')}
  vibekit init                            # First-time setup (save credentials!)
  vibekit vault token create              # Create MCP token (32-day TTL)
  vibekit vault token create --ttl 30d    # Token with 30-day TTL
  vibekit vault status                    # Check status
  vibekit vault unseal                    # Unseal after restart
  vibekit vault token revoke              # Revoke MCP token if compromised
`

export const VAULT_TOKEN_HELP = `
${pc.bold('vibekit vault token')} - Manage MCP tokens

${pc.bold('Usage:')}
  vibekit vault token <command>

${pc.bold('Commands:')}
  create [--ttl <duration>]  Create a new MCP token
  revoke                     Revoke the current MCP token
  status                     Show MCP token information

${pc.bold('Options:')}
  --ttl <duration>  Token time-to-live (e.g., 30d, 720h). Default: 768h (32 days)

${pc.bold('Description:')}
  MCP tokens have limited permissions (sign and read keys only).
  MCP tokens are stored in your OS keyring for secure access by the MCP server.
`

/**
 * Prompt for Vault unseal key, checking env var first
 * @returns The unseal key or null if cancelled
 */
export async function promptForUnsealKey(): Promise<string | null> {
  const envKey = getUnsealKeyFromEnv()
  if (envKey) {
    return envKey
  }

  return passwordOrNull({
    message: 'Enter Vault unseal key:',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Unseal key is required'
      }
    },
  })
}

/**
 * Prompt for Vault root token, checking env var first
 * @returns The root token or null if cancelled
 */
export async function promptForRootToken(): Promise<string | null> {
  const envToken = getRootTokenFromEnv()
  if (envToken) {
    return envToken
  }

  return passwordOrNull({
    message: 'Enter Vault root token:',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Root token is required'
      }
    },
  })
}

/**
 * Get root token from env or prompt
 * @returns The root token or null if cancelled
 */
export async function getRootToken(): Promise<string | null> {
  const envToken = getRootTokenFromEnv()
  if (envToken) {
    return envToken
  }

  return promptForRootToken()
}

/**
 * Confirm creating a new MCP token when one already exists
 * @returns true if user confirms, false if declined, null if cancelled
 */
export async function confirmCreateNewToken(): Promise<boolean | null> {
  return confirmOrNull(
    'An MCP token already exists. Create a new one? (The old one will remain valid until revoked)',
    true
  )
}

/**
 * Confirm revoking the MCP token
 * @returns true if user confirms, false if declined, null if cancelled
 */
export async function confirmRevokeToken(): Promise<boolean | null> {
  return confirmOrNull(
    'Are you sure you want to revoke the MCP token? The MCP server will stop working until a new token is created.',
    false
  )
}
