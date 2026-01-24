# WalletConnect QR Code Signing

Design document for adding mobile wallet signing via WalletConnect to VibeKit.

## Problem

Currently, VibeKit supports two account providers:
- **Vault**: Enterprise-grade, keys stored in HashiCorp Vault
- **Keyring**: Development-friendly, keys in OS keyring

Both require keys to be managed by the MCP server. Users who want to use their existing mobile wallet (Pera, Defly) have no way to sign transactions.

## Solution

Add a third provider type (`walletconnect`) that connects to mobile wallets via WalletConnect v2. Users scan a QR code to pair their wallet, then approve transactions on their phone.

## Relevant Standards

### ARC-25: WalletConnect v1 API
Defines the Algorand-specific WalletConnect protocol:
- Chain IDs: MainNet=416001, TestNet=416002, BetaNet=416003
- `algo_signTxn` JSON-RPC method for transaction signing
- Uses ARC-1 `WalletTransaction` format

### ARC-1: Wallet Transaction Signing API
Defines the transaction signing interface:
```typescript
interface WalletTransaction {
  txn: string           // Base64-encoded unsigned transaction
  signers?: string[]    // Empty array = don't sign this one
  authAddr?: string     // Rekeyed auth address
  msig?: MultisigMetadata
}
```

### ARC-0090: Transaction URIs (Future)
Defines URI encoding for transactions. Could enable one-shot QR signing without a persistent session. Deferred to v2.

## Architecture

### Provider Model

WalletConnect fits the existing provider pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Server                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │    Vault    │  │   Keyring   │  │    WalletConnect     │ │
│  │   Provider  │  │   Provider  │  │      Provider        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘ │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                 AccountProvider Interface                    │
│                          │                                   │
│                    resolveSender()                           │
│                          │                                   │
│                   sendTransactions()                         │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    TransactionSigner
                           │
            ┌──────────────┼──────────────┐
            │              │              │
      Vault API     OS Keyring    WalletConnect
      (Transit)     (libsecret)   (Mobile Wallet)
```

### Key Differences from Existing Providers

| Aspect | Vault/Keyring | WalletConnect |
|--------|---------------|---------------|
| Account creation | Provider creates keys | Accounts come from wallet |
| Signing | Synchronous (local/API) | Async (user approval required) |
| Session | Always available | Requires pairing first |
| Key storage | Provider manages | User's mobile wallet |

## User Flow

### First-Time Pairing

```
User: "Send 1 ALGO to ABC..."

Agent: I'll send that payment. Let me check the active account.
       [Calls get_active_account]

       No account is set. Let me connect your mobile wallet.
       [Calls walletconnect_pair]

Agent: Scan this QR code with Pera or Defly wallet:

       █▀▀▀▀▀█ ▄▀▀▄▀ █▀▀▀▀▀█
       █ ███ █ █▄▀▄█ █ ███ █
       █ ▀▀▀ █ ▀ ▄▀▄ █ ▀▀▀ █
       ▀▀▀▀▀▀▀ █▄▀▄█ ▀▀▀▀▀▀▀
       ▀▀▀ ▄▀▀ ▄▀ ▄▀▄▀▄ ▀▀▀▄
       ▀▀▀▀▀▀▀ ▀▀▀   ▀▀▀▀▀▀▀

       Or copy this link: wc:abc123@2?relay-protocol=irn&symKey=xyz

User: [Opens Pera Wallet, scans QR code, taps "Connect"]

Agent: [Detects connection]
       Connected! Found account: ALGO...XYZ
       [Calls switch_account to set as active]
       [Calls send_payment]

Agent: Please approve the transaction in your Pera Wallet.

User: [Opens notification on phone, reviews transaction, taps "Approve"]

Agent: Transaction sent! TxID: 7KXYZ...
```

### Subsequent Transactions (Session Persisted)

```
User: "Transfer 100 of asset 123 to DEF..."

Agent: [Calls asset_transfer - session already active]

Agent: Approve the asset transfer in your Pera Wallet.

