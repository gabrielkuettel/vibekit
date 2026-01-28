/**
 * Skills Service Layer
 *
 * Exports bundled skills that were pre-fetched at build time.
 * Used by: commands/init/phases/create.ts
 */

import { BUNDLED_SKILLS } from './bundled'
import type { SkillDirectory } from '../../types'

/** Array of skill names selected by the user */
export type SkillSelection = string[]

/**
 * Get bundled skills (pre-fetched at build time)
 */
export function getSkills(): SkillDirectory[] {
  return BUNDLED_SKILLS
}

/**
 * Get all skill names (for selection UI)
 */
export function getSkillNames(): string[] {
  return BUNDLED_SKILLS.map((skill) => skill.name)
}

/**
 * Get skills filtered by selected names
 */
export function getSkillsByNames(names: SkillSelection): SkillDirectory[] {
  return BUNDLED_SKILLS.filter((skill) => names.includes(skill.name))
}

/**
 * Get the count of skills (for display)
 */
export function getSkillsCount(skills: SkillDirectory[]): number {
  return skills.length
}
