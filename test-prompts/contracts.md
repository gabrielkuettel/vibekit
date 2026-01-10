# Contracts Tools Test Prompt

Test the MCP smart contract tools on localnet. Report PASS/FAIL for each test.

**Prerequisites:** A funded account (USER1) must exist. Run accounts.md first.

## Tools Tested

- app_deploy
- app_get_info
- app_list_methods
- app_call
- app_opt_in
- app_close_out
- app_delete

## HelloWorld Contract Tests

Use this app spec for the HelloWorld contract:

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

### Deployment

1. Use app_deploy with the app spec above
   - Verify: returns appId and transaction ID
   - Note the app ID for subsequent tests

### App Info

2. Use app_get_info with the app ID
   - Verify: shows creator address
   - Verify: shows approvalProgram and clearStateProgram hashes
   - Verify: shows globalStateSchema and localStateSchema

3. Use app_list_methods with the app spec
   - Verify: lists "sayHello" and "sayBananas" methods
   - Verify: shows method signatures "sayHello(string,string)string" and "sayBananas()string"

### Calling Methods

4. Use app_call to call the "sayHello" method:
   - appId: (from step 1)
   - methodSignature: "sayHello(string,string)string"
   - args: ["Alice", "Smith"]
   - Verify: returns "Hello Alice Smith"

5. Use app_call to call "sayBananas":
   - methodSignature: "sayBananas()string"
   - args: []
   - Verify: returns "Bananas"

### Local State (Opt-In / Close-Out)

6. Create a second funded account USER2 if not exists

7. As USER2, use app_opt_in with the app ID
   - Verify: returns transaction ID

8. Use get_account_info for USER2
   - Verify: shows the app in opted-in applications

9. As USER2, use app_close_out with the app ID
   - Verify: returns transaction ID

10. Use get_account_info for USER2
    - Verify: app no longer in opted-in applications

### App Deletion

11. As the creator (USER1), use app_delete with the app ID
    - Verify: returns transaction ID

12. Use app_get_info with the app ID
    - Verify: app no longer exists or shows as deleted

## Counter Contract Tests (with state)

Use this app spec for the Counter contract:

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
  "sourceInfo": {
    "approval": { "sourceInfo": [], "pcOffsetMethod": "none" },
    "clear": { "sourceInfo": [], "pcOffsetMethod": "none" }
  },
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

13. Deploy the Counter contract with the app spec above
    - Note the app ID

14. Call "increment" method:
    - methodSignature: "increment()uint64"
    - Verify: returns 1

15. Call "increment" again
    - Verify: returns 2

16. Use read_global_state to verify counter value is 2

17. Delete the Counter app

## Summary

| Tool             | Test Steps |
| ---------------- | ---------- |
| app_deploy       | 1, 13      |
| app_get_info     | 2, 12      |
| app_list_methods | 3          |
| app_call         | 4-5, 14-15 |
| app_opt_in       | 7          |
| app_close_out    | 9          |
| app_delete       | 11, 17     |
