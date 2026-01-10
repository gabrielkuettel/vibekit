/**
 * Cursor Agent Definition
 */

import type { AgentDefinition } from '../types'

export const cursor: AgentDefinition = {
  id: 'cursor',
  displayName: 'Cursor',
  configFile: '.cursor/mcp.json',
  configTemplate: {
    mcpServers: {
      kappa: { type: 'http', url: '$KAPPA_URL' },
      'vibekit-mcp': { command: '$VIBEKIT_PATH', args: ['mcp'], env: '$MCP_ENV' },
    },
  },
  skillsDir: '.cursor/rules',
  templateFile: '.cursorrules',
  templateContent: `# .cursorrules

All agents should read \`AGENTS.md\` as the canonical source for project guidance.

See AGENTS.md for:
- Available skills and when to use them
- MCP tools for documentation and code search
- Development workflows for Algorand smart contracts
`,
  authInstructions: 'In Cursor Settings → MCP → kappa → Authenticate',
  cliCommand: 'cursor',
}
