/**
 * Algorand Contract Caller MCP Server
 *
 * An MCP server that enables AI agents to interact with Algorand smart contracts
 * using natural language. Supports deploying, calling, and reading state from
 * contracts using the ARC-56/ARC-32 app spec as the source of truth.
 *
 * Transport: stdio (bundled into vibekit CLI as `vibekit mcp` subcommand)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { getConfig, validateConfig } from './config.js'
import { appState, type VaultProviderConfig } from './state/index.js'
import { toolDefinitions, handleToolCall } from './tools/index.js'
import { createKeyringStore, KEYRING_KEYS, type SecretStore } from '@vibekit/keyring'
import { getDispenserToken, getGithubToken } from '@vibekit/db'

let keyringStore: SecretStore | null = null

function getKeyring(): SecretStore {
  if (!keyringStore) {
    keyringStore = createKeyringStore()
  }
  return keyringStore
}

/**
 * Read the MCP token from keyring.
 */
async function readMcpToken(): Promise<string | null> {
  return getKeyring().get(KEYRING_KEYS.VAULT_MCP_TOKEN)
}

/**
 * Read the TestNet dispenser token from SQLite.
 */
function readDispenserToken(): string | null {
  return getDispenserToken()
}

/**
 * Read the GitHub token from SQLite.
 */
function readGithubToken(): string | null {
  return getGithubToken()
}

/**
 * Get Vault configuration from keyring.
 * Returns null if not configured.
 *
 * Token source: OS keyring (config:vault-mcp-token)
 *
 * Optional env vars for Vault connection:
 *   VAULT_ADDR - Vault server URL (default: http://localhost:8200)
 *   VAULT_TRANSIT_PATH - Transit mount path (default: transit)
 *   VAULT_KEY_PREFIX - Key name prefix (default: algo-)
 */
async function getVaultConfig(): Promise<VaultProviderConfig | null> {
  const token = await readMcpToken()

  // Token is required
  if (!token) {
    return null
  }

  return {
    // Default to localhost (MCP server runs natively)
    url: process.env.VAULT_ADDR || 'http://localhost:8200',
    token,
    transitPath: process.env.VAULT_TRANSIT_PATH || 'transit',
    keyPrefix: process.env.VAULT_KEY_PREFIX || 'algo-',
  }
}

/**
 * Main entry point for the MCP server.
 * Exported for use by the CLI's `vibekit mcp` command.
 */
export async function startMcpServer(): Promise<void> {
  const githubTokenFromKeyring = readGithubToken()
  const config = getConfig({ githubTokenFromFile: githubTokenFromKeyring })

  try {
    validateConfig(config)
  } catch (error) {
    console.error('Configuration error:', error)
    // Continue anyway - some tools may still work
  }

  const dispenserToken = readDispenserToken()
  const vaultConfig = await getVaultConfig()

  appState.initialize({
    vaultConfig: vaultConfig || undefined,
    dispenserToken: dispenserToken || undefined,
  })

  const server = new Server(
    {
      name: 'algorand-contracts',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
  }))

  // Handle tool calls - get fresh client from state (supports runtime switching)
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const algorand = appState.getAlgorandClient()
    const networkConfig = appState.getNetwork()

    const currentConfig = {
      ...config,
      network: networkConfig.network,
      algodServer: networkConfig.algodServer,
      algodToken: networkConfig.algodToken,
      kmdServer: networkConfig.kmdServer,
      kmdToken: networkConfig.kmdToken,
      indexerServer: networkConfig.indexerServer,
    }

    const result = await handleToolCall(request, algorand, currentConfig)
    return result as { content: Array<{ type: string; text: string }> }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)

  const networkConfig = appState.getNetwork()
  const availableProviders = appState.getAvailableProviderTypes()

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error(`Algorand Contracts MCP server running`)
  console.error(`Network: ${networkConfig.network}`)
  console.error(
    `Providers: ${availableProviders.length > 0 ? availableProviders.join(', ') : 'none'}`
  )
  console.error(`Algod: ${networkConfig.algodServer}`)
  console.error(`Dispenser: ${dispenserToken ? 'testnet token available' : 'localnet only'}`)
}

// Run the server when executed directly
if (import.meta.main) {
  startMcpServer().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
