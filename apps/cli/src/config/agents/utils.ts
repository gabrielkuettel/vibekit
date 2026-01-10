/**
 * Agent Utility Functions
 *
 * Helper functions for working with the agent registry.
 */

import { join } from 'path'
import { AGENTS, type AgentId, type AgentSelection } from './index'
import type { AgentDefinition } from './types'

/**
 * Get agent definitions for the selected agents
 */
export function getEnabledAgents(selected: AgentSelection): AgentDefinition[] {
  return selected.map((id) => AGENTS[id])
}

/**
 * Get the config file path for an agent (returns undefined if agent has no config)
 */
export function getAgentConfigPath(basePath: string, agent: AgentDefinition): string | undefined {
  if (!agent.configFile) return undefined
  return join(basePath, agent.configFile)
}

/**
 * Get the skills directory path for an agent (returns undefined if agent has no skills dir)
 */
export function getAgentSkillsDir(basePath: string, agent: AgentDefinition): string | undefined {
  if (!agent.skillsDir) return undefined
  return join(basePath, agent.skillsDir)
}

/**
 * Get the template file path for an agent (returns undefined if agent has no template)
 */
export function getAgentTemplateFile(basePath: string, agent: AgentDefinition): string | undefined {
  if (!agent.templateFile) return undefined
  return join(basePath, agent.templateFile)
}

/**
 * Get all skills directories for the selected agents (only agents with skills dirs)
 */
export function getAllAgentSkillsDirs(basePath: string, selected: AgentSelection): string[] {
  return getEnabledAgents(selected)
    .filter((agent) => agent.skillsDir)
    .map((agent) => join(basePath, agent.skillsDir!))
}

/**
 * Get an agent by ID (useful when you have a string ID)
 */
export function getAgentById(id: AgentId): AgentDefinition {
  return AGENTS[id]
}

/**
 * Check if an agent ID is valid
 */
export function isValidAgentId(id: string): id is AgentId {
  return id in AGENTS
}
