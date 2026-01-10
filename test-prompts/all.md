# Complete MCP Test Suite

End-to-end test of all VibeKit MCP tools on localnet. Report PASS/FAIL for each test.

**Target:** 42 tools across 10 categories

---

## Phase 1: Utilities (no dependencies)

### Unit Conversion

1. Use algo_to_microalgo with amount: 1 → expect 1000000
2. Use algo_to_microalgo with amount: 0.000001 → expect 1
3. Use microalgo_to_algo with amount: 1000000 → expect 1
4. Use microalgo_to_algo with amount: 1 → expect 0.000001

### Address Validation

5. Use validate_address with "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ" → expect valid
6. Use validate_address with "invalid" → expect invalid

### Application Address

7. Use get_application_address with appId: 12345 → expect valid 58-char address

### Minimum Balance

8. Use calculate_min_balance with numAssets: 0, numAppsOptedIn: 0 → expect 100000
9. Use calculate_min_balance with numAssets: 5 → expect 600000

---

## Phase 2: Network & Provider

### Network

10. Use get_network → note current network
11. Use switch_network to "localnet"
12. Use get_network → verify localnet

### Provider

13. Use get_provider → verify availableProviders includes "vault" or "keyring"

---

## Phase 3: Accounts

### Setup

14. Use list_accounts → note existing accounts
15. Use create_account with name "TEST1", provider "keyring" → note address
16. Use create_account with name "TEST2", provider "vault" → note address
17. Use list_accounts → verify TEST1 and TEST2 appear

### Funding

18. Use fund_account for TEST1 with 100 ALGO
19. Use fund_account for TEST2 with 100 ALGO

### Switching

20. Use switch_account to TEST1
21. Use get_active_account → verify TEST1

### Account Info

22. Use get_account_info for TEST1 → verify ~100 ALGO balance

### Payments

23. Use send_payment: 5 ALGO from TEST1 to TEST2 with note "test payment"
24. Use get_account_info for TEST2 → verify balance increased

---

## Phase 4: Assets

### Fungible Token

25. As TEST1, use create_asset:
    - name: "MegaToken", unitName: "MEGA", total: 1000000, decimals: 6
    - freezeAddress: TEST1, clawbackAddress: TEST1
    - Note ASSET_ID

26. Use get_asset_info for ASSET_ID → verify all params

### Opt-In & Transfer

27. As TEST2, use asset_opt_in for ASSET_ID
28. Use asset_transfer: 10000 MEGA from TEST1 to TEST2
29. Use get_account_info for TEST2 → verify MEGA balance

### Freeze

30. Use asset_freeze: freeze TEST2's MEGA holdings
31. Use asset_freeze: unfreeze TEST2

### Clawback

32. Use asset_transfer with clawbackTarget: revoke 5000 from TEST2 back to TEST1

### Config

33. Use asset_config: remove freeze address from ASSET_ID
34. Use get_asset_info → verify freezeAddress empty

### NFT

35. As TEST1, use create_asset:
    - name: "MegaNFT", unitName: "MNFT", total: 1, decimals: 0
    - Note NFT_ID

36. As TEST2, use asset_opt_in for NFT_ID
37. Use asset_transfer: send NFT from TEST1 to TEST2
38. Use asset_transfer: send NFT back to TEST1
39. As TEST2, use asset_opt_out for NFT_ID
40. Use asset_destroy for NFT_ID

---

## Phase 5: Contracts

### HelloWorld Deployment

41. Use app_deploy with HelloWorld app spec (see below) → note APP_ID

