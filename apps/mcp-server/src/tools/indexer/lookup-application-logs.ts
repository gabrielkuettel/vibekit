/**
 * indexer_lookup_application_logs tool
 *
 * Look up application logs from the indexer.
 * Essential for debugging smart contract execution in PuyaTs/PuyaPy contracts.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'

export const lookupApplicationLogsTool: Tool = {
  name: 'indexer_lookup_application_logs',
  description:
    'Look up application logs for debugging smart contract execution. Essential for PuyaTs/PuyaPy development.',
  inputSchema: {
    type: 'object',
    properties: {
      applicationId: {
        type: 'number',
        description: 'The application ID to get logs for',
      },
      minRound: {
        type: 'number',
        description: 'Minimum round (block) number',
      },
      maxRound: {
        type: 'number',
        description: 'Maximum round (block) number',
      },
      senderAddress: {
        type: 'string',
        description: 'Filter by sender address',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default 10, max 100)',
      },
      nextToken: {
        type: 'string',
        description: 'Pagination token from previous response',
      },
    },
    required: ['applicationId'],
  },
}

interface LookupApplicationLogsArgs {
  applicationId: number
  minRound?: number
  maxRound?: number
  senderAddress?: string
  limit?: number
  nextToken?: string
}

interface LogEntry {
  transactionId: string
  round: number
  roundTime?: number
  sender: string
  logs: string[]
  innerLogs?: Array<{
    offset: number
    logs: string[]
  }>
}

function decodeLog(base64Log: string): string {
  try {
    const decoded = Buffer.from(base64Log, 'base64').toString('utf-8')
    // Check if it's printable ASCII/UTF-8
    if (/^[\x20-\x7E\s]*$/.test(decoded) && decoded.length > 0) {
      return decoded
    }
    // Return hex representation for binary data
    return '0x' + Buffer.from(base64Log, 'base64').toString('hex')
  } catch {
    return base64Log
  }
}

export async function handleLookupApplicationLogs(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  network: string
  applicationId: number
  logEntries: LogEntry[]
  nextToken?: string
}> {
  const { algorand, config } = ctx
  const typedArgs = parseArgs<LookupApplicationLogsArgs>(args)
  const limit = Math.min(Math.max(typedArgs.limit || 10, 1), 100)

  let search = algorand.client.indexer.lookupApplicationLogs(typedArgs.applicationId).limit(limit)

  if (typedArgs.minRound) {
    search = search.minRound(typedArgs.minRound)
  }

  if (typedArgs.maxRound) {
    search = search.maxRound(typedArgs.maxRound)
  }

  if (typedArgs.senderAddress) {
    search = search.sender(typedArgs.senderAddress)
  }

  if (typedArgs.nextToken) {
    search = search.nextToken(typedArgs.nextToken)
  }

  const result = await search.do()

  const logEntries: LogEntry[] = []

  const logData = result.logData as unknown as Array<Record<string, unknown>> | undefined
  if (logData) {
    for (const entry of logData) {
      const logEntry: LogEntry = {
        transactionId: entry.txid as string,
        round: entry.confirmedRound as number,
        sender: entry.sender as string,
        logs: [],
      }

      if (entry.roundTime) {
        logEntry.roundTime = entry.roundTime as number
      }

      // Decode main logs
      const logs = entry.logs as string[] | undefined
      if (logs) {
        logEntry.logs = logs.map(decodeLog)
      }

      // Handle inner transaction logs
      const innerLogs = entry.innerLogs as Array<Record<string, unknown>> | undefined
      if (innerLogs && innerLogs.length > 0) {
        logEntry.innerLogs = innerLogs.map((inner) => ({
          offset: inner.offset as number,
          logs: ((inner.logs as string[]) || []).map(decodeLog),
        }))
      }

      logEntries.push(logEntry)
    }
  }

  const response: {
    network: string
    applicationId: number
    logEntries: LogEntry[]
    nextToken?: string
  } = {
    network: config.network,
    applicationId: typedArgs.applicationId,
    logEntries,
  }

  if (result.nextToken) {
    response.nextToken = result.nextToken
  }

  return response
}
