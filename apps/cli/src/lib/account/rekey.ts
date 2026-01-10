/**
 * Account Rekey Operations
 *
 * Pure business logic for rekeying accounts.
 * No CLI dependencies (@clack/prompts, picocolors).
 */

import algosdk from 'algosdk'
import type { VaultClient } from '@vibekit/provider-vault'
import type { AccountInfo } from '@vibekit/provider-interface'
import type { Network } from './types'
import { getAlgodConfig } from './network'

export interface RekeyStatus {
  isRekeyed: boolean
  authAddress?: string
  cannotCheckOnChain?: boolean
}

export interface RekeyTransactionParams {
  account: AccountInfo
  newAuthAddress: string
  network: Network
  vaultClient: VaultClient
}

export async function checkRekeyStatus(address: string, network: Network): Promise<RekeyStatus> {
  const algodConfig = getAlgodConfig(network)
  const algodClient = new algosdk.Algodv2(algodConfig.token, algodConfig.server, algodConfig.port)

  try {
    const accountInfo = await algodClient.accountInformation(address).do()
    const authAddr = accountInfo.authAddr?.toString()

    if (authAddr && authAddr !== address) {
      return { isRekeyed: true, authAddress: authAddr }
    }
    return { isRekeyed: false }
  } catch {
    return { isRekeyed: false, cannotCheckOnChain: true }
  }
}

export async function buildRekeyTransaction(params: RekeyTransactionParams): Promise<Uint8Array> {
  const { account, newAuthAddress, network, vaultClient } = params

  const algodConfig = getAlgodConfig(network)
  const algodClient = new algosdk.Algodv2(algodConfig.token, algodConfig.server, algodConfig.port)

  const suggestedParams = await algodClient.getTransactionParams().do()

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.address,
    receiver: account.address,
    amount: 0,
    suggestedParams,
    rekeyTo: newAuthAddress,
  })

  const txnBytes = txn.bytesToSign()
  const signature = await vaultClient.sign(account.name, txnBytes)
  return txn.attachSignature(txn.sender, signature)
}

export async function submitRekeyTransaction(
  signedTxn: Uint8Array,
  network: Network
): Promise<string> {
  const algodConfig = getAlgodConfig(network)
  const algodClient = new algosdk.Algodv2(algodConfig.token, algodConfig.server, algodConfig.port)

  const { txid } = await algodClient.sendRawTransaction(signedTxn).do()
  await algosdk.waitForConfirmation(algodClient, txid, 4)
  return txid
}

export function validateAlgorandAddress(value: string): string | null {
  if (!value || value.trim() === '') {
    return 'Address is required'
  }

  const trimmed = value.trim()

  if (trimmed.length !== 58) {
    return 'Algorand addresses must be 58 characters'
  }

  if (!/^[A-Z2-7]+$/.test(trimmed)) {
    return 'Invalid Algorand address format (must be base32)'
  }

  if (!algosdk.isValidAddress(trimmed)) {
    return 'Invalid Algorand address checksum'
  }

  return null
}
