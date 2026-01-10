/**
 * validate_address tool
 *
 * Checks if a string is a valid Algorand address.
 * This is a pure validation that doesn't require network calls.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { isValidAddress } from 'algosdk'
import type { ToolContext } from '../types.js'

export const validateAddressTool: Tool = {
  name: 'validate_address',
  description:
    'Check if a string is a valid Algorand address. ' +
    'Validates the address format and checksum without requiring network calls.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The address string to validate',
      },
    },
    required: ['address'],
  },
}

export async function handleValidateAddress(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<{
  address: string
  valid: boolean
}> {
  const address = args.address as string

  if (typeof address !== 'string') {
    throw new Error('address must be a string')
  }

  const valid = isValidAddress(address)

  return {
    address,
    valid,
  }
}
