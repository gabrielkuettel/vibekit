# Network Tools Test Prompt

Test the MCP network management tools. Report PASS/FAIL for each test.

## Tools Tested

- get_network
- switch_network

## Tests

### Get Current Network

1. Use get_network to see the current network configuration
   - Verify: returns network name (e.g., "localnet", "testnet", "mainnet")
   - Verify: returns algod URL and token info
   - Verify: returns indexer URL if configured

### Switch Networks

2. Use switch_network to switch to "localnet"
   - Verify: returns success confirmation
   - Verify: shows new network configuration

3. Use get_network
   - Verify: confirms network is now "localnet"

4. Use switch_network to switch to "testnet"
   - Verify: returns success confirmation

5. Use get_network
   - Verify: confirms network is now "testnet"
   - Verify: algod URL points to testnet endpoint

6. Use switch_network to switch back to "localnet"
   - Verify: returns success confirmation

### Invalid Network

7. Use switch_network with an invalid network name:
   - network: "invalidnetwork"
   - Verify: returns appropriate error message

### Network Connectivity

8. After switching to localnet, use list_accounts
   - Verify: succeeds, confirming network connection works

9. Switch to testnet and use get_account_info with a known testnet address
   - Verify: succeeds, confirming testnet connection works

## Summary

| Tool           | Test Steps |
| -------------- | ---------- |
| get_network    | 1, 3, 5    |
| switch_network | 2, 4, 6, 7 |
