/**
 * @vibekit/db - SQLite Database Package
 *
 * Shared database for vibekit. Stores:
 * - Account metadata (name, address, created_at)
 * - Low-grade tokens (GitHub PAT, dispenser token)
 *
 * Database path: ~/.config/vibekit/accounts.db
 */

// Database initialization
export { initDb, getDb } from './database.js'

// Account operations
export {
  listAccountsFromDb,
  getAccountFromDb,
  insertAccountToDb,
  deleteAccountFromDb,
  hasAccountInDb,
  type AccountRow,
} from './accounts.js'

// Token operations
export {
  TOKEN_KEYS,
  type TokenKey,
  getToken,
  setToken,
  deleteToken,
  hasToken,
  // GitHub token
  getGithubToken,
  setGithubToken,
  deleteGithubToken,
  hasGithubToken,
  // Dispenser token
  getDispenserToken,
  setDispenserToken,
  deleteDispenserToken,
  hasDispenserToken,
} from './tokens.js'