User: [Approves on phone]

Agent: Done! TxID: 8LABC...
```

### Session Expired or Disconnected

```
User: "Send 5 ALGO to GHI..."

Agent: [Calls send_payment, session expired]

       Your wallet session has expired. Let me reconnect.
       [Calls walletconnect_pair]

Agent: Scan this QR code to reconnect:
       [QR code displayed]
```

## Components

### 1. Package: `packages/provider-walletconnect/`

```
provider-walletconnect/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Public exports
    ├── provider.ts           # WalletConnectProvider class
    ├── signer.ts             # TransactionSigner implementation
    ├── session-manager.ts    # Session persistence
    ├── qr-generator.ts       # QR code generation
    └── types.ts              # TypeScript types
```

**Dependencies:**
```json
{
  "dependencies": {
    "@walletconnect/sign-client": "^2.11.0",
    "@walletconnect/types": "^2.11.0",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5"
  }
}
```

### 2. Provider Implementation

```typescript
// packages/provider-walletconnect/src/provider.ts

import type { AccountProvider, AccountInfo, AccountWithSigner } from '@vibekit/provider-interface'
import SignClient from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'

export class WalletConnectProvider implements AccountProvider {
  readonly type = 'walletconnect' as const

  private signClient: SignClient | null = null
  private session: SessionTypes.Struct | null = null
  private sessionManager: SessionManager
  private chainId: number // 416001, 416002, or 416003

  constructor(config: WalletConnectConfig) {
    this.sessionManager = new SessionManager(config.keyring)
    this.chainId = config.chainId
  }

  async initialize(): Promise<void> {
    this.signClient = await SignClient.init({
      projectId: process.env.WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'VibeKit',
        description: 'Algorand AI Development Tools',
        url: 'https://getvibekit.ai',
        icons: ['https://getvibekit.ai/icon.png']
      }
    })

    // Restore persisted session
    this.session = await this.sessionManager.loadSession()

