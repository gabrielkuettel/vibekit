/**
 * Remove command prompts - user interaction and display for remove operations
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { confirmOrNull } from '../../utils/prompts'

/**
 * Display warning about what will be removed
 */
export function displayRemoveWarning(vibekitDir: string): void {
  console.log()
  p.log.warn(pc.bold('This will permanently delete:'))
  console.log()
  p.log.message(`  ${pc.red('1.')} Vault container and all its data volumes`)
  p.log.message(`     ${pc.dim('- All keys stored in Vault will be lost')}`)
  p.log.message(`     ${pc.dim('- Container: vibekit-vault')}`)
  p.log.message(`     ${pc.dim('- Volumes: vibekit-vault-data, vibekit-vault-logs')}`)
  console.log()
  p.log.message(`  ${pc.red('2.')} Secrets stored in OS keyring`)
  p.log.message(`     ${pc.dim('- Vault credentials (root token, seal keys, MCP token)')}`)
  p.log.message(`     ${pc.dim('- Account mnemonics and private keys (keyring provider)')}`)
  p.log.message(`     ${pc.dim('- GitHub PAT and TestNet dispenser token')}`)
  console.log()
  p.log.message(`  ${pc.red('3.')} Configuration directory`)
  p.log.message(`     ${pc.dim(`- ${vibekitDir}`)}`)
  p.log.message(`     ${pc.dim('- MCP tokens, account configs, docker-compose.yml')}`)
  console.log()
  p.log.info(
    `Project files (skills, MCP configs in your project) will ${pc.green('NOT')} be removed`
  )
  console.log()
}

/**
 * Confirm removing all VibeKit data
 * @returns true if confirmed, false if declined, null if cancelled
 */
export async function confirmRemove(): Promise<boolean | null> {
  return confirmOrNull('Are you sure you want to remove VibeKit? This cannot be undone.')
}
