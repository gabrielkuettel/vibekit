/**
 * Wallet Transaction Signer
 *
 * Implements the algosdk TransactionSigner interface using WalletConnect v1.
 * Sends signing requests to the connected mobile wallet.
 */

import type { Transaction, TransactionSigner } from 'algosdk'
import type { IConnector } from '@walletconnect/types'
import { SigningRejectedError, SigningTimeoutError, NoSessionError } from './errors.js'
import { SIGNING_TIMEOUT_MS, type WalletConnectTransaction } from './types.js'

/**
 * Create a transaction signer that uses WalletConnect v1.
 *
 * The signer blocks until the user approves or rejects the transaction
 * in their mobile wallet.
 *
 * @param connector - WalletConnect v1 connector
 * @returns TransactionSigner function
 */
export function createWalletConnectSigner(connector: IConnector): TransactionSigner {
  return async (txnGroup: Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
    if (!connector.connected) {
      throw new NoSessionError()
    }

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

    // Create signing request using sendCustomRequest for WalletConnect v1
    const signedTxnsPromise = connector.sendCustomRequest({
      method: 'algo_signTxn',
      params: [wcTxns],
    }) as Promise<(string | null)[]>

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new SigningTimeoutError()), SIGNING_TIMEOUT_MS)
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
