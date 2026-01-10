/**
 * Account Service
 *
 * Service layer for account management operations.
 * Abstracts appState interactions from MCP tools.
 *
 * Architecture:
 * - AccountProvider (Vault/Keyring): Key management and signing
 * - DispenserProvider: Funding accounts (network-dependent)
 *
 * Layer hierarchy: appState → account-service → MCP tools
 */

import type { AlgorandClient } from '@algorandfoundation/algokit-utils'
import type { AccountProviderType } from '@vibekit/provider-interface'
import type { McpConfig } from '../config.js'
import { appState } from '../state/index.js'

/**
 * Account information returned by list operations.
 */
export interface AccountInfo {
  address: string
  balance: bigint
  name?: string
}

/**
 * Get the default sender account based on network configuration.
 *
 * - Localnet: Uses active Vault account or falls back to KMD dispenser for signing
 * - Testnet/Mainnet: Uses Vault account (required)
 *
 * @param algorand - AlgorandClient instance
 * @param config - MCP configuration
 * @returns Account object with addr property
 * @throws Error if no account configured on testnet/mainnet
 */
export async function getDefaultSender(
  algorand: AlgorandClient,
  config: McpConfig
): Promise<{ addr: { toString(): string } }> {
  const activeAccount = appState.getActiveAccount()

  if (activeAccount) {
    const provider = appState.getAccountProvider()
    const accountWithSigner = await provider.getAccountWithSigner(activeAccount)
    algorand.account.setSigner(accountWithSigner.address, accountWithSigner.signer)
    return { addr: { toString: () => accountWithSigner.address } }
  }

  if (config.network === 'localnet') {
    // Localnet: fall back to KMD dispenser account for signing
    // This provides zero-config development experience
    const dispenser = await algorand.account.kmd.getLocalNetDispenserAccount()
    algorand.account.setSignerFromAccount(dispenser)
    return dispenser
  }

  throw new Error(
    `No account selected for ${config.network}.\n` +
      'Run: vibekit init\n' +
      'Then: create_account, switch_account'
  )
}

/**
 * Get the localnet KMD dispenser account with its signer registered.
 * Used for signing transactions on localnet when no account is configured.
 *
 * Note: This is different from the DispenserProvider interface which is
 * for funding accounts. On localnet, the KMD dispenser can also sign.
 *
 * @param algorand - AlgorandClient instance
 * @returns Dispenser account object with addr property
 */
export async function getKmdDispenserAccount(
  algorand: AlgorandClient
): Promise<{ addr: { toString(): string } }> {
  const dispenser = await algorand.account.kmd.getLocalNetDispenserAccount()
  algorand.account.setSignerFromAccount(dispenser)
  return dispenser
}

/**
 * Get an account with signer from Vault by address.
 * Searches all accounts to find the address and returns an account
 * that can sign transactions.
 *
 * Optimization: First checks active account before listing all accounts.
 * This avoids requiring list permission for common operations.
 *
 * @param algorand - AlgorandClient instance
 * @param address - The address to find
 * @returns Account with signer
 * @throws Error if address not found in any account
 */
export async function getAccountFromProvider(
  algorand: AlgorandClient,
  address: string
): Promise<{ addr: { toString(): string } }> {
  const provider = appState.getAccountProvider()

  // Optimization: Check active account first to avoid requiring list permission
  const activeAccountName = appState.getActiveAccount()
  if (activeAccountName) {
    const activeAccountInfo = await provider.getAccount(activeAccountName)
    if (activeAccountInfo && activeAccountInfo.address === address) {
      const accountWithSigner = await provider.getAccountWithSigner(activeAccountName)
      algorand.account.setSigner(accountWithSigner.address, accountWithSigner.signer)
      return { addr: { toString: () => accountWithSigner.address } }
    }
  }

  try {
    const accounts = await provider.listAccounts()

    for (const account of accounts) {
      if (account.address === address) {
        const accountWithSigner = await provider.getAccountWithSigner(account.name)
        algorand.account.setSigner(accountWithSigner.address, accountWithSigner.signer)
        return { addr: { toString: () => accountWithSigner.address } }
      }
    }
  } catch (error) {
    // If list fails (permission denied), provide helpful error
    if (error instanceof Error && error.message.includes('403')) {
      throw new Error(
        `Address ${address} not found. The active account doesn't match this address, ` +
          `and listing other accounts failed (permission denied). ` +
          `Use switch_account to select the account that owns this address.`
      )
    }
    throw error
  }

  throw new Error(
    `Address ${address} not found in ${provider.type} accounts. ` +
      (activeAccountName
        ? `Active account is "${activeAccountName}". If this address belongs to a different provider, use switch_account to select the correct account first.`
        : `Use switch_account to select the account that owns this address.`)
  )
}

