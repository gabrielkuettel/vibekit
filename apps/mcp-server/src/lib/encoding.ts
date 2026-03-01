/**
 * Centralized Byte Encoding Utilities
 *
 * Shared functions for encoding/decoding bytes across MCP tools.
 * Provides consistent handling of base64 and UTF-8 conversions.
 */

/**
 * Decode a base64 string to UTF-8 text.
 * Falls back to the original string if decoding fails.
 */
export function decodeBase64(base64: string): string {
  try {
    return atob(base64)
  } catch {
    return base64
  }
}

/**
 * Convert bytes to a UTF-8 string.
 * If input is already a string, attempts base64 decode first.
 */
export function bytesToString(bytes: Uint8Array | string): string {
  if (typeof bytes === 'string') {
    return decodeBase64(bytes)
  }
  return new TextDecoder().decode(bytes)
}

/**
 * Convert bytes to a base64 string.
 * If input is already a string, returns it unchanged.
 */
export function bytesToBase64(bytes: Uint8Array | string): string {
  if (typeof bytes === 'string') {
    return bytes
  }
  return Buffer.from(bytes).toString('base64')
}

/**
 * Encode a Uint8Array to base64.
 */
export function encodeBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}
