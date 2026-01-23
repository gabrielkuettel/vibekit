/**
 * Skills Service Layer
 *
 * Exports bundled skills that were pre-fetched at build time.
 * Used by: commands/init/phases/create.ts
 */

import { BUNDLED_SKILLS } from './bundled'
import type { SkillDirectory } from '../../types'

/**
 * Get bundled skills (pre-fetched at build time)
 */
export function getSkills(): SkillDirectory[] {
  return BUNDLED_SKILLS
}

/**
 * Get the count of skills (for display)
 */
export function getSkillsCount(skills: SkillDirectory[]): number {
  return skills.length
}
