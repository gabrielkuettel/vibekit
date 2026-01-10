/**
 * Vault Service Layer
 *
 * Pure business logic - no CLI dependencies (@clack/prompts, picocolors).
 * Used by: commands/vault/, commands/init/phases/
 */

export * from './types'
export * from './paths'
export * from './docker'
export * from './vault'
