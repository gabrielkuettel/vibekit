/**
 * app_list_methods tool
 *
 * Parses an ARC-56/ARC-32 app spec and returns available methods.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { readFile } from 'node:fs/promises'

export const appListMethodsTool: Tool = {
  name: 'app_list_methods',
  description:
    'List available methods from an ARC-56/ARC-32 app spec. Provide either appSpec (inline JSON) or appSpecPath (file path). Use appSpecPath for large specs (>2KB) to avoid truncation.',
  inputSchema: {
    type: 'object',
    properties: {
      appSpec: {
        type: 'string',
        description: 'The ARC-56 or ARC-32 app spec JSON as a string. For small specs only.',
      },
      appSpecPath: {
        type: 'string',
        description:
          'Path to ARC-56/ARC-32 app spec JSON file. Recommended for large specs (>2KB) to avoid truncation issues.',
      },
    },
  },
}

interface ListAppMethodsArgs {
  appSpec?: string
  appSpecPath?: string
}

interface MethodInfo {
  name: string
  signature: string
  description?: string
  args: Array<{
    name: string
    type: string
    description?: string
  }>
  returns: {
    type: string
    description?: string
  }
}

export async function handleAppListMethods(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{ methods: MethodInfo[] }> {
  const typedArgs = parseArgs<ListAppMethodsArgs>(args)
  const { appSpec: appSpecJson, appSpecPath } = typedArgs

  // Resolve app spec from either inline or file
  let resolvedAppSpecJson: string
  if (appSpecPath) {
    resolvedAppSpecJson = await readFile(appSpecPath, 'utf-8')
  } else if (appSpecJson) {
    resolvedAppSpecJson = appSpecJson
  } else {
    throw new Error('Must provide either appSpec or appSpecPath')
  }

  const appSpec = JSON.parse(resolvedAppSpecJson)

  // Handle both ARC-56 and ARC-32 formats
  const methods: MethodInfo[] = []

  if (appSpec.methods) {
    // ARC-56 format or ARC-32 contract.methods
    for (const method of appSpec.methods) {
      const argTypes = method.args?.map((a: { type: string }) => a.type).join(',') || ''
      const returnType = method.returns?.type || 'void'

      methods.push({
        name: method.name,
        signature: `${method.name}(${argTypes})${returnType}`,
        description: method.desc || method.description,
        args: (method.args || []).map((a: { name: string; type: string; desc?: string }) => ({
          name: a.name,
          type: a.type,
          description: a.desc,
        })),
        returns: {
          type: returnType,
          description: method.returns?.desc,
        },
      })
    }
  } else if (appSpec.contract?.methods) {
    // Older ARC-32 format
    for (const method of appSpec.contract.methods) {
      const argTypes = method.args?.map((a: { type: string }) => a.type).join(',') || ''
      const returnType = method.returns?.type || 'void'

      methods.push({
        name: method.name,
        signature: `${method.name}(${argTypes})${returnType}`,
        description: method.desc,
        args: (method.args || []).map((a: { name: string; type: string; desc?: string }) => ({
          name: a.name,
          type: a.type,
          description: a.desc,
        })),
        returns: {
          type: returnType,
          description: method.returns?.desc,
        },
      })
    }
  }

  return { methods }
}
