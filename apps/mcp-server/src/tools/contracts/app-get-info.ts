/**
 * app_get_info tool
 *
 * Gets information about a deployed application from the network.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { encodeBase64 } from '../../lib/encoding.js'

export const appGetInfoTool: Tool = {
  name: 'app_get_info',
  description:
    'Get information about a deployed application including creator, approval/clear programs, and state schema.',
  inputSchema: {
    type: 'object',
    properties: {
      appId: {
        type: 'number',
        description: 'The application ID',
      },
    },
    required: ['appId'],
  },
}

interface GetAppInfoArgs {
  appId: number
}

export async function handleAppGetInfo(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  appId: number
  creator: string
  globalStateSchema: { numUint: number; numByteSlice: number }
  localStateSchema: { numUint: number; numByteSlice: number }
  approvalProgram: string
  clearStateProgram: string
}> {
  const { algorand } = ctx
  const typedArgs = parseArgs<GetAppInfoArgs>(args)
  const { appId } = typedArgs

  const appInfo = await algorand.client.algod.getApplicationByID(appId).do()

  // Convert Uint8Array to base64 string
  const approvalBytes = appInfo.params.approvalProgram
  const clearBytes = appInfo.params.clearStateProgram

  return {
    appId,
    creator: appInfo.params.creator.toString(),
    globalStateSchema: {
      numUint: appInfo.params.globalStateSchema?.numUint || 0,
      numByteSlice: appInfo.params.globalStateSchema?.numByteSlice || 0,
    },
    localStateSchema: {
      numUint: appInfo.params.localStateSchema?.numUint || 0,
      numByteSlice: appInfo.params.localStateSchema?.numByteSlice || 0,
    },
    approvalProgram: approvalBytes ? encodeBase64(new Uint8Array(approvalBytes)) : '',
    clearStateProgram: clearBytes ? encodeBase64(new Uint8Array(clearBytes)) : '',
  }
}
