/**
 * MCP Command Handler
 *
 * Runs the embedded MCP server for IDE integration.
 * This allows Claude Code and OpenCode to communicate with
 * the Algorand contract caller via stdio transport.
 */

import { startMcpServer } from '@vibekit/mcp-server'

export async function commandMcp(): Promise<void> {
  await startMcpServer()
}
