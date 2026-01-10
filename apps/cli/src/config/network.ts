/**
 * Algorand Network Configuration
 *
 * Network settings used by the vibekit-mcp server.
 */

/**
 * Algorand localnet configuration
 */
const ALGORAND_LOCALNET = {
  network: 'localnet',
  algodUrl: 'http://localhost:4001',
  algodToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  kmdUrl: 'http://localhost:4002',
  kmdToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  indexerUrl: 'http://localhost:8980',
} as const

/**
 * Environment variables for native MCP execution
 *
 * Note: Provider type (vault/keyring) is auto-detected by the MCP server
 * based on which credentials exist, so we don't need to specify it here.
 */
export const MCP_ENV_VARS = {
  ALGORAND_NETWORK: ALGORAND_LOCALNET.network,
  ALGORAND_ALGOD: ALGORAND_LOCALNET.algodUrl,
  ALGORAND_TOKEN: ALGORAND_LOCALNET.algodToken,
  ALGORAND_KMD: ALGORAND_LOCALNET.kmdUrl,
  ALGORAND_KMD_TOKEN: ALGORAND_LOCALNET.kmdToken,
  ALGORAND_INDEXER: ALGORAND_LOCALNET.indexerUrl,
} as const
