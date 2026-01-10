/**
 * Dispenser Provider Interface
 *
 * Shared contract for all dispenser providers in the Vibekit ecosystem.
 * Dispensers fund accounts with ALGO for testing and development.
 *
 * Implementations:
 * - KMD (localnet): Uses AlgoKit localnet dispenser
 * - TestNet API: Uses AlgoKit TestNet Dispenser API
 * - None (mainnet): No dispenser available
 */

/**
 * Supported dispenser types.
 */
export type DispenserType = 'kmd' | 'testnet-api' | 'none'

/**
 * Result of a funding operation.
 */
export interface FundResult {
  /** Transaction ID */
  txId: string
  /** Amount funded in microALGO */
  amount: bigint
}

/**
 * Information about the dispenser.
 */
export interface DispenserInfo {
  /** Dispenser type */
  type: DispenserType
  /** Dispenser address (if applicable) */
  address?: string
  /** Dispenser balance in microALGO (if known) */
  balance?: bigint
  /** Whether the dispenser is available */
  available: boolean
}

/**
 * Dispenser provider interface.
 *
 * All dispenser providers must implement this interface to be compatible
 * with the Vibekit MCP server.
 */
export interface DispenserProvider {
  /** Dispenser type identifier */
  readonly type: DispenserType

  /**
   * Fund an account from the dispenser.
   *
   * @param address - The address to fund
   * @param amount - Amount in microALGO (optional, uses default if not specified)
   * @returns Fund result with transaction ID
   * @throws Error if dispenser not available or funding fails
   */
  fund(address: string, amount?: bigint): Promise<FundResult>

  /**
   * Check if the dispenser is available and ready.
   */
  isAvailable(): Promise<boolean>

  /**
   * Get information about the dispenser.
   */
  getInfo(): Promise<DispenserInfo>
}
