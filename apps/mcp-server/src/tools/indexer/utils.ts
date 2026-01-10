/**
 * Indexer Tool Utilities
 *
 * Shared helpers for formatting indexer responses.
 */

import { createHash } from 'crypto'

/**
 * Hash a program to a short SHA256 prefix.
 * Accepts either base64-encoded string or Uint8Array.
 * Reduces response size while still allowing program identification.
 */
export function hashProgram(program: string | Uint8Array): string {
  try {
    const bytes =
      program instanceof Uint8Array ? Buffer.from(program) : Buffer.from(program, 'base64')
    const hash = createHash('sha256').update(bytes).digest('hex')
    return hash.substring(0, 16) // First 16 hex chars (64 bits)
  } catch {
    return 'invalid'
  }
}

/**
 * Safely decode a base64 string to UTF-8 text.
 * Returns the original string if decoding fails.
 */
export function decodeBase64(base64: string): string {
  try {
    return Buffer.from(base64, 'base64').toString('utf-8')
  } catch {
    return base64
  }
}

/**
 * Map of on-completion values to human-readable names.
 */
export const ON_COMPLETE_MAP: Record<number, string> = {
  0: 'NoOp',
  1: 'OptIn',
  2: 'CloseOut',
  3: 'ClearState',
  4: 'UpdateApplication',
  5: 'DeleteApplication',
}

/**
 * Map of transaction types to human-readable names.
 */
export const TX_TYPE_MAP: Record<string, string> = {
  pay: 'Payment',
  keyreg: 'KeyRegistration',
  acfg: 'AssetConfig',
  axfer: 'AssetTransfer',
  afrz: 'AssetFreeze',
  appl: 'Application',
  stpf: 'StateProof',
}
