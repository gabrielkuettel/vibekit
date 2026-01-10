/**
 * Centralized Validation Module
 *
 * Reusable validators for MCP tool arguments.
 * Provides consistent validation and error messages across all tools.
 */

// ============================================================================
// Address Validation
// ============================================================================

/**
 * Validate a required Algorand address.
 * @throws Error if address is missing or invalid
 */
export function validateRequiredAddress(
  address: string | undefined,
  fieldName: string
): asserts address is string {
  if (!address) {
    throw new Error(`${fieldName} is required`)
  }
  if (address.length !== 58) {
    throw new Error(`Invalid ${fieldName}: must be 58 characters`)
  }
}

/**
 * Validate an optional Algorand address.
 * @param allowEmpty - If true, empty string is valid (for clearing addresses)
 * @throws Error if address is provided but invalid
 */
export function validateOptionalAddress(
  address: string | undefined,
  fieldName: string,
  allowEmpty = false
): void {
  if (address === undefined) {
    return
  }
  if (allowEmpty && address === '') {
    return
  }
  if (address.length !== 58) {
    const message = allowEmpty
      ? `Invalid ${fieldName}: must be 58 characters or empty string`
      : `Invalid ${fieldName}: must be 58 characters`
    throw new Error(message)
  }
}

// ============================================================================
// Numeric Validation
// ============================================================================

/**
 * Validate a required ID (asset ID, app ID, etc.).
 * Must be defined and non-negative.
 * @throws Error if ID is missing or negative
 */
export function validateRequiredId(
  value: number | undefined,
  fieldName: string
): asserts value is number {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`)
  }
  if (value < 0) {
    throw new Error(`${fieldName} must be non-negative`)
  }
}

/**
 * Validate a required amount (for transfers, etc.).
 * Must be defined and non-negative.
 * @throws Error if amount is missing or negative
 */
export function validateRequiredAmount(
  value: number | undefined,
  fieldName = 'amount'
): asserts value is number {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`)
  }
  if (value < 0) {
    throw new Error(`${fieldName} must be non-negative`)
  }
}

/**
 * Validate a required positive amount (e.g., total supply).
 * Must be defined and at least 1.
 * @throws Error if amount is missing or less than 1
 */
export function validateRequiredPositiveAmount(
  value: number | undefined,
  fieldName = 'amount'
): asserts value is number {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`)
  }
  if (value < 1) {
    throw new Error(`${fieldName} must be at least 1`)
  }
}

/**
 * Validate decimals for asset creation.
 * Must be between 0 and 19.
 * @throws Error if decimals is out of range
 */
export function validateDecimals(decimals: number): void {
  if (decimals < 0 || decimals > 19) {
    throw new Error('decimals must be between 0 and 19')
  }
}

// ============================================================================
// Byte Length Validation
// ============================================================================

/**
 * Validate a string's byte length.
 * @throws Error if string exceeds max bytes
 */
export function validateByteLength(
  value: string | undefined,
  fieldName: string,
  maxBytes: number
): void {
  if (value && new TextEncoder().encode(value).length > maxBytes) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxBytes} bytes`)
  }
}

/**
 * Validate a transaction note.
 * Max 1000 bytes.
 */
export function validateNote(note: string | undefined): void {
  validateByteLength(note, 'note', 1000)
}

/**
 * Validate an asset name.
 * Max 32 bytes.
 */
export function validateAssetName(name: string | undefined): void {
  validateByteLength(name, 'assetName', 32)
}

/**
 * Validate an asset unit name.
 * Max 8 bytes.
 */
export function validateUnitName(name: string | undefined): void {
  validateByteLength(name, 'unitName', 8)
}

/**
 * Validate an asset URL.
 * Max 96 bytes.
 */
export function validateAssetUrl(url: string | undefined): void {
  validateByteLength(url, 'url', 96)
}

// ============================================================================
// Specialized Validation
// ============================================================================

/**
 * Validate and parse a metadata hash.
 * Accepts 64 hex characters or 44 base64 characters (both = 32 bytes).
 * @returns Uint8Array of 32 bytes, or undefined if not provided
 * @throws Error if hash is invalid
 */
export function validateMetadataHash(hash: string | undefined): Uint8Array | undefined {
  if (!hash) {
    return undefined
  }

  let bytes: Uint8Array

  if (hash.length === 64) {
    // Hex encoded
    const matches = hash.match(/.{2}/g)
    if (!matches) {
      throw new Error('metadataHash must be 64 hex characters or 44 base64 characters (32 bytes)')
    }
    bytes = new Uint8Array(matches.map((byte) => parseInt(byte, 16)))
  } else if (hash.length === 44) {
    // Base64 encoded
    bytes = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0))
  } else {
    throw new Error('metadataHash must be 64 hex characters or 44 base64 characters (32 bytes)')
  }

  if (bytes.length !== 32) {
    throw new Error('metadataHash must decode to exactly 32 bytes')
  }

  return bytes
}

/**
 * Validate a required boolean value.
 * @throws Error if value is not defined
 */
export function validateRequiredBoolean(
  value: boolean | undefined,
  fieldName: string
): asserts value is boolean {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`)
  }
}