```json
{
  "name": "HelloWorld",
  "structs": {},
  "methods": [
    {
      "name": "sayHello",
      "args": [
        { "type": "string", "name": "firstName" },
        { "type": "string", "name": "lastName" }
      ],
      "returns": { "type": "string" },
      "actions": { "create": [], "call": ["NoOp"] },
      "readonly": false,
      "events": [],
      "recommendations": {}
    },
    {
      "name": "sayBananas",
      "args": [],
      "returns": { "type": "string" },
      "actions": { "create": [], "call": ["NoOp"] },
      "readonly": false,
      "events": [],
      "recommendations": {}
    }
  ],
  "arcs": [22, 28],
  "networks": {},
  "state": {
    "schema": { "global": { "ints": 0, "bytes": 0 }, "local": { "ints": 0, "bytes": 0 } },
    "keys": { "global": {}, "local": {}, "box": {} },
    "maps": { "global": {}, "local": {}, "box": {} }
  },
  "bareActions": { "create": ["NoOp"], "call": [] },
  "source": {
    "approval": "I3ByYWdtYSB2ZXJzaW9uIDExCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBAYWxnb3JhbmRmb3VuZGF0aW9uL2FsZ29yYW5kLXR5cGVzY3JpcHQvYXJjNC9pbmRleC5kLnRzOjpDb250cmFjdC5hcHByb3ZhbFByb2dyYW0oKSAtPiB1aW50NjQ6Cm1haW46CiAgICAvLyBjb250cmFjdHMvSGVsbG9Xb3JsZC9jb250cmFjdC5hbGdvLnRzOjE5CiAgICAvLyBleHBvcnQgZGVmYXVsdCBjbGFzcyBIZWxsb1dvcmxkIGV4dGVuZHMgSW50ZXJtZWRpYXRlIHsKICAgIHR4biBOdW1BcHBBcmdzCiAgICBieiBtYWluX19fYWxnb3RzX18uZGVmYXVsdENyZWF0ZUA5CiAgICB0eG4gT25Db21wbGV0aW9uCiAgICAhCiAgICBhc3NlcnQgLy8gT25Db21wbGV0aW9uIG11c3QgYmUgTm9PcAogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgIGFzc2VydAogICAgcHVzaGJ5dGVzcyAweDNhYWQ2ZDg2IDB4M2QyNWFlMzEgLy8gbWV0aG9kICJzYXlIZWxsbyhzdHJpbmcsc3RyaW5nKXN0cmluZyIsIG1ldGhvZCAic2F5QmFuYW5hcygpc3RyaW5nIgogICAgdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMAogICAgbWF0Y2ggc2F5SGVsbG8gbWFpbl9zYXlCYW5hbmFzX3JvdXRlQDUKICAgIGVycgoKbWFpbl9zYXlCYW5hbmFzX3JvdXRlQDU6CiAgICAvLyBjb250cmFjdHMvSGVsbG9Xb3JsZC9jb250cmFjdC5hbGdvLnRzOjExCiAgICAvLyBwdWJsaWMgc2F5QmFuYW5hcygpOiBzdHJpbmcgewogICAgcHVzaGJ5dGVzIDB4MTUxZjdjNzUwMDA3NDI2MTZlNjE2ZTYxNzMKICAgIGxvZwogICAgcHVzaGludCAxIC8vIDEKICAgIHJldHVybgoKbWFpbl9fX2FsZ290c19fLmRlZmF1bHRDcmVhdGVAOToKICAgIC8vIGNvbnRyYWN0cy9IZWxsb1dvcmxkL2NvbnRyYWN0LmFsZ28udHM6MTkKICAgIC8vIGV4cG9ydCBkZWZhdWx0IGNsYXNzIEhlbGxvV29ybGQgZXh0ZW5kcyBJbnRlcm1lZGlhdGUgewogICAgdHhuIE9uQ29tcGxldGlvbgogICAgIQogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgICEKICAgICYmCiAgICByZXR1cm4gLy8gb24gZXJyb3I6IE9uQ29tcGxldGlvbiBtdXN0IGJlIE5vT3AgJiYgY2FuIG9ubHkgY2FsbCB3aGVuIGNyZWF0aW5nCgoKLy8gY29udHJhY3RzL0hlbGxvV29ybGQvY29udHJhY3QuYWxnby50czo6SGVsbG9Xb3JsZC5zYXlIZWxsb1tyb3V0aW5nXSgpIC0+IHZvaWQ6CnNheUhlbGxvOgogICAgLy8gY29udHJhY3RzL0hlbGxvV29ybGQvY29udHJhY3QuYWxnby50czoyNgogICAgLy8gcHVibGljIHNheUhlbGxvKGZpcnN0TmFtZTogc3RyaW5nLCBsYXN0TmFtZTogc3RyaW5nKTogc3RyaW5nIHsKICAgIHR4bmEgQXBwbGljYXRpb25BcmdzIDEKICAgIGV4dHJhY3QgMiAwCiAgICB0eG5hIEFwcGxpY2F0aW9uQXJncyAyCiAgICBleHRyYWN0IDIgMAogICAgLy8gY29udHJhY3RzL0hlbGxvV29ybGQvY29udHJhY3QuYWxnby50czoyNwogICAgLy8gY29uc3QgcmVzdWx0ID0gYEhlbGxvICR7Zmlyc3ROYW1lfSAke2xhc3ROYW1lfWAKICAgIHB1c2hieXRlcyAiSGVsbG8gIgogICAgdW5jb3ZlciAyCiAgICBjb25jYXQKICAgIHB1c2hieXRlcyAiICIKICAgIGNvbmNhdAogICAgc3dhcAogICAgY29uY2F0CiAgICAvLyBjb250cmFjdHMvSGVsbG9Xb3JsZC9jb250cmFjdC5hbGdvLnRzOjI2CiAgICAvLyBwdWJsaWMgc2F5SGVsbG8oZmlyc3ROYW1lOiBzdHJpbmcsIGxhc3ROYW1lOiBzdHJpbmcpOiBzdHJpbmcgewogICAgZHVwCiAgICBsZW4KICAgIGl0b2IKICAgIGV4dHJhY3QgNiAyCiAgICBzd2FwCiAgICBjb25jYXQKICAgIHB1c2hieXRlcyAweDE1MWY3Yzc1CiAgICBzd2FwCiAgICBjb25jYXQKICAgIGxvZwogICAgcHVzaGludCAxIC8vIDEKICAgIHJldHVybgo=",
    "clear": "I3ByYWdtYSB2ZXJzaW9uIDExCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBAYWxnb3JhbmRmb3VuZGF0aW9uL2FsZ29yYW5kLXR5cGVzY3JpcHQvYmFzZS1jb250cmFjdC5kLnRzOjpCYXNlQ29udHJhY3QuY2xlYXJTdGF0ZVByb2dyYW0oKSAtPiB1aW50NjQ6Cm1haW46CiAgICBwdXNoaW50IDEgLy8gMQogICAgcmV0dXJuCg=="
  },
  "byteCode": {
    "approval": "CzEbQQAwMRkURDEYRIICBDqtbYYEPSWuMTYaAI4CABwAAQCADRUffHUAB0JhbmFuYXOwgQFDMRkUMRgUEEM2GgFXAgA2GgJXAgCABkhlbGxvIE8CUIABIFBMUEkVFlcGAkxQgAQVH3x1TFCwgQFD",
    "clear": "C4EBQw=="
  },
  "compilerInfo": { "compiler": "puya", "compilerVersion": { "major": 5, "minor": 0, "patch": 0 } },
  "events": [],
  "templateVariables": {}
}
```

