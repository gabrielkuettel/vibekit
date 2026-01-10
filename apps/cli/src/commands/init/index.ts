/**
 * Init command - interactive setup wizard
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'
import { join } from 'path'

import { confirm } from '../../utils/prompts'
import { welcome, detectOSStep } from './phases/system'
import { checkDockerStep } from './phases/docker'
import { installAlgokitStep } from './phases/algokit'
import { setupProvidersStep } from './phases/providers'
import { selectToolStep, selectSkillsLocationStep, setupGithubPatStep } from './phases/config'
import { generateConfigsStep, setupSkillsStep, setupAgentsMdStep } from './phases/create'
import { authKappaStep, dispenserLoginStep } from './phases/auth'
import { showSummaryStep } from './phases/summary'
import type { SetupContext } from '../../types'
import {
  getEnabledAgents,
  getAgentConfigPath,
  getAgentSkillsDir,
  getAgentTemplateFile,
  type AgentSelection,
} from '../../config'

/**
 * Confirm creating the project after preview
 * @returns true if confirmed, false if declined (helper exits on cancel)
 */
export async function confirmCreateProject(): Promise<boolean> {
  return confirm('Create project?', true)
}

/**
 * Build preview of files to be created
 */
function buildFilePreview(skillsPath: string, agents: AgentSelection): string[] {
  const lines: string[] = []

  for (const agent of getEnabledAgents(agents)) {
    const configPath = getAgentConfigPath(skillsPath, agent)
    if (configPath) {
      lines.push(`  ${pc.dim(configPath)}`)
    }

    const skillsDir = getAgentSkillsDir(skillsPath, agent)
    if (skillsDir) {
      lines.push(`  ${pc.dim(skillsDir)} ${pc.cyan('(skills from GitHub)')}`)
    }

    const templatePath = getAgentTemplateFile(skillsPath, agent)
    if (templatePath) {
      lines.push(`  ${pc.dim(templatePath)}`)
    }
  }

  // Always show AGENTS.md (shared canonical source)
  lines.push(`  ${pc.dim(join(skillsPath, 'AGENTS.md'))}`)

  return lines
}

/**
 * Run the interactive setup wizard
 */
export async function runSetupWizard(): Promise<void> {
  // Phase 1: Welcome & System Setup
  welcome()
  const os = await detectOSStep()
  await installAlgokitStep(os)
  const dockerResult = await checkDockerStep()

  // Phase 1.5: Provider Selection & Bootstrap
  const { vaultStatus, keyringStatus } = await setupProvidersStep(
    dockerResult.available,
    dockerResult.running
  )

  // Phase 2: Gather Configuration
  const agents = await selectToolStep()
  const skillsPath = await selectSkillsLocationStep()
  const patResult = await setupGithubPatStep()

  // Phase 3: Preview & Confirm
  const previewLines = buildFilePreview(skillsPath, agents)
  p.note(previewLines.join('\n'), 'Files to create')

  const confirmed = await confirmCreateProject()
  if (!confirmed) {
    p.cancel('Setup cancelled.')
    process.exit(0)
  }

  // Build context
  const context: SetupContext = {
    os,
    agents,
    skillsPath,
    githubPat: patResult.pat,
    configureGithub: patResult.configureGithub,
    dockerAvailable: dockerResult.available,
    dockerRunning: dockerResult.running,
    vaultStatus,
    keyringStatus,
    kappaAuthStatus: 'skipped',
    dispenserAuthStatus: 'skipped',
  }

  // Phase 4: Create Files
  const s = p.spinner()
  s.start('Creating project files...')
  try {
    await generateConfigsStep(context)
    s.message('Fetching skills from GitHub...')
    const skillsCount = await setupSkillsStep(agents, skillsPath)
    s.message('Creating agent files...')
    await setupAgentsMdStep(agents, skillsPath)
    s.stop(`Project created (${skillsCount} skills installed)`)
  } catch (error) {
    s.stop('Failed to create project')
    throw error
  }

  // Phase 5: Auth Steps
  context.kappaAuthStatus = await authKappaStep(agents, skillsPath)
  context.dispenserAuthStatus = await dispenserLoginStep()

  // Phase 6: Summary
  await showSummaryStep(context)
  p.outro(pc.green('The vibes are immaculate 😎'))
}

/**
 * Handle init command
 */
export async function commandInit(): Promise<void> {
  try {
    await runSetupWizard()
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(`Setup failed: ${error.message}`)
    } else {
      p.log.error('Setup failed with an unexpected error')
    }
    process.exit(1)
  }
}
