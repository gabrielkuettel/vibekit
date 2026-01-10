/**
 * Core Dispenser Login Flow
 *
 * Shared authentication logic used by both the init wizard step and standalone command.
 */

import * as readline from 'readline'

import { requestDeviceCode, pollForToken, type DeviceCodeResponse } from './auth'
import { createKeyringStore, KEYRING_KEYS } from '@vibekit/keyring'
import { copyToClipboard } from '../../utils/clipboard'

export interface SpinnerLike {
  start(message?: string): void
  stop(message?: string): void
  message(message: string): void
}

export interface LoginCallbacks {
  /** Called to display auth instructions after device code is received */
  showInstructions(deviceCode: DeviceCodeResponse): void
  /** Called when code is copied to clipboard */
  onCopied(): void
  /** Called on successful auth, before saving token */
  onSuccess(): void
  /** Called on error - return true to throw, false to suppress */
  onError(error: Error): boolean
}

export interface LoginResult {
  token: string | null
  error?: Error
}

/**
 * Performs the dispenser device code login flow.
 *
 * This is the core login logic shared between the init wizard and standalone command.
 * Different UX presentations are handled via callbacks.
 */
export async function performDispenserLogin(
  spinner: SpinnerLike,
  callbacks: LoginCallbacks
): Promise<LoginResult> {
  spinner.start('Requesting authorization...')
  let deviceCode: DeviceCodeResponse
  try {
    deviceCode = await requestDeviceCode()
    spinner.stop('Authorization requested')
  } catch (error) {
    spinner.stop('Failed to request authorization')
    const err = error instanceof Error ? error : new Error('Unknown error')
    if (callbacks.onError(err)) {
      throw err
    }
    return { token: null, error: err }
  }

  callbacks.showInstructions(deviceCode)

  const rl = readline.createInterface({ input: process.stdin })
  readline.emitKeypressEvents(process.stdin, rl)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }

  let copied = false
  const keypressHandler = async (str: string | undefined, key: readline.Key | undefined) => {
    const keyName = key?.name ?? str
    if (keyName === 'c' && !key?.ctrl && !copied) {
      const success = await copyToClipboard(deviceCode.user_code)
      if (success) {
        copied = true
        callbacks.onCopied()
      }
    }
    if (key?.ctrl && keyName === 'c') {
      process.exit(0)
    }
  }

  process.stdin.on('keypress', keypressHandler)

  const cleanup = () => {
    process.stdin.removeListener('keypress', keypressHandler)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
    rl.close()
  }

  spinner.start('Waiting for authentication...')
  let token: string
  try {
    token = await pollForToken(deviceCode.device_code, deviceCode.interval, deviceCode.expires_in)
    spinner.stop('Authenticated')
  } catch (error) {
    spinner.stop('Authentication failed')
    cleanup()
    const err = error instanceof Error ? error : new Error('Unknown error')
    if (callbacks.onError(err)) {
      throw err
    }
    return { token: null, error: err }
  }

  cleanup()
  callbacks.onSuccess()

  try {
    const store = createKeyringStore()
    await store.set(KEYRING_KEYS.DISPENSER_TOKEN, token)
    return { token }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to save token')
    if (callbacks.onError(err)) {
      throw err
    }
    return { token: null, error: err }
  }
}
