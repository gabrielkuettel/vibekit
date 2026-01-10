/**
 * Dispenser command prompts - help text and user interaction prompts
 */

import pc from 'picocolors'

import { hyperlink } from '../../lib/dispenser/auth'
import { confirmOrNull } from '../../utils/prompts'
import type { DeviceCodeResponse } from '../../lib/dispenser/auth'

export const DISPENSER_HELP = `
${pc.bold('vibekit dispenser')} - TestNet Dispenser authentication

${pc.bold('Usage:')}
  vibekit dispenser <command>

${pc.bold('Commands:')}
  login     Authenticate with the TestNet Dispenser API
  logout    Remove saved dispenser token

${pc.bold('Description:')}
  The TestNet Dispenser provides free ALGO for testing on Algorand TestNet.
  Authentication is required to use the dispenser API.

  Token status is shown in ${pc.cyan('vibekit status')}.

${pc.bold('Token Storage:')}
  Token is stored in the OS keyring (service: vibekit, account: config:dispenser-token)
  The MCP server reads this token when connecting to TestNet.

${pc.bold('Example:')}
  vibekit dispenser login     # Authenticate (opens browser)
  vibekit dispenser logout    # Remove saved token
`

export async function confirmReplaceDispenserToken(): Promise<boolean | null> {
  return confirmOrNull('A dispenser token already exists. Replace it?', true)
}

export async function confirmDispenserLogout(): Promise<boolean | null> {
  return confirmOrNull('Remove saved dispenser token?', false)
}

export function displayLoginInstructions(deviceCode: DeviceCodeResponse): void {
  console.log()
  console.log(pc.bold('To authenticate:'))
  console.log()
  console.log(
    `  ${pc.cyan('1.')} Navigate to: ${hyperlink(deviceCode.verification_uri, pc.cyan(deviceCode.verification_uri))}`
  )
  console.log()
  console.log(`  ${pc.cyan('2.')} Enter code:  ${pc.bold(pc.yellow(deviceCode.user_code))}`)
  console.log()
  console.log(pc.dim(`  Or open: ${hyperlink(deviceCode.verification_uri_complete)}`))
  console.log()
  console.log(pc.dim('  Press c to copy code'))
  console.log()
}

export function displayLoginSuccess(): void {
  console.log(`
${pc.bold('Token saved to:')}
  ${pc.cyan('OS keyring (vibekit/config:dispenser-token)')}

${pc.bold('Usage:')}
  The MCP server will automatically use this token when switched to testnet.
  Use ${pc.cyan('fund_account')} tool to fund accounts on TestNet.

${pc.bold('Token validity:')}
  Tokens are valid for 30 days. Run this command again to refresh.
`)
}
