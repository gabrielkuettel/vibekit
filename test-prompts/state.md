# State Tools Test Prompt

Test the MCP state reading tools on localnet. Report PASS/FAIL for each test.

**Prerequisites:**

- A funded account (USER1) must exist
- Run accounts.md first

## Tools Tested

- read_global_state
- read_local_state
- read_box

## Setup: Deploy Counter Contract

Deploy the Counter contract which has global state:

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

1. Deploy the Counter contract using app_deploy
   - Note the app ID

## Global State Tests

2. Use read_global_state with the app ID
   - Verify: returns the global state
   - Verify: shows counter = 0 (initial value)

3. Call increment using app_call:
   - methodSignature: "increment()uint64"
   - Verify: returns 1

4. Use read_global_state again
   - Verify: counter = 1

5. Call increment two more times

6. Use read_global_state
   - Verify: counter = 3

## Local State Tests

Note: The Counter contract doesn't have local state. These tests require a contract with local state schema.

7. If testing local state, deploy a contract with local state configured

8. As USER1, opt into the app using app_opt_in

9. Use read_local_state with:
   - appId: (from step 7)
   - address: USER1's address
   - Verify: returns local state for USER1

10. Use read_local_state for an address that hasn't opted in
    - Verify: returns appropriate error or empty state

## Box Storage Tests

Note: The Counter contract doesn't use box storage. These tests require a contract with box storage.

11. If testing boxes, deploy a contract that uses box storage

12. Use read_box with:
    - appId: (from step 11)
    - boxName: "data"
    - Verify: returns the box contents

13. Use read_box with a non-existent box name
    - Verify: returns appropriate error or empty result

## Cleanup

14. Delete the Counter app using app_delete

## Summary

| Tool              | Test Steps |
| ----------------- | ---------- |
| read_global_state | 2, 4, 6    |
| read_local_state  | 9, 10      |
| read_box          | 12, 13     |
