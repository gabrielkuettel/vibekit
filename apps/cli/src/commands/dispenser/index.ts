/**
 * Dispenser command - TestNet Dispenser authentication
 *
 * Consolidated CLI commands for dispenser management.
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { performDispenserLogin } from '../../lib/dispenser/login'
import { hasDispenserToken } from '../../lib/dispenser'
import { createKeyringStore, KEYRING_KEYS } from '@vibekit/keyring'
import { lazy } from '../../utils/lazy'
import { withSpinner } from '../../utils/spinner'
import {
  DISPENSER_HELP,
  confirmReplaceDispenserToken,
  confirmDispenserLogout,
  displayLoginInstructions,
  displayLoginSuccess,
} from './prompts'

const getStore = lazy(() => createKeyringStore())

async function dispenserLogin(): Promise<void> {
  p.intro(pc.cyan('TestNet Dispenser Login'))

  if (await hasDispenserToken()) {
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

  if (!(await hasDispenserToken())) {
    p.log.info('No dispenser token found')
    return
  }

  const confirmed = await confirmDispenserLogout()
  if (confirmed === null || !confirmed) {
    p.log.info('Logout cancelled')
    return
  }

  await withSpinner(
    { start: 'Removing token...', success: 'Token removed', fail: 'Failed to remove token' },
    () => getStore().delete(KEYRING_KEYS.DISPENSER_TOKEN)
  )

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
