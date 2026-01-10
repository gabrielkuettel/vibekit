/**
 * Config phase - gather user configuration (tool, path, GitHub PAT)
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { text, password, confirm, select, multiselect } from '../../../utils/prompts'
import { expandPath } from '../../../utils/paths'
import { URLS } from '../../../config'
import { isValidGitHubPATFormat } from '../../../utils/validation'
import { hasGithubToken } from '../../../lib/vault'
import { AGENTS, AGENT_IDS, type AgentId } from '../../../config'
import type { SkillsPath } from '../../../types'

function buildAgentOptions(): { value: AgentId; label: string }[] {
  return AGENT_IDS.map((id) => ({
    value: id,
    label: AGENTS[id].displayName,
  }))
}

export async function selectToolStep(): Promise<AgentId[]> {
  const options = buildAgentOptions()
  return multiselect({
    message: 'Which AI coding tools are you using?',
    options,
    required: true,
  })
}

export async function selectSkillsLocationStep(): Promise<SkillsPath> {
  const cwd = process.cwd()
  const inputPath = await text({
    message: 'Where should VibeKit be installed?',
    placeholder: cwd,
    defaultValue: cwd,
  })
  return expandPath(inputPath)
}

export interface GitHubPATResult {
  configureGithub: boolean
  pat?: string
}

async function promptForPatRaw(): Promise<string> {
  return password({
    message: 'Enter your GitHub PAT (or press Enter to skip):',
  })
}

async function confirmContinueWithPat(): Promise<boolean> {
  return confirm('Continue with this PAT anyway?', false)
}

async function promptConfigureGithub(): Promise<boolean> {
  return select({
    message: 'Would you like to configure GitHub integration?',
    options: [
      {
        value: true,
        label: 'Yes, configure GitHub integration',
        hint: 'strongly recommended',
      },
      {
        value: false,
        label: 'No, skip for now',
        hint: 'can configure later',
      },
    ],
  })
}

async function promptForPat(): Promise<string | undefined> {
  const pat = await promptForPatRaw()

  // Handle empty input (skip)
  if (!pat || pat.trim() === '') {
    p.log.warn('GitHub PAT skipped. You can add GITHUB_TOKEN to your MCP config later.')
    return undefined
  }

  if (!isValidGitHubPATFormat(pat)) {
    p.log.warn(`PAT doesn't match expected format (ghp_* or github_pat_*)`)

    const continueAnyway = await confirmContinueWithPat()
    if (!continueAnyway) {
      return promptForPat()
    }
  } else {
    p.log.success('PAT format looks valid.')
  }

  return pat
}

export async function setupGithubPatStep(): Promise<GitHubPATResult> {
  if (await hasGithubToken()) {
    p.log.success('GitHub PAT already configured')
    return { configureGithub: true, pat: undefined }
  }

  const shouldConfigure = await promptConfigureGithub()

  if (!shouldConfigure) {
    p.note(
      [
        'You can configure GitHub integration later by adding GITHUB_TOKEN',
        'to the GITHUB_TOKEN environment variable in your MCP config.',
      ].join('\n'),
      'GitHub Integration Skipped'
    )

    return { configureGithub: false }
  }

  p.note(
    [
      'GitHub integration enables the AI to search Algorand repositories',
      'for canonical examples and patterns. This significantly improves',
      'code generation quality.',
      '',
      `Create a PAT at: ${pc.cyan(URLS.githubPatSettings)}`,
      '',
      `Required scopes: ${pc.yellow('repo')}, ${pc.yellow('read:org')}`,
      '',
      pc.dim('Note: Token must have an expiration date to work.'),
    ].join('\n'),
    'GitHub Personal Access Token'
  )

  const pat = await promptForPat()
  return { configureGithub: true, pat }
}