    // Listen for session events
    this.signClient.on('session_delete', () => {
      this.session = null
      this.sessionManager.clearSession()
    })
  }

  /**
   * Not supported - accounts come from connected wallet
   */
  async createAccount(_name: string): Promise<AccountInfo> {
    throw new WalletConnectError(
      'WalletConnect accounts cannot be created. Use walletconnect_pair to connect your mobile wallet.',
      'UNSUPPORTED_OPERATION'
    )
  }

  /**
   * List accounts from connected wallet session
   */
  async listAccounts(): Promise<AccountInfo[]> {
    if (!this.session) return []

    const namespace = this.session.namespaces.algorand
    if (!namespace) return []

    // Format: "algorand:416002:ADDRESS"
    return namespace.accounts.map((account, index) => {
      const address = account.split(':')[2]
      return {
        name: `wallet-${index + 1}`,
        address
      }
    })
  }

  /**
   * Get account by name (wallet-1, wallet-2, etc.) or address
   */
  async getAccount(nameOrAddress: string): Promise<AccountInfo | null> {
    const accounts = await this.listAccounts()
    return accounts.find(a =>
      a.name === nameOrAddress || a.address === nameOrAddress
    ) ?? null
  }

  /**
   * Get account with WalletConnect signer
   */
  async getAccountWithSigner(nameOrAddress: string): Promise<AccountWithSigner> {
    if (!this.session || !this.signClient) {
      throw new WalletConnectError(
        'No WalletConnect session. Use walletconnect_pair to connect your mobile wallet.',
        'NO_SESSION'
      )
    }

    const account = await this.getAccount(nameOrAddress)
    if (!account) {
      throw new WalletConnectError(
        `Account "${nameOrAddress}" not found in connected wallet`,
        'ACCOUNT_NOT_FOUND'
      )
    }

    return {
      address: account.address,
      signer: this.createSigner(account.address)
    }
  }

  /**
   * Check if session is active
   */
  async isAvailable(): Promise<boolean> {
    return this.session !== null
  }

  /**
   * Initiate pairing - returns QR code data
   */
  async requestPairing(): Promise<PairingResult> {
    if (!this.signClient) {
      throw new WalletConnectError('Provider not initialized', 'NOT_INITIALIZED')
    }

    const { uri, approval } = await this.signClient.connect({
      requiredNamespaces: {
        algorand: {
          methods: ['algo_signTxn'],
          chains: [`algorand:${this.chainId}`],
          events: []
        }
      }
    })

    if (!uri) {
      throw new WalletConnectError('Failed to generate pairing URI', 'PAIRING_FAILED')
    }

    // Generate QR code
    const qrCode = await generateQRCode(uri)

    // Start waiting for approval (don't await - caller handles this)
    this.waitForApproval(approval)

    return {
      uri,
      qrCode,
      expiresInSeconds: 300
    }
  }

  private async waitForApproval(approval: Promise<SessionTypes.Struct>): Promise<void> {
    try {
      this.session = await approval
      await this.sessionManager.saveSession(this.session)
    } catch (error) {
      // User rejected or timeout - session remains null
    }
  }

  /**
   * Disconnect current session
   */
  async disconnect(): Promise<void> {
    if (this.session && this.signClient) {
      await this.signClient.disconnect({
        topic: this.session.topic,
        reason: { code: 6000, message: 'User disconnected' }
      })
    }
    this.session = null
    await this.sessionManager.clearSession()
  }

  /**
   * Create TransactionSigner that uses WalletConnect
   */
  private createSigner(address: string): TransactionSigner {
    const signClient = this.signClient!
    const session = this.session!
    const chainId = this.chainId

    return async (txnGroup: Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
      // Convert to ARC-1 WalletTransaction format
      const walletTxns: WalletTransaction[] = txnGroup.map((txn, i) => ({
        txn: Buffer.from(txn.toByte()).toString('base64'),
        signers: indexesToSign.includes(i) ? undefined : []
      }))

      // Send signing request to wallet
      const response = await signClient.request<(string | null)[]>({
        topic: session.topic,
        chainId: `algorand:${chainId}`,
        request: {
          method: 'algo_signTxn',
          params: [walletTxns]
        }
      })

      // Decode signed transactions
      return response.map((stxn, i) => {
        if (stxn === null) {
          // This transaction wasn't supposed to be signed by this wallet
          return new Uint8Array()
        }
        return new Uint8Array(Buffer.from(stxn, 'base64'))
      })
    }
  }
}
```

### 3. Session Persistence

```typescript
// packages/provider-walletconnect/src/session-manager.ts

import type { SessionTypes } from '@walletconnect/types'
import type { SecretStore } from '@vibekit/keyring'

const SESSION_KEY = 'config:walletconnect-session'

export class SessionManager {
  constructor(private keyring: SecretStore) {}

  async saveSession(session: SessionTypes.Struct): Promise<void> {
    await this.keyring.set(SESSION_KEY, JSON.stringify(session))
  }

