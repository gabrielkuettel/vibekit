/**
 * WalletConnect Pairing Flow
 *
 * Handles QR code generation and pairing approval for WalletConnect v1.
 * Encapsulates the async pairing flow logic.
 */

import type { IConnector } from '@walletconnect/types'
import type { WalletId, AccountInfo } from '@vibekit/provider-interface'
import type { PairingRequest, PairingResult, WalletConfig } from '../types/index.js'
import { generateQR } from './qr.js'
import { InitializationError, NoSessionError } from '../errors.js'
import { CHAIN_ID_TO_NETWORK } from '../constants.js'
import { WalletConnectSessionManager } from '../session/index.js'

/** Callback to map addresses to accounts */
export type AddressMapper = (addresses: string[]) => AccountInfo[]

/**
 * Create a pairing request with QR codes and approval promise.
 *
 * @param connector - WalletConnect connector with created session
 * @param config - Wallet configuration
 * @param walletId - ID of the wallet being paired
 * @param walletName - Display name of the wallet
 * @param sessionManager - Session manager for persistence
 * @param mapAddresses - Function to convert addresses to AccountInfo[]
 * @returns Pairing request with URI, QR codes, and approval promise
 */
export async function createPairingRequest(
  connector: IConnector,
  config: WalletConfig,
  walletId: WalletId,
  walletName: string,
  sessionManager: WalletConnectSessionManager,
  mapAddresses: AddressMapper
): Promise<PairingRequest> {
  const uri = connector.uri
  if (!uri) {
    throw new InitializationError('Failed to generate WalletConnect URI')
  }

  const qr = await generateQR(uri)

  const approval = new Promise<PairingResult>((resolve, reject) => {
    connector.on('connect', async (error: Error | null) => {
      if (error) {
        reject(error)
        return
      }

      await sessionManager.save(connector)

      const addresses = connector.accounts
      const accounts = mapAddresses(addresses)
      const connectedChainId = connector.chainId
      const network = CHAIN_ID_TO_NETWORK[connectedChainId] || 'testnet'

      resolve({
        walletId,
        walletName,
        accounts,
        network,
      })
    })

    connector.on('disconnect', () => {
      reject(new NoSessionError('Connection was rejected or closed'))
    })
  })

  const networkName = config.network === 'mainnet' ? 'MainNet' : 'TestNet'

  return {
    uri,
    qrAscii: qr.ascii,
    qrDataUrl: qr.dataUrl,
    instructions: `Open ${walletName} on ${networkName} and scan this QR code to connect.`,
    approval,
  }
}
