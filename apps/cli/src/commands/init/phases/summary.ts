/**
 * Summary phase - display final status and next steps
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import type { SetupContext } from '../../../types'
import { getEnabledAgents } from '../../../config'

function formatStatus(ok: boolean, skipMsg?: string): string {
  return ok ? pc.green('configured') : pc.yellow(skipMsg || 'skipped')
}

function formatProviderStatus(context: SetupContext): string {
  const configured: string[] = []

  if (context.vaultStatus === 'completed') {
    configured.push('Vault')
  }
  if (context.keyringStatus === 'completed') {
    configured.push('Keyring')
  }

  if (configured.length === 0) {
    return pc.yellow('none (run: vibekit init)')
  }

  return pc.green(`${configured.join(' + ')} (configured)`)
}

function buildToolCommand(context: SetupContext): string | undefined {
  const enabledAgents = getEnabledAgents(context.agents)
  const commands = enabledAgents.map((a) => a.cliCommand).filter((cmd): cmd is string => !!cmd)

  if (commands.length === 0) {
    return undefined
  }

  if (commands.length === 1) {
    return commands[0]
  }

  // Multiple agents: suggest the first one with alternatives
  return `${commands[0]} (or ${commands.slice(1).join(', ')})`
}

export async function showSummaryStep(context: SetupContext): Promise<void> {
  const toolCmd = buildToolCommand(context)

  const lines = [
    `${pc.bold('Status:')}`,
    `  Provider:   ${formatProviderStatus(context)}`,
    `  GitHub:     ${formatStatus(context.configureGithub)}`,
    `  Kappa:      ${formatStatus(context.kappaAuthStatus === 'completed')}`,
    `  Dispenser:  ${formatStatus(context.dispenserAuthStatus === 'completed')}`,
    '',
    `${pc.bold('Next Steps:')}`,
    `  ${pc.cyan('cd')} ${context.skillsPath}`,
  ]

  if (toolCmd) {
    lines.push(`  ${pc.cyan(toolCmd)}`)
  }

  // Add VS Code setup note if Copilot is enabled
  const enabledAgents = getEnabledAgents(context.agents)
  const hasCopilot = enabledAgents.some((a) => a.id === 'copilot')

  if (hasCopilot) {
    lines.push('')
    lines.push(`${pc.bold('VS Code Setup:')}`)
    lines.push(`  Enable "Agent Skills" in Settings (search "agentskills")`)
  }

  p.note(lines.join('\n'), 'Setup Complete')
}
