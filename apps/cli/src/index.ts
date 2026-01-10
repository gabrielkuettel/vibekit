/**
 * VibeKit - AI-assisted development environment for Algorand smart contracts
 */

import pc from 'picocolors'

import {
  commandInit,
  commandStatus,
  commandRemove,
  commandMcp,
  commandVault,
  commandAccount,
  commandDispenser,
} from './commands'
import { VERSION, URLS } from './config'

const LOGO = `
 \u2588\u2588    \u2588\u2588 \u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588\u2588\u2588 \u2588\u2588   \u2588\u2588 \u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588
 \u2588\u2588    \u2588\u2588 \u2588\u2588 \u2588\u2588   \u2588\u2588 \u2588\u2588      \u2588\u2588  \u2588\u2588  \u2588\u2588    \u2588\u2588
 \u2588\u2588    \u2588\u2588 \u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588   \u2588\u2588\u2588\u2588\u2588   \u2588\u2588    \u2588\u2588
  \u2588\u2588  \u2588\u2588  \u2588\u2588 \u2588\u2588   \u2588\u2588 \u2588\u2588      \u2588\u2588  \u2588\u2588  \u2588\u2588    \u2588\u2588
   \u2588\u2588\u2588\u2588   \u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588\u2588\u2588 \u2588\u2588   \u2588\u2588 \u2588\u2588    \u2588\u2588
`

function showVersion(): void {
  console.log(`vibekit v${VERSION}`)
}

function showHelp(): void {
  console.log(`
${pc.bold('VibeKit')} \u2014 Deploy contracts. Manage assets. Query the chain. All through your favorite AI agent.

${pc.bold('Usage:')}
  vibekit init               Run the interactive setup wizard
  vibekit mcp                Run the MCP server (for IDE integration)
  vibekit status             Show status of all components
  vibekit remove             Remove VibeKit configs

  vibekit vault <cmd>        Manage HashiCorp Vault
  vibekit account <cmd>      Dangerous account operations (rekey, remove)
  vibekit dispenser <cmd>    TestNet Dispenser authentication

${pc.bold('Account Management:')}
  Most account operations are done through your AI coding agent:
    - Create accounts: ask agent to use ${pc.cyan('create_account')}
    - List accounts:   ask agent to use ${pc.cyan('list_accounts')}
    - Fund accounts:   ask agent to use ${pc.cyan('fund_account')}

  CLI-only (require human confirmation):
    account rekey-to-self <name>   Transfer control to your wallet
    account remove <name>          Permanently delete account

${pc.bold('Vault Commands:')}
  vault start             Start Vault and unseal
  vault stop              Stop Vault container
  vault unseal            Unseal a running Vault (prompts for key)
  vault status            Show Vault status
  vault token create      Create MCP token (limited permissions)
  vault token revoke      Revoke MCP token
  vault token status      Show MCP token info

${pc.bold('Dispenser Commands:')}
  dispenser login         Authenticate with TestNet Dispenser
  dispenser logout        Remove saved dispenser token

${pc.bold('Links:')}
  Documentation:  ${pc.cyan(URLS.vibekit)}
`)
}

interface ParsedArgs {
  showVersion: boolean
  showHelp: boolean
  subcommand: string | null
  subcommandArgs: string[]
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2)
  const subcommands = ['init', 'vault', 'account', 'dispenser', 'status', 'remove', 'mcp']

  if (subcommands.includes(args[0])) {
    return {
      showVersion: false,
      showHelp: false,
      subcommand: args[0],
      subcommandArgs: args.slice(1),
    }
  }

  return {
    showVersion: args.includes('--version') || args.includes('-v'),
    showHelp: args.includes('--help') || args.includes('-h'),
    subcommand: null,
    subcommandArgs: [],
  }
}

async function main(): Promise<boolean> {
  const args = parseArgs()

  if (args.showVersion) {
    showVersion()
    return true
  }

  if (args.showHelp) {
    showHelp()
    return true
  }

  switch (args.subcommand) {
    case 'init':
      await commandInit()
      return true
    case 'account':
      await commandAccount(args.subcommandArgs)
      return true
    case 'vault':
      await commandVault(args.subcommandArgs)
      return true
    case 'dispenser':
      await commandDispenser(args.subcommandArgs)
      return true
    case 'status':
      await commandStatus()
      return true
    case 'remove':
      await commandRemove()
      return true
    case 'mcp':
      await commandMcp()
      return false // Don't exit - MCP server needs to stay alive
    default:
      console.log(pc.cyan(LOGO))
      showHelp()
      return true
  }
}

main().then((shouldExit) => {
  if (shouldExit) process.exit(0)
})
