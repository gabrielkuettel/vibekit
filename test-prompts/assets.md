# Assets Tools Test Prompt

Test the MCP asset tools on localnet. Report PASS/FAIL for each test.

**Prerequisites:** Two funded accounts (USER1, USER2) must exist. Run accounts.md first.

## Tools Tested

- create_asset
- get_asset_info
- asset_opt_in
- asset_opt_out
- asset_transfer
- asset_freeze
- asset_config
- asset_destroy

## Fungible Token Tests

### Creation

1. As USER1, use create_asset to create a fungible token:
   - name: "TestToken"
   - unitName: "TKN"
   - total: 1000000
   - decimals: 6
   - freezeAddress: USER1's address
   - Note the asset ID

2. Use get_asset_info with the asset ID
   - Verify: name is "TestToken", unitName is "TKN"
   - Verify: total is 1000000, decimals is 6
   - Verify: creator is USER1's address
   - Verify: freezeAddress is USER1's address

### Opt-In and Transfer

3. As USER2, use asset_opt_in with the asset ID
   - Verify: returns transaction ID

4. Use asset_transfer to send 1000 units from USER1 to USER2
   - Verify: returns transaction ID

5. Use get_account_info for USER2
   - Verify: shows the asset with balance of 1000

6. Use asset_transfer to send 500 units from USER2 back to USER1
   - Verify: returns transaction ID

### Freeze/Unfreeze

7. As USER1, use asset_freeze to freeze USER2's holdings
   - assetId: (from step 1)
   - targetAddress: USER2's address
   - frozen: true
   - Verify: returns transaction ID

8. Attempt asset_transfer from USER2 to USER1
   - Verify: fails because USER2 is frozen

9. Use asset_freeze to unfreeze USER2
   - frozen: false
   - Verify: returns transaction ID

10. Attempt asset_transfer from USER2 to USER1 again
    - Verify: succeeds now

### Asset Configuration

11. Use asset_config to remove the freeze address
    - assetId: (from step 1)
    - freezeAddress: "" (empty string)
    - Verify: returns transaction ID

12. Use get_asset_info
    - Verify: freezeAddress is now empty/undefined

### Opt-Out and Destroy

13. As USER2, use asset_opt_out
    - assetId: (from step 1)
    - closeTo: USER1's address
    - Verify: returns transaction ID, remaining balance sent to USER1

14. Use asset_destroy with the asset ID
    - Verify: returns transaction ID

15. Use get_asset_info with the asset ID
    - Verify: asset no longer exists or shows as deleted

## NFT Tests

16. As USER1, use create_asset to create an NFT:
    - name: "TestNFT"
    - unitName: "NFT1"
    - total: 1
    - decimals: 0
    - Note the asset ID

17. Use get_asset_info
    - Verify: total is 1, decimals is 0

18. As USER2, use asset_opt_in

19. Use asset_transfer to send the NFT from USER1 to USER2

20. Use get_account_info for USER2
    - Verify: shows NFT with balance of 1

21. Use asset_transfer to send the NFT back to USER1

22. As USER2, use asset_opt_out

23. Use asset_destroy to destroy the NFT

## Clawback Tests

24. As USER1, create_asset with:
    - name: "ClawbackToken"
    - unitName: "CLBK"
    - total: 10000
    - decimals: 0
    - clawbackAddress: USER1's address
    - Note the asset ID

25. As USER2, asset_opt_in

26. Use asset_transfer to send 1000 units to USER2

27. Use asset_transfer with clawbackTarget to revoke 500 units from USER2:
    - sender: USER1 (clawback address)
    - receiver: USER1
    - clawbackTarget: USER2's address
    - amount: 500
    - Verify: returns transaction ID

28. Use get_account_info for USER2
    - Verify: balance is now 500 (was 1000, 500 clawed back)

29. Clean up: USER2 opts out, destroy the asset

## Summary

| Tool           | Test Steps                 |
| -------------- | -------------------------- |
| create_asset   | 1, 16, 24                  |
| get_asset_info | 2, 12, 15, 17              |
| asset_opt_in   | 3, 18, 25                  |
| asset_opt_out  | 13, 22, 29                 |
| asset_transfer | 4, 6, 8, 10, 19, 21, 26-27 |
| asset_freeze   | 7, 9                       |
| asset_config   | 11                         |
| asset_destroy  | 14, 23, 29                 |
