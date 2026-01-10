/**
 * TestNet Dispenser
 *
 * Dispenser provider for Algorand TestNet.
 * Uses the AlgoKit TestNet Dispenser API directly (not AlgoKit client due to missing Content-Type header bug).
 *
 * Authentication:
 * - Set ALGOKIT_DISPENSER_ACCESS_TOKEN environment variable
 * - Or obtain token via: algokit dispenser login --ci
 *
 * API: https://api.dispenser.algorandfoundation.tools
 */

import type { DispenserProvider, DispenserInfo, FundResult } from '@vibekit/dispenser-interface'

const DISPENSER_API_URL = 'https://api.dispenser.algorandfoundation.tools'

// Default funding amount: 1 ALGO (in microALGO)
const DEFAULT_FUND_AMOUNT = 1_000_000n

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 15_000

interface DispenserFundResponse {
  txID: string
  amount: number
}

interface DispenserLimitResponse {
  amount: number
}

interface DispenserErrorResponse {
  message?: string
  code?: string
}

/**
 * TestNet Dispenser using AlgoKit Dispenser API directly.
 *
 * Note: We don't use AlgoKit's TestNetDispenserApiClient because it has a bug
 * where it doesn't set Content-Type: application/json header, causing 400 errors.
 */
export class TestNetDispenser implements DispenserProvider {
  readonly type = 'testnet-api' as const

  private authToken: string | undefined

  constructor(authToken?: string) {
    this.authToken = authToken ?? process.env['ALGOKIT_DISPENSER_ACCESS_TOKEN']
  }

  /**
   * Fund an account from the TestNet dispenser.
   */
  async fund(address: string, amount?: bigint): Promise<FundResult> {
    if (!this.authToken) {
      throw new Error(
        'TestNet dispenser requires authentication.\n' +
          'Run: vibekit dispenser login\n' +
          '(Or set ALGOKIT_DISPENSER_ACCESS_TOKEN environment variable)'
      )
    }

    const fundAmount = amount ?? DEFAULT_FUND_AMOUNT

    const response = await fetch(`${DISPENSER_API_URL}/fund/0`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver: address,
        amount: Number(fundAmount),
        assetID: 0,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    const result = (await response.json()) as DispenserFundResponse

    return {
      txId: result.txID,
      amount: BigInt(result.amount),
    }
  }

  /**
   * Check if TestNet dispenser is available.
   */
  async isAvailable(): Promise<boolean> {
    if (!this.authToken) {
      return false
    }

    try {
      await this.getLimit()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get information about the dispenser.
   */
  async getInfo(): Promise<DispenserInfo> {
    if (!this.authToken) {
      return {
        type: 'testnet-api',
        available: false,
      }
    }

    try {
      const limit = await this.getLimit()

      return {
        type: 'testnet-api',
        balance: BigInt(limit),
        available: true,
      }
    } catch {
      return {
        type: 'testnet-api',
        available: false,
      }
    }
  }

  /**
   * Get the funding limit from the dispenser API.
   */
  private async getLimit(): Promise<number> {
    if (!this.authToken) {
      throw new Error('TestNet dispenser requires authentication.')
    }

    const response = await fetch(`${DISPENSER_API_URL}/fund/0/limit`, {
      headers: { Authorization: `Bearer ${this.authToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      await this.handleErrorResponse(response)
    }

    const result = (await response.json()) as DispenserLimitResponse
    return result.amount
  }

  /**
   * Handle error response from dispenser API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `Dispenser API error: ${response.status}`

    try {
      const errorBody = (await response.json()) as DispenserErrorResponse
      if (errorBody.code) {
        errorMessage = errorBody.code
      } else if (errorBody.message) {
        errorMessage = errorBody.message
      }
    } catch {
      // Ignore JSON parse errors
    }

    // Provide helpful messages for common errors
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'TestNet dispenser authentication failed.\n' +
          'Your token may have expired. Run: vibekit dispenser login'
      )
    }

    if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
      throw new Error(`TestNet dispenser rate limit exceeded: ${errorMessage}`)
    }

    throw new Error(
      `TestNet dispenser failed: ${errorMessage}\n` + 'Try running: vibekit dispenser login'
    )
  }
}

/**
 * No-op dispenser for mainnet.
 * Always throws an error since there's no mainnet dispenser.
 */
export class NoDispenser implements DispenserProvider {
  readonly type = 'none' as const

  async fund(): Promise<FundResult> {
    throw new Error(
      'No dispenser available on mainnet.\n' +
        'Acquire ALGO from an exchange or transfer from another account.'
    )
  }

  async isAvailable(): Promise<boolean> {
    return false
  }

  async getInfo(): Promise<DispenserInfo> {
    return {
      type: 'none',
      available: false,
    }
  }
}
