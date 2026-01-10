/**
 * Prompt helpers - reduce boilerplate for @clack/prompts with cancellation handling
 *
 * These helpers automatically handle cancellation (exits process) and return
 * properly typed values, eliminating repetitive handleCancel wrapping.
 */

import * as p from '@clack/prompts'

/**
 * Handle clack cancel - exits if cancelled, returns value otherwise.
 * Re-exported for cases where more control is needed.
 */
export function handleCancel<T>(value: T | symbol, message = 'Setup cancelled.'): T {
  if (p.isCancel(value)) {
    p.cancel(message)
    process.exit(0)
  }
  return value
}

/**
 * Confirm prompt that exits on cancel
 */
export async function confirm(message: string, initialValue = false): Promise<boolean> {
  return handleCancel(await p.confirm({ message, initialValue })) as boolean
}

/**
 * Select prompt that exits on cancel.
 * Pass the same options object you would pass to p.select.
 */
export async function select<T extends Parameters<typeof p.select>[0]>(
  options: T
): Promise<T['options'][number]['value']> {
  return handleCancel(await p.select(options)) as T['options'][number]['value']
}

/**
 * Text input prompt that exits on cancel
 */
export async function text(options: Parameters<typeof p.text>[0]): Promise<string> {
  return handleCancel(await p.text(options)) as string
}

/**
 * Password input prompt that exits on cancel
 */
export async function password(options: Parameters<typeof p.password>[0]): Promise<string> {
  return handleCancel(await p.password(options)) as string
}

/**
 * Multi-select prompt that exits on cancel.
 * Pass the same options object you would pass to p.multiselect.
 */
export async function multiselect<T extends Parameters<typeof p.multiselect>[0]>(
  options: T
): Promise<T['options'][number]['value'][]> {
  return handleCancel(await p.multiselect(options)) as T['options'][number]['value'][]
}

// --- OrNull variants: return null on cancel instead of exiting ---
// Use these for commands where cancellation should return to the caller

/**
 * Confirm prompt that returns null on cancel (for commands)
 */
export async function confirmOrNull(
  message: string,
  initialValue = false
): Promise<boolean | null> {
  const result = await p.confirm({ message, initialValue })
  return p.isCancel(result) ? null : result
}

/**
 * Text prompt that returns null on cancel (for commands)
 */
export async function textOrNull(options: Parameters<typeof p.text>[0]): Promise<string | null> {
  const result = await p.text(options)
  return p.isCancel(result) ? null : (result as string)
}

/**
 * Password prompt that returns null on cancel (for commands)
 */
export async function passwordOrNull(
  options: Parameters<typeof p.password>[0]
): Promise<string | null> {
  const result = await p.password(options)
  return p.isCancel(result) ? null : (result as string)
}
