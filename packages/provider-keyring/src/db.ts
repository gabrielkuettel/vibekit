/**
 * Internal SQLite database for account metadata.
 *
 * Stores non-sensitive account info to avoid keyring prompts when listing.
 * Secrets (mnemonics, private keys) remain in the OS keyring.
 */

import { Database } from 'bun:sqlite'
import { join } from 'path'
import { getVibekitDir, ensureVibekitDirSync } from '@vibekit/config'

function getAccountsDbPath(): string {
  return join(getVibekitDir(), 'accounts.db')
}

export interface AccountRow {
  name: string
  address: string
  created_at: string
}

let db: Database | null = null

function getDb(): Database {
  if (db) return db

  ensureVibekitDirSync()
  db = new Database(getAccountsDbPath())
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      name TEXT PRIMARY KEY,
      address TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)
  return db
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

/** Initialize the accounts database. Called during CLI init. */
export function initAccountsDb(): void {
  getDb()
}