/**
 * List available accounts.
 *
 * Lists Vault accounts if configured. On localnet, also includes dispenser info.
 *
 * @param algorand - AlgorandClient instance
 * @param config - MCP configuration
 * @returns Array of account information
 */
export async function listAccounts(
  algorand: AlgorandClient,
  config: McpConfig
): Promise<AccountInfo[]> {
  const accounts: AccountInfo[] = []

  if (appState.isProviderAvailable()) {
    try {
      const provider = appState.getAccountProvider()
      const providerAccounts = await provider.listAccounts()
      for (const account of providerAccounts) {
        let info: Awaited<ReturnType<typeof algorand.account.getInformation>> | undefined
        try {
          info = await algorand.account.getInformation(account.address)
        } catch {
          // algod may be unreachable
        }
        accounts.push({
          address: account.address,
          balance: info?.balance.microAlgo ?? 0n,
          name: `${account.name} (${provider.type})`,
        })
      }
    } catch {
      // Permission denied or other error
    }
  }

  try {
    const dispenser = appState.getDispenser()
    const dispenserInfo = await dispenser.getInfo()
    if (dispenserInfo?.available && dispenserInfo.address) {
      accounts.push({
        address: dispenserInfo.address,
        balance: dispenserInfo.balance ?? 0n,
        name: `dispenser (${dispenserInfo.type})`,
      })
    }
  } catch {
    // Dispenser might not be available
  }

  return accounts
}

/**
 * Resolve sender account for a transaction.
 * If a sender address is provided, looks it up in the active provider.
 * Otherwise, returns the default sender (active account, or dispenser on localnet).
 *
 * @param algorand - AlgorandClient instance
 * @param config - MCP configuration
 * @param sender - Optional sender address to use instead of default
 * @returns Object with sender address string
 */
export async function resolveSender(
  algorand: AlgorandClient,
  config: McpConfig,
  sender?: string
): Promise<{ address: string }> {
  const senderAccount = sender
    ? await getAccountFromProvider(algorand, sender)
    : await getDefaultSender(algorand, config)

  const address =
    typeof senderAccount.addr === 'string' ? senderAccount.addr : senderAccount.addr.toString()

  return { address }
}

/**
 * Get detailed information about a specific account.
 *
 * @param algorand - AlgorandClient instance
 * @param address - Account address to query
 * @returns Account information including balance, assets, and opted-in apps
 */
export async function getAccountInfo(
  algorand: AlgorandClient,
  address: string
): Promise<{
  address: string
  balance: bigint
  minBalance: bigint
  assets: Array<{ assetId: bigint; amount: bigint }>
  appsLocalState: Array<{ appId: bigint }>
  createdApps: Array<{ appId: bigint }>
}> {
  const info = await algorand.account.getInformation(address)

  return {
    address,
    balance: info.balance.microAlgo,
    minBalance: info.minBalance.microAlgo,
    assets: (info.assets || []).map((a) => ({
      assetId: a.assetId,
      amount: a.amount,
    })),
    appsLocalState: (info.appsLocalState || []).map((a) => ({
      appId: a.id,
    })),
    createdApps: (info.createdApps || []).map((a) => ({
      appId: a.id,
    })),
  }
}

/**
 * Get all available provider types.
 */
export function getAvailableProviders(): AccountProviderType[] {
  return appState.getAvailableProviderTypes()
}

/**
 * Validate that at least one account provider is available.
 * @param providerType - Optional specific provider to check
 */
export function requireProviderAvailable(providerType?: AccountProviderType): void {
  if (providerType) {
    if (!appState.isProviderAvailable(providerType)) {
      if (providerType === 'vault') {
        throw new Error(
          'Vault is not available. Make sure Vault is running and unsealed:\n' +
            '  vibekit vault start'
        )
      } else {
        throw new Error(
          `Account provider "${providerType}" is not available.\n` + 'Run: vibekit init'
        )
      }
    }
    return
  }

  const availableProviders = appState.getAvailableProviderTypes()
  if (availableProviders.length > 0) {
    return
  }

  // No available provider found
  throw new Error('No account provider is available.\n' + 'Run: vibekit init')
}

