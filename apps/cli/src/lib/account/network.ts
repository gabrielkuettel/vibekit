/**
 * Network Configuration
 *
 * Algod configuration for different networks.
 */

import type { Network } from './types'

export interface AlgodConfig {
  server: string
  token: string
  port?: number
}

export function getAlgodConfig(network: Network): AlgodConfig {
  switch (network) {
    case 'mainnet':
      return {
        server: 'https://mainnet-api.algonode.cloud',
        token: '',
      }
    case 'testnet':
      return {
        server: 'https://testnet-api.algonode.cloud',
        token: '',
      }
    case 'localnet':
      return {
        server: process.env.ALGOD_SERVER || 'http://localhost',
        token:
          process.env.ALGOD_TOKEN ||
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        port: 4001,
      }
    default:
      throw new Error(`Unknown network: ${network}`)
  }
}
