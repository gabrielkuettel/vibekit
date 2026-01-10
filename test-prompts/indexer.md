# Indexer Tools Test Prompt

Running MCP Indexer tool tests on localnet. Report PASS/FAIL for each test.
Prerequisites: Accounts USER1 and USER2 should already exist and be funded.

**Important:** Indexer may have a slight delay (1-2 seconds) after transactions.
Wait briefly if a lookup returns "not found" immediately after a transaction.

## Setup Transactions (for indexer lookups)

1. Send 1 ALGO from USER1 to USER2, note the transaction ID
2. Create a test asset "IndexerTest" (IDXT) as USER1 with total=1000000, decimals=6
   - Note the asset ID and creation transaction ID
3. USER2 opts into the asset using asset_opt_in, note the tx ID
4. Transfer 1000 units from USER1 to USER2, note the tx ID

## Transaction Lookup Tests

5. Use indexer_lookup_transaction to look up the payment tx from step 1
   - Verify: type is "Payment", sender is USER1, receiver is USER2, amount is 1000000 (microAlgos)
6. Use indexer_lookup_transaction to look up the asset creation tx from step 2
   - Verify: type is "AssetConfig", assetConfig.assetId matches the created asset

## Transaction Search Tests

7. Use indexer_search_transactions with address=USER1's address and addressRole="sender"
   - Verify: returns transactions sent by USER1 (should include payment and asset ops)
8. Use indexer_search_transactions with assetId from step 2
   - Verify: returns the asset creation, opt-in, and transfer transactions (3+ txns)
9. Use indexer_search_transactions with txType="pay"
   - Verify: returns payment transactions including step 1
10. Use indexer_search_transactions with txType="axfer"
    - Verify: returns asset transfer transactions (opt-in and transfer)
11. Use indexer_search_transactions with limit=2, verify nextToken is returned
    - Then search again with that nextToken
    - Verify: pagination returns additional results

## Asset Indexer Test

12. Use indexer_lookup_asset to look up the asset from step 2
    - Verify: params.creator is USER1's address
    - Verify: params.total is "1000000", params.decimals is 6
    - Verify: params.name is "IndexerTest", params.unitName is "IDXT"
    - Verify: createdAtRound is present (historical data from indexer)

## Smart Contract Deployment (for application indexer tests)

13. Deploy a HelloWorld smart contract using app_deploy with this app spec JSON:

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
  "sourceInfo": {
    "approval": { "sourceInfo": [], "pcOffsetMethod": "none" },
    "clear": { "sourceInfo": [], "pcOffsetMethod": "none" }
  },
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

Note the app ID and deployment transaction ID.

## Application Indexer Tests

14. Use indexer_lookup_application with the app ID from step 13
    - Verify: creator matches the deployer address
    - Verify: globalStateSchema shows numUint: 0, numByteSlice: 0 (no state)
    - Verify: approvalProgramHash and clearStateProgramHash are present (16-char hex strings)

15. Call the sayHello method using app_call:
    - appId: (from step 13)
    - methodSignature: "sayHello(string,string)string"
    - args: ["Alice", "Smith"]
    - Note the call transaction ID

16. Use indexer_lookup_application_logs with the app ID from step 13
    - Verify: logEntries array contains an entry for the call from step 15
    - Verify: logs include the ARC-4 return value prefix (0x151f7c75)

17. Use indexer_search_transactions with applicationId from step 13
    - Verify: returns both the deployment (step 13) and call (step 15) transactions

18. Use indexer_search_transactions with txType="appl"
    - Verify: returns application transactions

## Cleanup

19. Delete the app using delete_app with the app ID from step 13
20. USER2 opts out of the asset using asset_opt_out (close to USER1)
21. Destroy the test asset using asset_destroy

## Summary

| Tool                            | Test Steps  |
| ------------------------------- | ----------- |
| indexer_lookup_transaction      | 5-6         |
| indexer_search_transactions     | 7-11, 17-18 |
| indexer_lookup_asset            | 12          |
| indexer_lookup_application      | 14          |
| indexer_lookup_application_logs | 16          |
