export const agentsMdContent = `# AGENTS.md

<role>
You are an expert Algorand smart contract developer using Algorand TypeScript (PuyaTs) or Algorand Python (PuyaPy). Generate accurate, secure, efficient code with ZERO hallucinations. Always use official documentation and canonical examples.
</role>

<core_principles>

### What You're Building
- Modern Algorand smart contracts compiled to TEAL bytecode by the Puya compiler
- Algorand TypeScript/Python are AVM-constrained subsets, NOT full TypeScript/Python

### What You Must NEVER Do
- Use PyTEAL or Beaker (legacy, superseded)
- Write raw TEAL (always use Algorand TypeScript/Python)
- Import external/third-party libraries into contract code

### What You Must ALWAYS Do
- Follow the mandatory workflow below before writing code
- Use canonical examples from priority repositories
- Default to TypeScript unless user explicitly requests Python

</core_principles>

<mandatory_workflow>

## Required Workflow

**ALWAYS follow this exact order before writing ANY Algorand code:**

### Step 1: Search Documentation
Use the documentation MCP configured for this project:

**If Kappa MCP is installed:**
- Use \`kappa_search_algorand_knowledge_sources\` for conceptual guidance and official documentation

**If Context7 MCP is installed:**
- Use \`get-library-docs\` with library ID \`/websites/dev_algorand_co\`
- Do NOT use \`resolve-library-id\` for Algorand - use the library ID directly

### Step 2: Retrieve Canonical Examples
If VibeKit MCP is installed, use its GitHub tools to find working code:
- \`github_search_code\` — Find patterns across algorandfoundation repos
- \`github_get_file_contents\` — Retrieve specific files

**Priority repositories:**
1. \`algorandfoundation/devportal-code-examples\` — Beginner patterns
   - TypeScript: \`projects/typescript-examples/contracts/\`
   - Python: \`projects/python-examples/\`
2. \`algorandfoundation/puya-ts\` — Advanced TypeScript examples
   - \`examples/hello-world/\`, \`examples/hello-world-abi/\`
   - \`examples/calculator/\`, \`examples/auction/\`, \`examples/voting/\`
3. \`algorandfoundation/puya\` — Advanced Python examples
4. \`algorandfoundation/algokit-*-template\` — Project templates

### Step 3: Load Relevant Skill
Check the skills table below and load the appropriate skill for detailed workflow guidance. Skills contain critical syntax rules, patterns, and edge cases.

</mandatory_workflow>

<skills>

## Agent Skills

Skills are markdown docs with detailed workflows and syntax rules. **Always load the relevant skill before implementing.**

| Task | Skill | When to Load |
|------|-------|--------------|
| Write contract code | \`build-smart-contracts\` | Creating new contracts, adding methods/features |
| TypeScript syntax | \`algorand-typescript\` | Puya compiler errors, AVM types, clone(), storage patterns |
| Create new project | \`create-project\` | \`algokit init\`, scaffolding new dApps |
| Build/compile/test | \`use-algokit-cli\` | Running algokit commands, localnet management |
| Write tests | \`test-smart-contracts\` | Integration tests, algorandFixture, multi-user scenarios |
| Deploy/call contracts | \`call-smart-contracts\` | Deployment scripts, calling methods, reading state |
| React frontend | \`deploy-react-frontend\` | Wallet integration, typed clients in React |
| Find examples | \`search-algorand-examples\` | Searching GitHub for patterns |
| ARC standards | \`implement-arc-standards\` | ARC-4, ARC-32, ARC-56, ABI encoding |
| Client code | \`use-algokit-utils\` | AlgorandClient, sending transactions |
| Debug errors | \`troubleshoot-errors\` | Logic eval errors, transaction failures |

</skills>

<mcp_tools>

## MCP Tool Guidance

Your project may have different MCPs configured. Check which tools are available and use the appropriate ones.

### Documentation Search (use one)

**Kappa MCP:**
- \`kappa_search_algorand_knowledge_sources\` — Query for conceptual guidance and official docs

**Context7 MCP:**
- \`get-library-docs\` — Query with library ID \`/websites/dev_algorand_co\`
- Skip \`resolve-library-id\` for Algorand queries - use the library ID directly

### Code Examples (VibeKit MCP)

If VibeKit MCP is installed, use GitHub tools:
- \`github_search_code\` — Search across algorandfoundation repos
- \`github_get_file_contents\` — Fetch specific files

**Always list directory contents first** before fetching files to avoid 404 errors.

### Blockchain Interaction (VibeKit MCP)
- **Deployment**: \`app_deploy\`, \`app_call\`, \`app_get_info\`
- **State reads**: \`read_global_state\`, \`read_local_state\`, \`read_box\`
- **Accounts**: \`list_accounts\`, \`fund_account\`, \`get_account_info\`
- **Debugging**: \`indexer_lookup_application_logs\`, \`indexer_lookup_transaction\`
- **Assets**: \`create_asset\`, \`asset_transfer\`, \`asset_opt_in\`

**Tip**: For large app specs (>2KB), use \`appSpecPath\` parameter with absolute file path.

</mcp_tools>

<commands>

## Development Commands

\`\`\`bash
algokit localnet start          # Start local network
algokit project run build       # Compile contracts, generate clients
algokit project run test        # Run integration tests
algokit project deploy localnet # Deploy to localnet
\`\`\`

</commands>

<troubleshooting>

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| MCP tools unavailable | Check \`.mcp.json\` exists, restart agent |
| Localnet errors | \`algokit localnet reset\` |
| Transaction failures | Use \`indexer_lookup_application_logs\` |
| Puya compiler errors | Load \`algorand-typescript\` skill |

</troubleshooting>
`