### App Info & Methods

42. Use app_get_info for APP_ID → verify creator, programs
43. Use app_list_methods with the app spec → verify "sayHello(string,string)string" and "sayBananas()string"

### App Calls

44. Use app_call: APP_ID, method "sayHello(string,string)string", args ["Alice", "Smith"] → expect "Hello Alice Smith"
45. Use app_call: method "sayBananas()string", args [] → expect "Bananas"

### Opt-In / Close-Out

46. As TEST2, use app_opt_in for APP_ID
47. As TEST2, use app_close_out for APP_ID

---

## Phase 6: State Reading

48. Use read_global_state for APP_ID → verify empty (HelloWorld has no state)

49. Deploy Counter contract with app spec below → note COUNTER_ID

```json
{
  "name": "Counter",
  "structs": {},
  "methods": [
    {
      "name": "increment",
      "args": [],
      "returns": { "type": "uint64" },
      "actions": { "create": [], "call": ["NoOp"] },
      "readonly": false,
      "events": [],
      "recommendations": {}
    }
  ],
  "arcs": [22, 28],
  "networks": {},
  "state": {
    "schema": { "global": { "ints": 1, "bytes": 0 }, "local": { "ints": 0, "bytes": 0 } },
    "keys": {
      "global": {
        "counter": { "keyType": "AVMString", "valueType": "AVMUint64", "key": "Y291bnRlcg==" }
      },
      "local": {},
      "box": {}
    },
    "maps": { "global": {}, "local": {}, "box": {} }
  },
  "bareActions": { "create": ["NoOp"], "call": [] },
  "source": {
    "approval": "I3ByYWdtYSB2ZXJzaW9uIDExCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBAYWxnb3JhbmRmb3VuZGF0aW9uL2FsZ29yYW5kLXR5cGVzY3JpcHQvYXJjNC9pbmRleC5kLnRzOjpDb250cmFjdC5hcHByb3ZhbFByb2dyYW0oKSAtPiB1aW50NjQ6Cm1haW46CiAgICBpbnRjYmxvY2sgMCAxCiAgICBieXRlY2Jsb2NrICJjb3VudGVyIgogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgIGJueiBtYWluX2FmdGVyX2lmX2Vsc2VAMgogICAgLy8gY29udHJhY3RzL0NvdW50ZXIvY29udHJhY3QuYWxnby50czo4CiAgICAvLyBwdWJsaWMgY291bnRlciA9IEdsb2JhbFN0YXRlPHVpbnQ2ND4oeyBpbml0aWFsVmFsdWU6IFVpbnQ2NCgwKSB9KQogICAgYnl0ZWNfMCAvLyAiY291bnRlciIKICAgIGludGNfMCAvLyAwCiAgICBhcHBfZ2xvYmFsX3B1dAoKbWFpbl9hZnRlcl9pZl9lbHNlQDI6CiAgICAvLyBjb250cmFjdHMvQ291bnRlci9jb250cmFjdC5hbGdvLnRzOjcKICAgIC8vIGV4cG9ydCBkZWZhdWx0IGNsYXNzIENvdW50ZXIgZXh0ZW5kcyBDb250cmFjdCB7CiAgICB0eG4gTnVtQXBwQXJncwogICAgYnogbWFpbl9fX2FsZ290c19fLmRlZmF1bHRDcmVhdGVANwogICAgcHVzaGJ5dGVzIDB4NGEzMjU5MDEgLy8gbWV0aG9kICJpbmNyZW1lbnQoKXVpbnQ2NCIKICAgIHR4bmEgQXBwbGljYXRpb25BcmdzIDAKICAgIG1hdGNoIG1haW5faW5jcmVtZW50X3JvdXRlQDUKICAgIGVycgoKbWFpbl9pbmNyZW1lbnRfcm91dGVANToKICAgIC8vIGNvbnRyYWN0cy9Db3VudGVyL2NvbnRyYWN0LmFsZ28udHM6MTQKICAgIC8vIHB1YmxpYyBpbmNyZW1lbnQoKTogdWludDY0IHsKICAgIHR4biBPbkNvbXBsZXRpb24KICAgICEKICAgIHR4biBBcHBsaWNhdGlvbklECiAgICAmJgogICAgYXNzZXJ0IC8vIE9uQ29tcGxldGlvbiBtdXN0IGJlIE5vT3AgJiYgY2FuIG9ubHkgY2FsbCB3aGVuIG5vdCBjcmVhdGluZwogICAgYiBpbmNyZW1lbnQKCm1haW5fX19hbGdvdHNfXy5kZWZhdWx0Q3JlYXRlQDc6CiAgICAvLyBjb250cmFjdHMvQ291bnRlci9jb250cmFjdC5hbGdvLnRzOjcKICAgIC8vIGV4cG9ydCBkZWZhdWx0IGNsYXNzIENvdW50ZXIgZXh0ZW5kcyBDb250cmFjdCB7CiAgICB0eG4gT25Db21wbGV0aW9uCiAgICAhCiAgICB0eG4gQXBwbGljYXRpb25JRAogICAgIQogICAgJiYKICAgIHJldHVybiAvLyBvbiBlcnJvcjogT25Db21wbGV0aW9uIG11c3QgYmUgTm9PcCAmJiBjYW4gb25seSBjYWxsIHdoZW4gY3JlYXRpbmcKCgovLyBjb250cmFjdHMvQ291bnRlci9jb250cmFjdC5hbGdvLnRzOjpDb3VudGVyLmluY3JlbWVudFtyb3V0aW5nXSgpIC0+IHZvaWQ6CmluY3JlbWVudDoKICAgIC8vIGNvbnRyYWN0cy9Db3VudGVyL2NvbnRyYWN0LmFsZ28udHM6MTUKICAgIC8vIHRoaXMuY291bnRlci52YWx1ZSA9IHRoaXMuY291bnRlci52YWx1ZSArIDEKICAgIGludGNfMCAvLyAwCiAgICAvLyBjb250cmFjdHMvQ291bnRlci9jb250cmFjdC5hbGdvLnRzOjgKICAgIC8vIHB1YmxpYyBjb3VudGVyID0gR2xvYmFsU3RhdGU8dWludDY0Pih7IGluaXRpYWxWYWx1ZTogVWludDY0KDApIH0pCiAgICBieXRlY18wIC8vICJjb3VudGVyIgogICAgLy8gY29udHJhY3RzL0NvdW50ZXIvY29udHJhY3QuYWxnby50czoxNQogICAgLy8gdGhpcy5jb3VudGVyLnZhbHVlID0gdGhpcy5jb3VudGVyLnZhbHVlICsgMQogICAgYXBwX2dsb2JhbF9nZXRfZXgKICAgIGFzc2VydCAvLyBjaGVjayBHbG9iYWxTdGF0ZSBleGlzdHMKICAgIGludGNfMSAvLyAxCiAgICArCiAgICAvLyBjb250cmFjdHMvQ291bnRlci9jb250cmFjdC5hbGdvLnRzOjgKICAgIC8vIHB1YmxpYyBjb3VudGVyID0gR2xvYmFsU3RhdGU8dWludDY0Pih7IGluaXRpYWxWYWx1ZTogVWludDY0KDApIH0pCiAgICBieXRlY18wIC8vICJjb3VudGVyIgogICAgLy8gY29udHJhY3RzL0NvdW50ZXIvY29udHJhY3QuYWxnby50czoxNQogICAgLy8gdGhpcy5jb3VudGVyLnZhbHVlID0gdGhpcy5jb3VudGVyLnZhbHVlICsgMQogICAgZGlnIDEKICAgIGFwcF9nbG9iYWxfcHV0CiAgICAvLyBjb250cmFjdHMvQ291bnRlci9jb250cmFjdC5hbGdvLnRzOjE0CiAgICAvLyBwdWJsaWMgaW5jcmVtZW50KCk6IHVpbnQ2NCB7CiAgICBpdG9iCiAgICBwdXNoYnl0ZXMgMHgxNTFmN2M3NQogICAgc3dhcAogICAgY29uY2F0CiAgICBsb2cKICAgIGludGNfMSAvLyAxCiAgICByZXR1cm4K",
    "clear": "I3ByYWdtYSB2ZXJzaW9uIDExCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBAYWxnb3JhbmRmb3VuZGF0aW9uL2FsZ29yYW5kLXR5cGVzY3JpcHQvYmFzZS1jb250cmFjdC5kLnRzOjpCYXNlQ29udHJhY3QuY2xlYXJTdGF0ZVByb2dyYW0oKSAtPiB1aW50NjQ6Cm1haW46CiAgICBwdXNoaW50IDEgLy8gMQogICAgcmV0dXJuCg=="
  },
  "byteCode": {
    "approval": "CyACAAEmAQdjb3VudGVyMRhAAAMoImcxG0EAGIAESjJZATYaAI4BAAEAMRkUMRgQREIACDEZFDEYFBBDIihlRCMIKEsBZxaABBUffHVMULAjQw==",
    "clear": "C4EBQw=="
  },
  "compilerInfo": { "compiler": "puya", "compilerVersion": { "major": 5, "minor": 0, "patch": 0 } },
  "events": [],
  "templateVariables": {}
}
```