/**
 * Create an account in a provider.
 *
 * @param name - Account name
 * @param provider - Target provider (required if multiple available)
 * @param switchTo - Whether to switch to this account after creation (default: true)
 * @returns Created account info
 */
export async function createAccount(
  name: string,
  provider?: AccountProviderType,
  switchTo: boolean = true
): Promise<{ name: string; address: string; provider: AccountProviderType; isNew: boolean }> {
  if (!name || name.trim() === '') {
    throw new Error('Account name is required')
  }

  const availableProviders = appState.getAvailableProviderTypes()

  if (availableProviders.length === 0) {
    throw new Error(
      'No account provider available.\n' + 'Run: vibekit init\n' + 'Then restart the MCP server.'
    )
  }

  // Determine which provider to use
  let targetProvider: AccountProviderType

  if (provider) {
    // Validate requested provider is available
    if (!appState.isProviderAvailable(provider)) {
      throw new Error(
        `Provider "${provider}" is not available.\n` +
          `Available providers: ${availableProviders.join(', ')}\n` +
          (provider === 'vault' ? 'Run: vibekit vault start' : '')
      )
    }
    targetProvider = provider
  } else if (availableProviders.length === 1) {
    // Only one provider available - use it
    targetProvider = availableProviders[0]
  } else {
    // Multiple providers available - require explicit choice
    throw new Error(
      `Multiple providers available: ${availableProviders.join(', ')}.\n` +
        `Please specify which provider to create the account in using the 'provider' parameter.`
    )
  }

  const accountProvider = appState.getAccountProvider(targetProvider)
  const accountInfo = await accountProvider.createAccount(name)

  if (switchTo) {
    appState.setActiveAccount(name, targetProvider)
  }

  return {
    name: accountInfo.name,
    address: accountInfo.address,
    provider: targetProvider,
    isNew: accountInfo.isNew ?? true,
  }
}

/**
 * Switch the active account.
 *
 * @param algorand - AlgorandClient for balance queries
 * @param name - Account name to switch to, or "default" for dispenser
 * @param provider - Optional provider to search in
 * @returns Switched account info
 */
export async function switchAccount(
  algorand: AlgorandClient,
  name: string,
  provider?: AccountProviderType
): Promise<{
  previousAccount: string | null
  name: string
  address: string
  provider: AccountProviderType | null
  balance: bigint
}> {
  if (!name || name.trim() === '') {
    throw new Error('Account name is required')
  }

  // Handle "default" as a special case - switch to dispenser (localnet only)
  if (name === 'default') {
    const previousAccount = appState.getActiveAccount()
    appState.setActiveAccount(null) // Will throw if not on localnet
    const dispenser = appState.getDispenser()
    const dispenserInfo = await dispenser.getInfo()
    let address: string
    let balance: bigint

    if (dispenserInfo.address) {
      address = dispenserInfo.address
      balance = dispenserInfo.balance ?? 0n
    } else {
      // Fallback to KMD dispenser account directly
      const kmdDispenser = await algorand.account.kmd.getLocalNetDispenserAccount()
      address = kmdDispenser.addr.toString()
      const info = await algorand.account.getInformation(address)
      balance = info.balance.microAlgo
    }

    return {
      previousAccount,
      name: 'default',
      address,
      provider: null,
      balance,
    }
  }

  const availableProviders = appState.getAvailableProviderTypes()
  interface AccountMatch {
    name: string
    address: string
    provider: AccountProviderType
  }
  const matches: AccountMatch[] = []

  for (const providerType of availableProviders) {
    if (provider && providerType !== provider) {
      continue
    }

    try {
      if (!appState.isProviderAvailable(providerType)) {
        continue
      }
      const accountProvider = appState.getAccountProvider(providerType)
      const accountInfo = await accountProvider.getAccount(name)
      if (accountInfo) {
        matches.push({
          name: accountInfo.name,
          address: accountInfo.address,
          provider: providerType,
        })
      }
    } catch {
      // Provider might not be available, continue searching
    }
  }

  // Handle no matches
  if (matches.length === 0) {
    if (provider) {
      throw new Error(
        `Account "${name}" not found in ${provider} provider. ` +
          `Use list_accounts to see available accounts.`
      )
    }
    throw new Error(
      `Account "${name}" not found in any provider. ` +
        `Use list_accounts to see available accounts, or create_account to create a new one.`
    )
  }

  // Handle multiple matches (same name in different providers)
  if (matches.length > 1) {
    const providerList = matches.map((m) => m.provider).join(', ')
    throw new Error(
      `Account "${name}" exists in multiple providers: ${providerList}. ` +
        `Please specify the provider parameter to disambiguate.`
    )
  }

  // Single match - switch to it
  const match = matches[0]
  const previousAccount = appState.getActiveAccount()
  appState.setActiveAccount(match.name, match.provider)

  let balance: bigint
  try {
    const info = await algorand.account.getInformation(match.address)
    balance = info.balance.microAlgo
  } catch {
    balance = 0n // Account may not exist on chain yet
  }

  return {
    previousAccount,
    name: match.name,
    address: match.address,
    provider: match.provider,
    balance,
  }
}

