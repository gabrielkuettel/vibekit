/**
 * LocalNet Service Layer
 *
 * HTTP-based health checks for AlgoKit localnet services.
 * Pure business logic - no CLI dependencies (@clack/prompts, picocolors).
 * Used by: commands/status.ts
 */

export interface LocalnetStatus {
  algodRunning: boolean
  indexerRunning: boolean
}

/**
 * Check if a service is running by making an HTTP request
 */
async function checkEndpoint(url: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get the status of AlgoKit localnet services
 */
export async function getLocalnetStatus(): Promise<LocalnetStatus> {
  // Check algod and indexer in parallel
  const [algodRunning, indexerRunning] = await Promise.all([
    checkEndpoint('http://localhost:4001/versions'),
    checkEndpoint('http://localhost:8980/health'),
  ])

  return {
    algodRunning,
    indexerRunning,
  }
}
