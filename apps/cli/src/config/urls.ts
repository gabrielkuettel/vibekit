/**
 * External URLs and Endpoints
 *
 * Central location for all external URLs used by the CLI.
 * These may need to be versioned or updated over time.
 */

export const URLS = {
  // Documentation
  vibekit: 'https://github.com/gabrielkuettel/vibekit',
  algokitDocs: 'https://dev.algorand.co/getting-started/algokit-quick-start/',

  // AI Tools
  opencodeConfigSchema: 'https://opencode.ai/config.json',

  // MCP Servers
  kappaMcp: 'https://algorand-docs.mcp.kapa.ai/',

  // Installation Prerequisites
  homebrewInstall: 'https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh',
  pythonDownloads: 'https://www.python.org/downloads/',
  pipxDocs: 'https://pypa.github.io/pipx/',

  // GitHub
  githubPatSettings: 'https://github.com/settings/personal-access-tokens',
} as const

export type UrlKey = keyof typeof URLS