/**
 * Get details about the active account.
 *
 * @param algorand - AlgorandClient for balance queries
 * @returns Active account details
 */
export async function getActiveAccountDetails(algorand: AlgorandClient): Promise<{
  name: string | null
  address: string
  balance: bigint
  isDefault: boolean
}> {
  const currentAccount = appState.getActiveAccount()

  let address: string
  let balance: bigint

  if (currentAccount) {
    if (!appState.isProviderAvailable()) {
      throw new Error(
        `Active account "${currentAccount}" is set but no provider is available.\n` +
          'Run: vibekit init'
      )
    }
    const provider = appState.getAccountProvider()
    const accountInfo = await provider.getAccount(currentAccount)
    if (accountInfo) {
      address = accountInfo.address
      try {
        const info = await algorand.account.getInformation(address)
        balance = info.balance.microAlgo
      } catch {
        balance = 0n // Account may not exist on chain yet
      }
    } else {
      throw new Error(
        `Active account "${currentAccount}" not found. Use switch_account to select a valid account.`
      )
    }
  } else if (appState.isLocalnet()) {
    const dispenser = appState.getDispenser()
    const dispenserInfo = await dispenser.getInfo()
    if (dispenserInfo.address) {
      address = dispenserInfo.address
      balance = dispenserInfo.balance ?? 0n
    } else {
      // Fallback to KMD dispenser account directly
      const kmdDispenser = await algorand.account.kmd.getLocalNetDispenserAccount()
      address = kmdDispenser.addr.toString()
      const info = await algorand.account.getInformation(address)
      balance = info.balance.microAlgo
    }
  } else {
    throw new Error(
      'No account selected. Use switch_account to select an account or create_account to create one.\n' +
        'The "default" dispenser is only available on localnet.'
    )
  }

  return {
    name: currentAccount,
    address,
    balance,
    isDefault: appState.isUsingDispenser(),
  }
}

/**
 * Fund an account from the dispenser.
 *
 * @param address - Account address to fund
 * @param amount - Amount in microALGO (optional, defaults to dispenser default)
 * @returns Transaction info
 */
export async function fundAccount(
  address: string,
  amount?: bigint
): Promise<{ txId: string; amount: bigint; dispenserType: string }> {
  if (!address) {
    throw new Error('address is required')
  }

  const dispenser = appState.getDispenser()
  const result = await dispenser.fund(address, amount)

  return {
    txId: result.txId,
    amount: result.amount,
    dispenserType: dispenser.type,
  }
}

/**
 * Account info returned by list operations for tools.
 */
export interface AccountListInfo {
  name: string
  address: string
  balance: bigint
  provider: AccountProviderType
}

/**
 * List all accounts from all providers with their balances.
 * This is for tool use - includes provider info per account.
 *
 * @param algorand - AlgorandClient for balance queries
 * @returns Array of account information with provider details
 */
export async function listAccountsForTools(
  algorand: AlgorandClient
): Promise<{ accounts: AccountListInfo[]; activeAccount: string | null }> {
  const accounts: AccountListInfo[] = []
  const availableProviders = appState.getAvailableProviderTypes()
  const activeAccount = appState.getActiveAccount()

  // List accounts from each available provider
  for (const providerType of availableProviders) {
    try {
      if (!appState.isProviderAvailable(providerType)) {
        continue
      }
      const provider = appState.getAccountProvider(providerType)
      const providerAccounts = await provider.listAccounts()

      for (const account of providerAccounts) {
        let balance = 0n
        try {
          const info = await algorand.account.getInformation(account.address)
          balance = info.balance.microAlgo
        } catch {
          // algod may be unreachable
        }
        accounts.push({
          name: account.name,
          address: account.address,
          balance,
          provider: providerType,
        })
      }
    } catch {
      // Provider might not be available, continue with other providers
    }
  }

  return { accounts, activeAccount }
}
