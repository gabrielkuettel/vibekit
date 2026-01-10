/**
 * Docker check phase - verify Docker and Docker Compose availability
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import * as p from '@clack/prompts'
import pc from 'picocolors'

const execAsync = promisify(exec)

export interface DockerCheckResult {
  available: boolean
  running: boolean
}

async function checkDocker(): Promise<boolean> {
  try {
    await execAsync('docker --version')
    return true
  } catch {
    return false
  }
}

async function checkDockerCompose(): Promise<boolean> {
  try {
    await execAsync('docker compose version')
    return true
  } catch {
    try {
      await execAsync('docker-compose --version')
      return true
    } catch {
      return false
    }
  }
}

async function checkDockerRunning(): Promise<boolean> {
  try {
    await execAsync('docker info')
    return true
  } catch {
    return false
  }
}

interface DockerCheck {
  check: () => Promise<boolean>
  failMessage: string
  warnMessage: string
  infoMessage: string
  extraMessage?: string
  partialResult?: DockerCheckResult
}

const DOCKER_CHECKS: DockerCheck[] = [
  {
    check: checkDocker,
    failMessage: 'Docker not found',
    warnMessage: 'Docker is not installed.',
    infoMessage: 'Vault setup will be skipped. Install Docker to enable secure key management.',
    extraMessage: 'https://docs.docker.com/get-docker/',
  },
  {
    check: checkDockerCompose,
    failMessage: 'Docker Compose not found',
    warnMessage: 'Docker Compose is not available.',
    infoMessage: 'Vault setup will be skipped. Docker Compose is included with Docker Desktop.',
  },
  {
    check: checkDockerRunning,
    failMessage: 'Docker not running',
    warnMessage: 'Docker is installed but not running.',
    infoMessage: 'Vault setup will be skipped. Start Docker and run setup again.',
    partialResult: { available: true, running: false },
  },
]

export async function checkDockerStep(): Promise<DockerCheckResult> {
  const s = p.spinner()
  s.start('Checking Docker...')

  for (const {
    check,
    failMessage,
    warnMessage,
    infoMessage,
    extraMessage,
    partialResult,
  } of DOCKER_CHECKS) {
    if (!(await check())) {
      s.stop(failMessage)
      p.log.warn(warnMessage)
      p.log.info(infoMessage)
      if (extraMessage) {
        p.log.message(`  ${pc.cyan(extraMessage)}`)
      }
      return partialResult ?? { available: false, running: false }
    }
  }

  s.stop('Docker ready')
  return { available: true, running: true }
}
