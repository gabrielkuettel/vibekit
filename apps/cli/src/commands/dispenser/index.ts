/**
 * Dispenser command - TestNet Dispenser authentication
 *
 * Consolidated CLI commands for dispenser management.
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { performDispenserLogin } from '../../lib/dispenser/login'
import { hasDispenserToken } from '../../lib/dispenser'
import { deleteDispenserToken } from '@vibekit/db'
import {
  DISPENSER_HELP,
  confirmReplaceDispenserToken,
  confirmDispenserLogout,
  displayLoginInstructions,
  displayLoginSuccess,
} from './prompts'

async function dispenserLogin(): Promise<void> {
  p.intro(pc.cyan('TestNet Dispenser Login'))

  if (hasDispenserToken()) {
    const proceed = await confirmReplaceDispenserToken()
    if (proceed === null || !proceed) {
      p.log.info('Login cancelled')
      return
    }
  }

  const s = p.spinner()

  const result = await performDispenserLogin(s, {
    showInstructions: displayLoginInstructions,
    onCopied: () => s.message('Waiting for authentication... (copied!)'),
    onSuccess: () => {},
    onError: (err) => {
      p.log.error(err.message)
      process.exit(1)
    },
  })

  if (result.token) {
    p.outro(pc.green('Dispenser login successful!'))
    displayLoginSuccess()
  }
}

async function dispenserLogout(): Promise<void> {
  p.intro(pc.cyan('Dispenser Logout'))

  if (!hasDispenserToken()) {
    p.log.info('No dispenser token found')
    return
  }

  const confirmed = await confirmDispenserLogout()
  if (confirmed === null || !confirmed) {
    p.log.info('Logout cancelled')
    return
  }

  deleteDispenserToken()
  p.outro(pc.green('Logged out of dispenser'))
}

function dispenserHelp(): void {
  console.log(DISPENSER_HELP)
}

export async function commandDispenser(args: string[]): Promise<void> {
  const cmd = args[0]

  switch (cmd) {
    case 'login':
      await dispenserLogin()
      break
    case 'logout':
      await dispenserLogout()
      break
    case '--help':
    case '-h':
    case 'help':
    case undefined:
      dispenserHelp()
      break
    default:
      p.log.error(`Unknown command: ${cmd}`)
      p.log.message(pc.dim('Run "vibekit dispenser --help" for usage.'))
      process.exit(1)
  }
}