50. Use app_call: COUNTER_ID, method "increment()uint64" → expect 1
51. Use read_global_state for COUNTER_ID → verify counter = 1

52. Call increment again → expect 2
53. Use read_global_state for COUNTER_ID → verify counter = 2

---

## Phase 7: Atomic Transactions

54. Use send_atomic_group with two payments:
    - TEST1 → TEST2: 1 ALGO
    - TEST2 → TEST1: 0.5 ALGO
    - Verify: both succeed atomically

55. Use send_atomic_group for atomic swap:
    - TEST1 → TEST2: 1 ALGO (payment)
    - TEST2 → TEST1: 1000 MEGA (asset transfer)
    - Verify: both succeed

---

## Phase 8: Indexer

**Note:** Wait 1-2 seconds after transactions for indexer to sync.

### Transaction Lookups

56. Use indexer_lookup_transaction with tx ID from step 23 (payment)
    - Verify: type "pay", correct sender/receiver/amount

57. Use indexer_lookup_transaction with tx ID from step 25 (asset creation)
    - Verify: type "acfg"

### Transaction Search

58. Use indexer_search_transactions with address=TEST1, addressRole="sender"
    - Verify: returns TEST1's sent transactions

59. Use indexer_search_transactions with assetId=ASSET_ID
    - Verify: returns asset-related transactions

