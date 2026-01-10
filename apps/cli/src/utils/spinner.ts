/**
 * Spinner utility for async operations with error handling
 */

import * as p from '@clack/prompts'

interface SpinnerMessages {
  start: string
  success: string
  fail: string
}

/**
 * Run an async operation with a spinner, handling errors consistently.
 * On failure, logs the error and exits with code 1.
 */
export async function withSpinner<T>(msg: SpinnerMessages, fn: () => Promise<T>): Promise<T> {
  const s = p.spinner()
  s.start(msg.start)
  try {
    const result = await fn()
    s.stop(msg.success)
    return result
  } catch (error) {
    s.stop(msg.fail)
    p.log.error(error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}
