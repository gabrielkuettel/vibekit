/**
 * Auth phase - Kappa MCP and dispenser authentication
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { hyperlink } from '../../../lib/dispenser/auth'
import { performDispenserLogin } from '../../../lib/dispenser/login'
import { hasDispenserToken } from '../../../lib/dispenser'
import { getEnabledAgents, type AgentSelection } from '../../../config'
import type { SkillsPath, StepStatus } from '../../../types'
import { confirm } from '../../../utils/prompts'

export async function authKappaStep(
  agents: AgentSelection,
  _skillsPath: SkillsPath
): Promise<StepStatus> {
  const enabledAgents = getEnabledAgents(agents)

  for (const agent of enabledAgents) {
    if (agent.authInstructions) {
      p.note(agent.authInstructions, `${agent.displayName} Kappa Auth`)
    }
  }

  return 'completed'
}

async function confirmDispenserAuth(): Promise<boolean> {
  return confirm('Authenticate TestNet Dispenser?', true)
}

export async function dispenserLoginStep(): Promise<StepStatus> {
  if (await hasDispenserToken()) {
    return 'completed'
  }

  const shouldAuth = await confirmDispenserAuth()
  if (!shouldAuth) {
    return 'skipped'
  }

  const s = p.spinner()

  const result = await performDispenserLogin(s, {
    showInstructions: (deviceCode) => {
      p.note(
        [
          `1. Open: ${hyperlink(deviceCode.verification_uri, pc.cyan(deviceCode.verification_uri))}`,
          `2. Enter: ${pc.bold(pc.yellow(deviceCode.user_code))}`,
          '',
          pc.dim('Press c to copy code'),
        ].join('\n'),
        'Authenticate'
      )
    },
    onCopied: () => s.message('Waiting for authentication... (copied!)'),
    onSuccess: () => {},
    onError: () => false, // suppress errors, return 'skipped'
  })

  return result.token ? 'completed' : 'skipped'
}
