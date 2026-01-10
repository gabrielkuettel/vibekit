/**
 * fund_account tool
 *
 * Funds an account from the network dispenser.
 * - Localnet: Uses KMD dispenser
 * - Testnet: Uses AlgoKit TestNet Dispenser API
 * - Mainnet: Not available (throws error)
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'
import { fundAccount } from '../../lib/account-service.js'

export const fundAccountTool: Tool = {
  name: 'fund_account',
  description:
    'Fund an account from the dispenser. Available on localnet (KMD) and testnet (AlgoKit Dispenser API). Not available on mainnet.',
  inputSchema: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The account address to fund',
      },
      amount: {
        type: 'number',
        description:
          'Amount to fund in microALGO (1 ALGO = 1,000,000 microALGO). Optional - defaults to 1 ALGO.',
      },
    },
    required: ['address'],
  },
}

interface FundAccountArgs {
  address: string
  amount?: number
}

export async function handleFundAccount(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  txId: string
  to: string
  amount: string
  dispenserType: string
}> {
  const { config } = ctx
  const typedArgs = parseArgs<FundAccountArgs>(args)
  const { address, amount } = typedArgs

  const fundAmount = amount ? BigInt(amount) : undefined
  const result = await fundAccount(address, fundAmount)

  return {
    network: config.network,
    txId: result.txId,
    to: address,
    amount: result.amount.toString(),
    dispenserType: result.dispenserType,
  }
}
