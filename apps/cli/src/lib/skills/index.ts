/**
 * Skills Service Layer
 *
 * Fetches skills from GitHub at runtime.
 * Pure business logic - no CLI dependencies (@clack/prompts, picocolors).
 * Used by: commands/init/phases/create.ts
 */

import type { SkillFile, SkillDirectory } from '../../types'

const SKILLS_REPO = 'algorand-devrel/algorand-agent-skills'
const SKILLS_PATH = 'skills'
const SKILLS_REF = 'main'

interface GitHubContentItem {
  name: string
  path: string
  type: 'file' | 'dir'
  url: string
  download_url: string | null
}

/**
 * Fetch skills from the GitHub repository
 * Returns a Map of skill names to their files
 */
export async function fetchSkillsFromGitHub(): Promise<SkillDirectory[]> {
  const apiUrl = `https://api.github.com/repos/${SKILLS_REPO}/contents/${SKILLS_PATH}?ref=${SKILLS_REF}`

  const response = await fetch(apiUrl)

  if (!response.ok) {
    throw new Error(`Failed to fetch skills directory: ${response.status} ${response.statusText}`)
  }

  const skillDirs: GitHubContentItem[] = await response.json()
  const skills: SkillDirectory[] = []

  for (const dir of skillDirs) {
    if (dir.type !== 'dir') continue

    const skillFiles = await fetchSkillFiles(dir.url)
    if (skillFiles.length > 0) {
      skills.push({
        name: dir.name,
        files: skillFiles,
      })
    }
  }

  return skills
}

/**
 * Recursively fetch all markdown files from a skill directory
 */
async function fetchSkillFiles(dirUrl: string, basePath = ''): Promise<SkillFile[]> {
  const response = await fetch(dirUrl)

  if (!response.ok) {
    throw new Error(`Failed to fetch skill directory: ${response.status}`)
  }

  const items: GitHubContentItem[] = await response.json()
  const files: SkillFile[] = []

  for (const item of items) {
    if (item.type === 'dir') {
      // Recursively fetch subdirectory files
      const subPath = basePath ? `${basePath}/${item.name}` : item.name
      const subFiles = await fetchSkillFiles(item.url, subPath)
      files.push(...subFiles)
    } else if (item.type === 'file' && item.name.endsWith('.md') && item.download_url) {
      // Fetch markdown file content
      const contentResponse = await fetch(item.download_url)

      if (!contentResponse.ok) {
        console.warn(`Failed to fetch ${item.path}: ${contentResponse.status}`)
        continue
      }

      const content = await contentResponse.text()
      const filePath = basePath ? `${basePath}/${item.name}` : item.name

      files.push({
        path: filePath,
        content,
      })
    }
  }

  return files
}

/**
 * Get the count of skills (for display)
 */
export function getSkillsCount(skills: SkillDirectory[]): number {
  return skills.length
}
