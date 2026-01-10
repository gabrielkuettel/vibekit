# Accounts Tools Test Prompt

Test the MCP account management tools on localnet. Report PASS/FAIL for each test.

## Tools Tested

- list_accounts
- create_account
- get_account_info
- get_active_account
- switch_account
- fund_account
- send_payment

## Tests

### List and Active Account

1. Use list_accounts to see existing accounts
2. Use get_active_account to see which account is currently active

### Account Creation

3. Create an account called ACCT1 using create_account with provider "keyring"
   - Verify: returns address and confirms keyring storage
4. Create an account called ACCT2 using create_account with provider "vault"
   - Verify: returns address and confirms vault storage
5. Use list_accounts again
   - Verify: both ACCT1 and ACCT2 appear in the list

### Account Switching

6. Use switch_account to make ACCT1 the active account
7. Use get_active_account
   - Verify: returns ACCT1's address
8. Use switch_account to make ACCT2 active
9. Use get_active_account
   - Verify: returns ACCT2's address

### Funding

10. Use fund_account to fund ACCT1 with 10 ALGO
    - Verify: returns transaction ID
11. Use fund_account to fund ACCT2 with 10 ALGO
    - Verify: returns transaction ID

### Account Info

12. Use get_account_info for ACCT1
    - Verify: shows balance of ~10 ALGO (minus any fees)
    - Verify: shows minBalance, totalAssetsOptedIn, totalCreatedAssets
13. Use get_account_info for ACCT2
    - Verify: shows balance of ~10 ALGO

### Payments

14. Switch to ACCT1 as active account
15. Use send_payment to send 1 ALGO from ACCT1 to ACCT2
    - Verify: returns transaction ID
16. Use get_account_info for ACCT1
    - Verify: balance decreased by ~1 ALGO + fee
17. Use get_account_info for ACCT2
    - Verify: balance increased by 1 ALGO

### Payment with Note

18. Use send_payment to send 0.5 ALGO from ACCT2 to ACCT1 with note "Test payment"
    - Verify: returns transaction ID

## Summary

| Tool               | Test Steps   |
| ------------------ | ------------ |
| list_accounts      | 1, 5         |
| create_account     | 3-4          |
| get_account_info   | 12-13, 16-17 |
| get_active_account | 2, 7, 9      |
| switch_account     | 6, 8, 14     |
| fund_account       | 10-11        |
| send_payment       | 15, 18       |