  async loadSession(): Promise<SessionTypes.Struct | null> {
    try {
      const data = await this.keyring.get(SESSION_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  async clearSession(): Promise<void> {
    try {
      await this.keyring.delete(SESSION_KEY)
    } catch {
      // Ignore - key might not exist
    }
  }
}
```

### 4. QR Code Generation

```typescript
// packages/provider-walletconnect/src/qr-generator.ts

import QRCode from 'qrcode'

export interface QRCodeOutput {
  ascii: string      // Terminal-friendly ASCII art
  dataUrl: string    // data:image/png;base64,... for rich clients
}

export async function generateQRCode(uri: string): Promise<QRCodeOutput> {
  const [ascii, dataUrl] = await Promise.all([
    QRCode.toString(uri, { type: 'terminal', small: true }),
    QRCode.toDataURL(uri, { width: 256, margin: 2 })
  ])

  return { ascii, dataUrl }
}
```

### 5. MCP Tools

#### `walletconnect_pair`

```typescript
// apps/mcp-server/src/tools/walletconnect/pair.ts

export const walletConnectPairTool: Tool = {
  name: 'walletconnect_pair',
  description: `Connect a mobile wallet (Pera, Defly) via WalletConnect.
Returns a QR code that the user should scan with their wallet app.
Once paired, the wallet's accounts can be used for signing transactions.`,
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}

async function handler(args: unknown, config: AppState): Promise<ToolResult> {
  const provider = config.getWalletConnectProvider()

  // Check if already connected
  if (await provider.isAvailable()) {
    const accounts = await provider.listAccounts()
    return {
      content: [{
        type: 'text',
        text: `Already connected to wallet with ${accounts.length} account(s):\n` +
              accounts.map(a => `- ${a.address}`).join('\n') +
              '\n\nUse walletconnect_disconnect to disconnect first.'
      }]
    }
  }

  const pairing = await provider.requestPairing()

  return {
    content: [{
      type: 'text',
      text: `Scan this QR code with Pera or Defly wallet:\n\n` +
            pairing.qrCode.ascii +
            `\n\nOr copy this URI: ${pairing.uri}\n\n` +
            `Expires in ${pairing.expiresInSeconds} seconds.\n\n` +
            `After scanning, use walletconnect_status to check the connection.`
    }]
  }
}
```

#### `walletconnect_status`

```typescript
// apps/mcp-server/src/tools/walletconnect/status.ts

export const walletConnectStatusTool: Tool = {
  name: 'walletconnect_status',
  description: 'Check the status of the WalletConnect session and list connected accounts.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}

async function handler(args: unknown, config: AppState): Promise<ToolResult> {
  const provider = config.getWalletConnectProvider()

  if (!await provider.isAvailable()) {
    return {
      content: [{
        type: 'text',
        text: 'Not connected. Use walletconnect_pair to connect a mobile wallet.'
      }]
    }
  }

  const accounts = await provider.listAccounts()
  const session = provider.getSession()

  return {
    content: [{
      type: 'text',
      text: `Connected via WalletConnect\n` +
            `Wallet: ${session?.peer.metadata.name ?? 'Unknown'}\n` +
            `Accounts:\n` +
            accounts.map(a => `  - ${a.name}: ${a.address}`).join('\n')
    }]
  }
}
```

#### `walletconnect_disconnect`

```typescript
// apps/mcp-server/src/tools/walletconnect/disconnect.ts

export const walletConnectDisconnectTool: Tool = {
  name: 'walletconnect_disconnect',
  description: 'Disconnect the current WalletConnect session.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}

async function handler(args: unknown, config: AppState): Promise<ToolResult> {
  const provider = config.getWalletConnectProvider()

  if (!await provider.isAvailable()) {
    return {
      content: [{
        type: 'text',
        text: 'No active WalletConnect session.'
      }]
    }
  }

  await provider.disconnect()

  return {
    content: [{
      type: 'text',
      text: 'Disconnected from WalletConnect.'
    }]
  }
}
```

### 6. AppState Integration

```typescript
// apps/mcp-server/src/state/app-state.ts

export class AppState {
  private walletConnectProvider: WalletConnectProvider | null = null

  async getWalletConnectProvider(): Promise<WalletConnectProvider> {
    if (!this.walletConnectProvider) {
      this.walletConnectProvider = new WalletConnectProvider({
        keyring: this.keyring,
        chainId: this.getWalletConnectChainId()
      })
      await this.walletConnectProvider.initialize()
    }
    return this.walletConnectProvider
  }

  private getWalletConnectChainId(): number {
    switch (this.networkConfig.network) {
      case 'mainnet': return 416001
      case 'testnet': return 416002
      default: return 416002 // Default to testnet for localnet
    }
  }

  // Update to include walletconnect
  getAvailableProviderTypes(): AccountProviderType[] {
    const types: AccountProviderType[] = ['keyring']
    if (this.vaultConfig) types.push('vault')
    types.push('walletconnect')
    return types
  }

  async getAccountProvider(type: AccountProviderType): Promise<AccountProvider> {
    switch (type) {
      case 'vault':
        return this.getVaultProvider()
      case 'keyring':
        return this.getKeyringProvider()
      case 'walletconnect':
        return this.getWalletConnectProvider()
    }
  }
}
```

### 7. Provider Interface Update

```typescript
// packages/provider-interface/src/index.ts

export type AccountProviderType = 'vault' | 'keyring' | 'walletconnect'
```

## Configuration

### Environment Variables

```bash
# Required for WalletConnect v2
# Get from https://cloud.walletconnect.com
WALLETCONNECT_PROJECT_ID=your-project-id

# Optional: Signing timeout in milliseconds (default: 120000 = 2 minutes)
WALLETCONNECT_SIGNING_TIMEOUT=120000
```

### CLI Setup Command (Future)

```bash
vibekit walletconnect setup
# Prompts for project ID, stores in keyring
```

## Error Handling

```typescript
export class WalletConnectError extends Error {
  constructor(
    message: string,
    public code: WalletConnectErrorCode
  ) {
    super(message)
    this.name = 'WalletConnectError'
  }
}

export type WalletConnectErrorCode =
  | 'NO_SESSION'           // Need to pair first
  | 'SESSION_EXPIRED'      // Session timed out
  | 'USER_REJECTED'        // User rejected in wallet
  | 'SIGNING_TIMEOUT'      // No response within timeout
  | 'ACCOUNT_NOT_FOUND'    // Address not in connected wallet
  | 'NETWORK_MISMATCH'     // Wrong chain ID
  | 'UNSUPPORTED_OPERATION'// e.g., createAccount
  | 'NOT_INITIALIZED'      // Provider not initialized
  | 'PAIRING_FAILED'       // Failed to generate pairing URI
```

## Limitations (v1)

1. **Single Session**: Only one wallet connected at a time
2. **Same Wallet Signers**: All transaction signers must be from the connected wallet
3. **No LocalNet**: WalletConnect requires real network (TestNet/MainNet)
4. **Timeout**: 2-minute default signing timeout
5. **No Account Creation**: Can't create new accounts via WalletConnect

## Future Enhancements (v2)

### ARC-0090 One-Shot Signing
For scenarios where persistent sessions aren't desired:
```
algorand://ADDR?type=pay&amt=1000000&rcv=RECEIVER&note=Hello
```
Generate QR per transaction, no pairing required.

### Multiple Sessions
Support connecting multiple wallets simultaneously for multi-party signing.

### Deep Links
Mobile-to-mobile flow using `algorand://` deep links instead of QR codes.

### Hardware Wallet Support
Ledger integration via similar provider pattern.

## Testing

### Unit Tests
- QR code generation
- Session serialization/deserialization
- WalletTransaction encoding (ARC-1 format)

### Integration Tests
- Mock WalletConnect relay server
- Full pairing → signing flow
- Session persistence across restarts

### Manual Testing
1. Run MCP server on TestNet
2. Call `walletconnect_pair`
3. Scan with Pera Wallet (TestNet mode)
4. Approve connection
5. Call `walletconnect_status` to verify
6. Call `send_payment` to a TestNet address
7. Approve transaction in Pera
8. Verify transaction on explorer
9. Restart MCP server
10. Call `walletconnect_status` - should still be connected

## Implementation Phases

### Phase 1: Core Package
- [ ] Create `packages/provider-walletconnect`
- [ ] Implement `WalletConnectProvider` class
- [ ] Implement session persistence
- [ ] Implement QR code generation
- [ ] Add to provider interface types

### Phase 2: MCP Integration
- [ ] Add WalletConnect tools to MCP server
- [ ] Integrate with AppState
- [ ] Update account resolution logic
- [ ] Test with existing transaction tools

### Phase 3: Polish
- [ ] Error messages and recovery hints
- [ ] Timeout handling
- [ ] Network mismatch detection
- [ ] Documentation

### Phase 4: CLI (Optional)
- [ ] `vibekit walletconnect pair`
- [ ] `vibekit walletconnect status`
- [ ] `vibekit walletconnect disconnect`
