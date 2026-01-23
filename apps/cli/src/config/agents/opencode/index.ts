/**
 * OpenCode Agent Definition
 */

import type { AgentDefinition } from '../types'

export const opencode: AgentDefinition = {
  id: 'opencode',
  displayName: 'OpenCode',
  configFile: 'opencode.json',
  baseConfigTemplate: {
    $schema: 'https://opencode.ai/config.json',
    mcp: {},
  },
  mcpServersKey: 'mcp',
  skillsDir: '.opencode/skill',
  authInstructions: 'Run: opencode mcp auth kappa',
  cliCommand: 'opencode',
}
