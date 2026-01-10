# Utilities Tools Test Prompt

Test the MCP utility tools. Report PASS/FAIL for each test.

**Note:** Most utility tools are pure functions and don't require network access.

## Tools Tested

- algo_to_microalgo
- microalgo_to_algo
- validate_address
- get_application_address
- calculate_min_balance

## Unit Conversion Tests

### ALGO to MicroALGO

1. Use algo_to_microalgo with amount: 1
   - Verify: returns 1000000

2. Use algo_to_microalgo with amount: 0.5
   - Verify: returns 500000

3. Use algo_to_microalgo with amount: 10.123456
   - Verify: returns 10123456

4. Use algo_to_microalgo with amount: 0.000001
   - Verify: returns 1

5. Use algo_to_microalgo with amount: 0
   - Verify: returns 0

### MicroALGO to ALGO

6. Use microalgo_to_algo with amount: 1000000
   - Verify: returns 1

7. Use microalgo_to_algo with amount: 500000
   - Verify: returns 0.5

8. Use microalgo_to_algo with amount: 10123456
   - Verify: returns 10.123456

9. Use microalgo_to_algo with amount: 1
   - Verify: returns 0.000001

10. Use microalgo_to_algo with amount: 0
    - Verify: returns 0

## Address Validation Tests

### Valid Addresses

11. Use validate_address with a valid Algorand address:
    - address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"
    - Verify: returns valid: true

12. Use validate_address with another valid address (use a real account address from localnet):
    - Verify: returns valid: true

### Invalid Addresses

13. Use validate_address with an invalid address (wrong length):
    - address: "ABC123"
    - Verify: returns valid: false with error message

14. Use validate_address with an invalid checksum:
    - address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    - Verify: returns valid: false

15. Use validate_address with empty string:
    - address: ""
    - Verify: returns valid: false

## Application Address Tests

16. Use get_application_address with appId: 1
    - Verify: returns a valid 58-character Algorand address
    - Verify: address starts with expected prefix for app addresses

17. Use get_application_address with appId: 123456789
    - Verify: returns a different valid address

18. Use get_application_address with appId: 0
    - Verify: returns appropriate error or zero-app address

## Minimum Balance Calculation Tests

19. Use calculate_min_balance with a basic account (no assets, no apps):
    - numAssets: 0
    - numCreatedAssets: 0
    - numAppsOptedIn: 0
    - numCreatedApps: 0
    - Verify: returns 100000 (0.1 ALGO base minimum)

20. Use calculate_min_balance with assets:
    - numAssets: 5
    - Verify: returns higher than base (100000 + 5 \* 100000 = 600000)

21. Use calculate_min_balance with created assets:
    - numCreatedAssets: 2
    - Verify: returns appropriate amount

22. Use calculate_min_balance with opted-in apps:
    - numAppsOptedIn: 3
    - Verify: returns appropriate amount including local state costs

23. Use calculate_min_balance with created apps:
    - numCreatedApps: 1
    - numGlobalStateInts: 5
    - numGlobalStateBytes: 3
    - Verify: returns appropriate amount including global state costs

24. Use calculate_min_balance with a complex account:
    - numAssets: 10
    - numCreatedAssets: 2
    - numAppsOptedIn: 5
    - numCreatedApps: 1
    - Verify: returns sum of all minimum balance requirements

## Summary

| Tool                    | Test Steps |
| ----------------------- | ---------- |
| algo_to_microalgo       | 1-5        |
| microalgo_to_algo       | 6-10       |
| validate_address        | 11-15      |
| get_application_address | 16-18      |
| calculate_min_balance   | 19-24      |