60. Use indexer_search_transactions with txType="axfer"
    - Verify: returns asset transfers

61. Use indexer_search_transactions with limit=2
    - Verify: returns nextToken for pagination

### Asset Lookup

62. Use indexer_lookup_asset for ASSET_ID
    - Verify: creator, total, decimals, name, unitName

### Application Lookups

63. Use indexer_lookup_application for APP_ID
    - Verify: creator, program hashes

64. Use indexer_lookup_application_logs for APP_ID
    - Verify: contains logs from sayHello/sayBananas calls

65. Use indexer_search_transactions with applicationId=APP_ID
    - Verify: returns app create and call transactions

---

## Phase 9: GitHub

66. Use github_search_repos for "algorand sdk"
    - Verify: returns Algorand SDK repositories

67. Use github_search_code for "ApplicationCall language:typescript org:algorandfoundation"
    - Verify: returns code matches

68. Use github_get_file: owner "algorand", repo "go-algorand", path "README.md"
    - Verify: returns file contents

---

## Phase 10: Cleanup

69. Use app_delete for COUNTER_ID (if created)
70. Use app_delete for APP_ID
71. As TEST2, use asset_opt_out for ASSET_ID (close to TEST1)
72. Use asset_destroy for ASSET_ID

---

## Summary

| Category     | Tools                                                                                                                                      | Tests        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| Utilities    | algo_to_microalgo, microalgo_to_algo, validate_address, get_application_address, calculate_min_balance                                     | 1-9          |
| Network      | get_network, switch_network                                                                                                                | 10-12        |
| Provider     | get_provider                                                                                                                               | 13           |
| Accounts     | list_accounts, create_account, fund_account, switch_account, get_active_account, get_account_info, send_payment                            | 14-24        |
| Assets       | create_asset, get_asset_info, asset_opt_in, asset_opt_out, asset_transfer, asset_freeze, asset_config, asset_destroy                       | 25-40        |
| Contracts    | app_deploy, app_get_info, app_list_methods, app_call, app_opt_in, app_close_out, app_delete                                                | 41-47, 69-70 |
| State        | read_global_state, read_local_state, read_box                                                                                              | 48-53        |
| Transactions | send_atomic_group                                                                                                                          | 54-55        |
| Indexer      | indexer_lookup_transaction, indexer_search_transactions, indexer_lookup_asset, indexer_lookup_application, indexer_lookup_application_logs | 56-65        |
| GitHub       | github_search_repos, github_search_code, github_get_file                                                                                   | 66-68        |

**Total: 72 test steps covering 42 tools**
