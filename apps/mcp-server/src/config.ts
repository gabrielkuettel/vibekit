/**
 * MCP Server Configuration
 *
 * Network presets and configuration for connecting to Algorand nodes.
 * Supports localnet (with KMD), testnet, and mainnet.
 */

export type NetworkType = 'localnet' | 'testnet' | 'mainnet'

export interface NetworkPreset {
  algodServer: string
  algodToken: string
  indexerServer: string
  kmdServer?: string
  kmdToken?: string
}

/**
 * Default network configurations.
 * Localnet uses localhost for AlgoKit localnet (MCP server runs natively).
 * Testnet/Mainnet use Nodely free tier endpoints (no auth required).
 */
export const NETWORK_PRESETS: Record<NetworkType, NetworkPreset> = {
  localnet: {
    algodServer: 'http://localhost:4001',
    algodToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    kmdServer: 'http://localhost:4002',
    kmdToken: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    indexerServer: 'http://localhost:8980',
  },
  testnet: {
    algodServer: 'https://testnet-api.4160.nodely.dev',
    algodToken: '',
    indexerServer: 'https://testnet-idx.4160.nodely.dev',
  },
  mainnet: {
    algodServer: 'https://mainnet-api.4160.nodely.dev',
    algodToken: '',
    indexerServer: 'https://mainnet-idx.4160.nodely.dev',
  },
}

export interface McpConfig {
  network: NetworkType
  algodServer: string
  algodToken: string
  kmdServer?: string
  kmdToken?: string
  indexerServer?: string
  githubToken?: string
}

/**
 * Options for getConfig
 */
export interface GetConfigOptions {
  /** GitHub token from file (used as fallback if GITHUB_TOKEN env var not set) */
  githubTokenFromFile?: string | null
}

/**
 * Get MCP configuration from environment variables.
 *
 * Environment variables:
 * - ALGORAND_NETWORK: 'localnet' | 'testnet' | 'mainnet' (default: localnet)
 * - ALGORAND_ALGOD: Algod server URL
 * - ALGORAND_TOKEN: Algod API token
 * - ALGORAND_KMD: KMD server URL (localnet only)
 * - ALGORAND_KMD_TOKEN: KMD API token (localnet only)
 * - ALGORAND_INDEXER: Indexer server URL
 * - GITHUB_TOKEN: GitHub Personal Access Token for code search/retrieval
 *
 * Token precedence:
 * - GITHUB_TOKEN env var takes precedence over file-based token
 */
export function getConfig(options: GetConfigOptions = {}): McpConfig {
  const network = (process.env.ALGORAND_NETWORK || 'localnet') as NetworkType
  const defaults = NETWORK_PRESETS[network] || NETWORK_PRESETS.localnet

  return {
    network,
    algodServer: process.env.ALGORAND_ALGOD || defaults.algodServer,
    algodToken: process.env.ALGORAND_TOKEN || defaults.algodToken,
    kmdServer: process.env.ALGORAND_KMD || defaults.kmdServer,
    kmdToken: process.env.ALGORAND_KMD_TOKEN || defaults.kmdToken,
    indexerServer: process.env.ALGORAND_INDEXER || defaults.indexerServer,
    githubToken: process.env.GITHUB_TOKEN || options.githubTokenFromFile || undefined,
  }
}

/**
 * Validate configuration for the current network.
 * Throws descriptive errors for missing required configuration.
 */
export function validateConfig(config: McpConfig): void {
  if (!config.algodServer) {
    throw new Error(
      `ALGORAND_ALGOD environment variable required.\n` +
        `Set the Algod server URL for ${config.network}.`
    )
  }

  if (config.network === 'localnet' && !config.kmdServer) {
    throw new Error(
      `ALGORAND_KMD environment variable required for localnet.\n` +
        `KMD is needed for account management on localnet.`
    )
  }
}
