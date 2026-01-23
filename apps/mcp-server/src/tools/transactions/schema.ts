/**
 * Shared schema definitions for transaction tools
 */

export const transactionsSchema = {
  type: 'array',
  description: 'Array of transactions to execute atomically (max 16)',
  minItems: 1,
  maxItems: 16,
  items: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: [
          'payment',
          'asset_transfer',
          'asset_opt_in',
          'asset_opt_out',
          'asset_create',
          'asset_config',
          'asset_freeze',
          'asset_destroy',
          'app_call',
          'app_opt_in',
          'app_close_out',
          'app_delete',
        ],
        description: 'Transaction type',
      },
      sender: {
        type: 'string',
        description:
          'Sender address. Must be an account managed by the configured provider. If omitted, uses the active account.',
      },
      // Payment fields
      receiver: {
        type: 'string',
        description: '(payment, asset_transfer) Receiver address',
      },
      amount: {
        type: 'number',
        description:
          '(payment) Amount in microAlgos. (asset_transfer, asset_create) Amount in base units.',
      },
      closeRemainderTo: {
        type: 'string',
        description:
          '(payment) Address to receive remaining balance. Closes the account. Warning: irreversible.',
      },
      // Asset fields
      assetId: {
        type: 'number',
        description: '(asset_*) The asset ID',
      },
      // Asset create fields
      total: {
        type: 'number',
        description: '(asset_create) Total supply of the asset',
      },
      decimals: {
        type: 'number',
        description: '(asset_create) Number of decimals (0-19)',
      },
      assetName: {
        type: 'string',
        description: '(asset_create) Asset name',
      },
      unitName: {
        type: 'string',
        description: '(asset_create) Unit name',
      },
      url: {
        type: 'string',
        description: '(asset_create) Asset URL',
      },
      metadataHash: {
        type: 'string',
        description: '(asset_create) 32-byte metadata hash (64 hex chars or 44 base64 chars)',
      },
      defaultFrozen: {
        type: 'boolean',
        description: '(asset_create) Whether holdings are frozen by default',
      },
      manager: {
        type: 'string',
        description: '(asset_create, asset_config) Manager address',
      },
      reserve: {
        type: 'string',
        description: '(asset_create, asset_config) Reserve address',
      },
      freeze: {
        type: 'string',
        description: '(asset_create, asset_config) Freeze address',
      },
      clawback: {
        type: 'string',
        description: '(asset_create, asset_config) Clawback address',
      },
      // Asset freeze fields
      freezeTarget: {
        type: 'string',
        description: '(asset_freeze) Account to freeze/unfreeze',
      },
      frozen: {
        type: 'boolean',
        description: '(asset_freeze) Whether to freeze (true) or unfreeze (false)',
      },
      // Asset transfer fields
      clawbackTarget: {
        type: 'string',
        description: '(asset_transfer) For clawback: the account to claw back from',
      },
      closeAssetTo: {
        type: 'string',
        description: '(asset_opt_out, asset_transfer) Account to send remaining balance to',
      },
      ensureZeroBalance: {
        type: 'boolean',
        description: '(asset_opt_out) Fail if account has non-zero balance. Default: true',
      },
      // App call fields
      appId: {
        type: 'number',
        description: '(app_*) The application ID',
      },
      methodSignature: {
        type: 'string',
        description: '(app_call) ARC-4 method signature (e.g., "hello(string)string")',
      },
      appSpec: {
        type: 'string',
        description: '(app_call) Full ARC-56/32 app spec JSON as string',
      },
      appSpecPath: {
        type: 'string',
        description: '(app_call) Path to ARC-56/32 app spec JSON file',
      },
      method: {
        type: 'string',
        description: '(app_call) Method name when using appSpec/appSpecPath',
      },
      args: {
        type: 'array',
        description: '(app_call) Method arguments',
        items: {},
      },
      extraFee: {
        type: 'number',
        description:
          '(app_call) Extra fee in microALGO to cover inner transactions (e.g., 1000 per inner txn)',
      },
      maxFee: {
        type: 'number',
        description: '(app_call) Max fee in microALGO',
      },
      // Common fields
      note: {
        type: 'string',
        description: 'Optional transaction note (max 1000 bytes)',
      },
    },
    required: ['type'],
  },
} as const
