/**
 * WalletConnect Transaction Signer
 *
 * Implements the algosdk TransactionSigner interface using WalletConnect.
 * Sends signing requests to the connected mobile wallet.
 */

import type { Transaction, TransactionSigner } from 'algosdk'
import type { SessionTypes } from '@walletconnect/types'

/** Minimal interface for SignClient that we need for signing */
interface SignClientLike {
  request<T>(params: {
    topic: string
    chainId: string
    request: { method: string; params: unknown[] }
  }): Promise<T>
}
import { SigningRejectedError, SigningTimeoutError, NoSessionError } from './errors.js'
import { ALGORAND_CHAINS, SIGNING_TIMEOUT_MS, type WalletConnectTransaction } from './types.js'

/**
 * Create a transaction signer that uses WalletConnect.
 *
 * The signer blocks until the user approves or rejects the transaction
 * in their mobile wallet.
 *
 * @param client - WalletConnect SignClient
 * @param getSession - Function to get current session
 * @param network - Target network ('mainnet' or 'testnet')
 * @returns TransactionSigner function
 */
export function createWalletConnectSigner(
  client: SignClientLike,
  getSession: () => SessionTypes.Struct | null,
  network: 'mainnet' | 'testnet'
): TransactionSigner {
  return async (txnGroup: Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
    const session = getSession()
    if (!session) {
      throw new NoSessionError()
    }

    const chainId = ALGORAND_CHAINS[network]

    // Build transaction array for WalletConnect
    const wcTxns: WalletConnectTransaction[] = txnGroup.map((txn, idx) => {
      // Get the raw transaction bytes and encode to base64
      const txnBytes = txn.toByte()
      const txnBase64 = Buffer.from(txnBytes).toString('base64')

      if (indexesToSign.includes(idx)) {
        // Transaction needs to be signed
        return { txn: txnBase64 }
      } else {
        // Transaction should not be signed (e.g., already signed or for different signer)
        return { txn: txnBase64, signers: [] }
      }
    })

    // Create signing request
    const request = {
      topic: session.topic,
      chainId,
      request: {
        method: 'algo_signTxn',
        params: [wcTxns],
      },
    }

    // Send request with timeout
    const signedTxnsPromise = client.request<(string | null)[]>(request)

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new SigningTimeoutError(SIGNING_TIMEOUT_MS)), SIGNING_TIMEOUT_MS)
    })

    let signedTxns: (string | null)[]
    try {
      signedTxns = await Promise.race([signedTxnsPromise, timeoutPromise])
    } catch (error) {
      // Handle WalletConnect errors
      if (error instanceof SigningTimeoutError) {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : String(error)

      // Check for user rejection
      if (
        errorMessage.includes('rejected') ||
        errorMessage.includes('declined') ||
        errorMessage.includes('User rejected')
      ) {
        throw new SigningRejectedError()
      }

      throw error
    }

    // Extract signed transactions for the requested indexes
    const result: Uint8Array[] = []

    for (const idx of indexesToSign) {
      const signedTxn = signedTxns[idx]
      if (!signedTxn) {
        throw new Error(`Transaction at index ${idx} was not signed by the wallet`)
      }
      result.push(new Uint8Array(Buffer.from(signedTxn, 'base64')))
    }

    return result
  }
}
