/**
 * Account command prompts - user interaction prompts for account operations
 */

import pc from 'picocolors'
import algosdk from 'algosdk'

import { confirmOrNull, textOrNull } from '../../utils/prompts'

// Re-export promptForRootToken from vault/prompts (better version that checks env var first)
export { promptForRootToken } from '../vault/prompts'

export const ACCOUNT_HELP = `
${pc.bold('vibekit account')} - Dangerous account operations

${pc.bold('Usage:')}
  vibekit account <command> <name> --provider=<provider> [options]

${pc.bold('Commands:')}
  rekey-to-self <name>   Transfer control to your wallet (Vault only)
  remove <name>          Permanently delete account

${pc.bold('Options:')}
  --provider=<provider>   Provider: vault or keyring (required)
  --network=<network>     Network: mainnet, testnet, localnet (required for rekey-to-self)

${pc.bold('Examples:')}
  vibekit account rekey-to-self dev-wallet --provider=vault --network=testnet
  vibekit account remove old-wallet --provider=vault
  vibekit account remove old-wallet --provider=keyring

${pc.bold('Regular Account Operations:')}
  Most account operations are done through your AI coding agent:

    ${pc.cyan('create_account')}  - Create a new account
    ${pc.cyan('list_accounts')}   - List all accounts
    ${pc.cyan('fund_account')}    - Fund an account from dispenser
    ${pc.cyan('get_account_info')} - Get account balance and info

${pc.bold('Why CLI-only?')}
  These commands require human confirmation because they are:
  - ${pc.yellow('Irreversible')}: rekey permanently transfers signing authority
  - ${pc.yellow('Destructive')}: remove deletes keys that cannot be recovered
`

/**
 * Prompt for the address to rekey to
 * @returns The new auth address or null if cancelled
 */
export async function promptForRekeyAddress(): Promise<string | null> {
  return textOrNull({
    message: 'Enter the address to rekey TO (your wallet):',
    placeholder: 'ALGO...',
    validate: (value) => {
      if (!value) return 'Address is required'
      if (value.length !== 58) return 'Invalid Algorand address length'
      try {
        algosdk.decodeAddress(value)
      } catch {
        return 'Invalid Algorand address'
      }
    },
  })
}

/**
 * Confirm rekey operation
 * @returns true if confirmed, false if declined, null if cancelled
 */
export async function confirmRekeyOperation(): Promise<boolean | null> {
  return confirmOrNull('I understand. Proceed with rekey?', false)
}

/**
 * Confirm account removal
 * @returns true if confirmed, false if declined, null if cancelled
 */
export async function confirmAccountRemoval(): Promise<boolean | null> {
  return confirmOrNull('Are you sure you want to remove this account?', false)
}
