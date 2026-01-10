/**
 * State Module
 *
 * Unified application state for network, provider, and wallet management.
 */

// Types (re-exported from types.ts which re-exports from config.ts)
export type {
  NetworkType,
  NetworkPreset,
  NetworkConfig,
  ProviderConfigs,
  InitConfig,
  VaultProviderConfig,
} from './types.js'

// Network presets (from config.ts)
export { NETWORK_PRESETS } from '../config.js'

// AppState class
export { AppState } from './app-state.js'

// Singleton instance
import { AppState } from './app-state.js'
export const appState = new AppState()
