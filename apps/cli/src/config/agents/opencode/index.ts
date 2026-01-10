/**
 * OpenCode Agent Definition
 */

import type { AgentDefinition } from '../types'

export const opencode: AgentDefinition = {
  id: 'opencode',
  displayName: 'OpenCode',
  configFile: 'opencode.json',
  configTemplate: {
    $schema: 'https://opencode.ai/config.json',
    mcp: {
      kappa: { type: 'remote', url: '$KAPPA_URL', enabled: true },
      'vibekit-mcp': {
        type: 'local',
        command: '$VIBEKIT_COMMAND_ARRAY',
        environment: '$MCP_ENV',
        enabled: true,
      },
    },
  },
  skillsDir: '.opencode/skill',
  authInstructions: 'Run: opencode mcp auth kappa',
  cliCommand: 'opencode',
}
