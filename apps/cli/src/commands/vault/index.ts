/**
 * Vault command - manage HashiCorp Vault
 *
 * Consolidated CLI commands for Vault lifecycle management.
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { vaultStart, vaultStop, vaultUnseal } from './lifecycle'
import { vaultStatus } from './status'
import {
  vaultTokenCreate,
  vaultTokenRevoke,
  vaultTokenStatus,
  vaultTokenHelp,
  parseTokenArgs,
} from './token'
import { VAULT_HELP } from './prompts'

function vaultHelp(): void {
  console.log(VAULT_HELP)
}

export async function commandVault(args: string[]): Promise<void> {
  const cmd = args[0]

  if (cmd === 'token') {
    const tokenCmd = args[1]
    const { ttl } = parseTokenArgs(args.slice(2))

    switch (tokenCmd) {
      case 'create':
        await vaultTokenCreate(ttl)
        break
      case 'revoke':
        await vaultTokenRevoke()
        break
      case 'status':
        await vaultTokenStatus()
        break
      case '--help':
      case '-h':
      case 'help':
      case undefined:
        vaultTokenHelp()
        break
      default:
        p.log.error(`Unknown command: ${tokenCmd}`)
        p.log.message(pc.dim('Run "vibekit vault token --help" for usage.'))
        process.exit(1)
    }
    return
  }

  switch (cmd) {
    case 'start':
      await vaultStart()
      break
    case 'stop':
      await vaultStop()
      break
    case 'unseal':
      await vaultUnseal()
      break
    case 'status':
      await vaultStatus()
      break
    case '--help':
    case '-h':
    case 'help':
    case undefined:
      vaultHelp()
      break
    default:
      p.log.error(`Unknown command: ${cmd}`)
      p.log.message(pc.dim('Run "vibekit vault --help" for usage.'))
      process.exit(1)
  }
}
