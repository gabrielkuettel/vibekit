/**
 * KMD Dispenser
 *
 * Dispenser provider for AlgoKit localnet.
 * Uses the KMD dispenser account to fund other accounts.
 */

import type { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { microAlgo } from '@algorandfoundation/algokit-utils'
import type { DispenserProvider, DispenserInfo, FundResult } from '@vibekit/dispenser-interface'

// Default funding amount: 10 ALGO
const DEFAULT_FUND_AMOUNT = 10_000_000n

/**
 * KMD-based dispenser for localnet development.
 * Uses the AlgoKit localnet dispenser account.
 */
export class KmdDispenser implements DispenserProvider {
  readonly type = 'kmd' as const

  private dispenserAccount: { addr: { toString(): string }; signer: unknown } | null = null

  constructor(private algorand: AlgorandClient) {}

  /**
   * Fund an account from the localnet dispenser.
   */
  async fund(address: string, amount?: bigint): Promise<FundResult> {
    const fundAmount = amount ?? DEFAULT_FUND_AMOUNT
    const dispenser = await this.getDispenserAccount()

    const result = await this.algorand.send.payment({
      sender: dispenser.addr.toString(),
      receiver: address,
      amount: microAlgo(fundAmount),
    })

    return {
      txId: result.txIds[0],
      amount: fundAmount,
    }
  }

  /**
   * Check if KMD dispenser is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.getDispenserAccount()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get information about the dispenser.
   */
  async getInfo(): Promise<DispenserInfo> {
    try {
      const dispenser = await this.getDispenserAccount()
      const address = dispenser.addr.toString()
      const info = await this.algorand.account.getInformation(address)

      return {
        type: 'kmd',
        address,
        balance: info.balance.microAlgo,
        available: true,
      }
    } catch {
      return {
        type: 'kmd',
        available: false,
      }
    }
  }

  /**
   * Get the dispenser account (with signer registered).
   */
  async getDispenserAccount(): Promise<{ addr: { toString(): string } }> {
    if (!this.dispenserAccount) {
      this.dispenserAccount = await this.algorand.account.kmd.getLocalNetDispenserAccount()
      // Register the signer with AlgorandClient
      this.algorand.account.setSignerFromAccount(
        this.dispenserAccount as Parameters<typeof this.algorand.account.setSignerFromAccount>[0]
      )
    }
    return this.dispenserAccount
  }
}
