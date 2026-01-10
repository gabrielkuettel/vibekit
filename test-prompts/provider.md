# Provider Tools Test Prompt

Test the MCP provider tools. Report PASS/FAIL for each test.

## Tools Tested

- get_provider

## Tests

### Provider Status

1. Use get_provider to check available providers
   - Verify: returns availableProviders array
   - Verify: returns providerStatus object with vault and keyring status
   - Verify: shows activeAccount (if one is set)
   - Verify: shows activeAccountProvider (if active account exists)

### Before Initialization

2. On a fresh system (before running `vibekit init`):
   - Use get_provider
   - Verify: availableProviders may be empty
   - Verify: hint suggests running `vibekit init`

### After Initialization

3. After running `vibekit init`:
   - Use get_provider
   - Verify: at least one provider is available (vault or keyring)

### With Active Account

4. After creating and switching to an account:
   - Use get_provider
   - Verify: activeAccount shows the current account address
   - Verify: activeAccountProvider shows "vault" or "keyring"

### Provider Availability

5. Check provider status details:
   - Verify: providerStatus.vault.available is boolean
   - Verify: providerStatus.keyring.available is boolean

## Summary

| Tool         | Test Steps |
| ------------ | ---------- |
| get_provider | 1-5        |
