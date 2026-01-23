/**
 * Claude Code Agent Definition
 */

import type { AgentDefinition } from '../types'

export const claude: AgentDefinition = {
  id: 'claude',
  displayName: 'Claude Code',
  configFile: '.mcp.json',
  baseConfigTemplate: {
    mcpServers: {},
  },
  mcpServersKey: 'mcpServers',
  skillsDir: '.claude/skills',
  templateFile: 'CLAUDE.md',
  templateContent: `# CLAUDE.md

All agents should read \`AGENTS.md\` as the canonical source for project guidance.

See [AGENTS.md](./AGENTS.md) for:

- Available skills and when to use them
- MCP tools for documentation and code search
- Development workflows for Algorand smart contracts
`,
  authInstructions: 'In Claude Code: /mcp → kappa → Authenticate',
  cliCommand: 'claude',
}
