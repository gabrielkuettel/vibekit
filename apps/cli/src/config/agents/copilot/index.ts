/**
 * GitHub Copilot Agent Definition
 */

import type { AgentDefinition } from '../types'

export const copilot: AgentDefinition = {
  id: 'copilot',
  displayName: 'VS Code Copilot [EXPERIMENTAL]',
  configFile: '.vscode/mcp.json',
  configTemplate: {
    servers: {
      kappa: { type: 'http', url: '$KAPPA_URL' },
      'vibekit-mcp': {
        type: 'stdio',
        command: '$VIBEKIT_PATH',
        args: ['mcp'],
        env: '$MCP_ENV',
      },
    },
  },
  templateFile: '.github/copilot-instructions.md',
  templateContent: `# copilot-instructions.md

All agents should read \`AGENTS.md\` as the canonical source for project guidance.

See [AGENTS.md](../AGENTS.md) for:

- Available skills and when to use them
- MCP tools for documentation and code search
- Development workflows for Algorand smart contracts
`,
  skillsDir: '.github/skills',
  authInstructions: 'In VS Code: Open .vscode/mcp.json → Click "Start" above kappa',
}
