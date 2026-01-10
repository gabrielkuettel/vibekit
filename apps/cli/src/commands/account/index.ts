/**
 * Account command - dangerous account operations (rekey, remove)
 *
 * Only dangerous operations that require human confirmation.
 * Regular account operations (create, list, fund) go through MCP tools.
 */

import pc from 'picocolors'
import * as p from '@clack/prompts'
import type { Network, ProviderType } from '../../lib/account/types'
import { accountRekeyToSelf } from './rekey'
import { accountRemove } from './remove'
import { ACCOUNT_HELP } from './prompts'

function parseProviderFlag(args: string[]): ProviderType {
  const providerFlag = args.find((a) => a.startsWith('--provider='))

  if (!providerFlag) {
    p.log.error('--provider flag is required')
    p.log.message(pc.dim('Usage: vibekit account <command> <name> --provider=vault|keyring'))
    process.exit(1)
  }

  const provider = providerFlag.split('=')[1]
  if (provider !== 'vault' && provider !== 'keyring') {
    p.log.error(`Invalid provider "${provider}"`)
    p.log.message(pc.dim('Valid providers: vault, keyring'))
    process.exit(1)
  }

  return provider
}

function accountHelp(): void {
  console.log(ACCOUNT_HELP)
}

function parseAccountArgs(args: string[]): { network: Network } {
  let network: Network = 'mainnet'

  for (let i = 0; i < args.length; i++) {
    // Support both --network=value and --network value formats
    if (args[i].startsWith('--network=')) {
      const n = args[i].split('=')[1].toLowerCase()
      if (n === 'mainnet' || n === 'testnet' || n === 'localnet') {
        network = n
      }
    } else if (args[i] === '--network' && args[i + 1]) {
      const n = args[i + 1].toLowerCase()
      if (n === 'mainnet' || n === 'testnet' || n === 'localnet') {
        network = n
      }
    }
  }

  return { network }
}

export async function commandAccount(args: string[]): Promise<void> {
  const cmd = args[0]
  const name = args[1]
  const { network } = parseAccountArgs(args)

  switch (cmd) {
    case 'rekey-to-self': {
      if (!name) {
        p.log.error('Account name is required')
        p.log.message(
          pc.dim('Usage: vibekit account rekey-to-self <name> --provider=vault --network=<network>')
        )
        process.exit(1)
      }
      const provider = parseProviderFlag(args)
      await accountRekeyToSelf(name, network, provider)
      break
    }
    case 'remove': {
      if (!name) {
        p.log.error('Account name is required')
        p.log.message(pc.dim('Usage: vibekit account remove <name> --provider=vault|keyring'))
        process.exit(1)
      }
      const provider = parseProviderFlag(args)
      await accountRemove(name, provider)
      break
    }
    case '--help':
    case '-h':
    case 'help':
    case undefined:
      accountHelp()
      break
    default:
      p.log.error(`Unknown command: ${cmd}`)
      p.log.message(pc.dim('Run "vibekit account --help" for usage.'))
      process.exit(1)
  }
}
