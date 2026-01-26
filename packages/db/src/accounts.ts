/**
 * Account Database Operations
 *
 * Stores non-sensitive account info to avoid keyring prompts when listing.
 * Secrets (mnemonics, private keys) remain in the OS keyring.
 */

import { getDb } from './database.js'

export interface AccountRow {
  name: string
  address: string
  created_at: string
}

export function listAccountsFromDb(): AccountRow[] {
  try {
    return getDb().query('SELECT * FROM accounts ORDER BY created_at DESC').all() as AccountRow[]
  } catch {
    return []
  }
}

export function getAccountFromDb(name: string): AccountRow | null {
  try {
    return getDb().query('SELECT * FROM accounts WHERE name = ?').get(name) as AccountRow | null
  } catch {
    return null
  }
}

/** Inserts account. Throws on conflict (account already exists). */
export function insertAccountToDb(name: string, address: string, createdAt: string): void {
  getDb().run('INSERT INTO accounts (name, address, created_at) VALUES (?, ?, ?)', [
    name,
    address,
    createdAt,
  ])
}

export function deleteAccountFromDb(name: string): void {
  getDb().run('DELETE FROM accounts WHERE name = ?', [name])
}

export function hasAccountInDb(name: string): boolean {
  return getAccountFromDb(name) !== null
}
