/**
 * Tool Types
 *
 * Unified types for the tool registry pattern.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { AlgorandClient } from '@algorandfoundation/algokit-utils'
import type { McpConfig } from '../config.js'

/**
 * Context passed to all tool handlers.
 * Handlers can destructure and use only what they need.
 */
export interface ToolContext {
  algorand: AlgorandClient
  config: McpConfig
}

/**
 * Unified handler signature for all tools.
 * @param args - Tool arguments from MCP request
 * @param ctx - Context with algorand client and config
 */
export type ToolHandler<TArgs = Record<string, unknown>> = (
  args: TArgs,
  ctx: ToolContext
) => Promise<unknown>

/**
 * A tool registration pairs a tool definition with its handler.
 */
export interface ToolRegistration {
  definition: Tool
  handler: ToolHandler
}

/**
 * Parse tool arguments with type assertion.
 * Reduces boilerplate of `args as unknown as T` pattern.
 */
export function parseArgs<T>(args: Record<string, unknown>): T {
  return args as unknown as T
}
