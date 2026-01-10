# GitHub Tools Test Prompt

Test the MCP GitHub tools. Report PASS/FAIL for each test.

**Note:** These tools search public GitHub repositories. No local setup required.

## Tools Tested

- github_search_repos
- github_search_code
- github_get_file

## Repository Search Tests

1. Use github_search_repos to search for "algorand sdk":
   - Verify: returns a list of repositories
   - Verify: results include official Algorand SDK repos

2. Use github_search_repos to search for "algokit" with language filter "python":
   - Verify: returns Python repositories related to AlgoKit

3. Use github_search_repos to search for "tealscript":
   - Verify: returns the TealScript repository

## Code Search Tests

4. Use github_search_code to search for "ApplicationCall" in algorand repos:
   - query: "ApplicationCall language:typescript org:algorandfoundation"
   - Verify: returns code matches from Algorand Foundation repos

5. Use github_search_code to search for a specific function:
   - query: "def compile_program language:python"
   - Verify: returns Python files containing compile_program function

6. Use github_search_code to search in a specific repo:
   - query: "repo:algorand/go-algorand consensus"
   - Verify: returns files from go-algorand containing "consensus"

## File Retrieval Tests

7. Use github_get_file to get a README:
   - owner: "algorand"
   - repo: "go-algorand"
   - path: "README.md"
   - Verify: returns the contents of the README file

8. Use github_get_file to get a source file:
   - owner: "algorandfoundation"
   - repo: "algokit-utils-ts"
   - path: "package.json"
   - Verify: returns the package.json contents

9. Use github_get_file with a specific ref/branch:
   - owner: "algorand"
   - repo: "py-algorand-sdk"
   - path: "algosdk/**init**.py"
   - Verify: returns the file contents

## Error Handling Tests

10. Use github_get_file with a non-existent file:
    - path: "this-file-does-not-exist.txt"
    - Verify: returns appropriate error message

11. Use github_search_repos with no results:
    - query: "xyznonexistentrepo12345"
    - Verify: returns empty results or appropriate message

## Summary

| Tool                | Test Steps |
| ------------------- | ---------- |
| github_search_repos | 1-3, 11    |
| github_search_code  | 4-6        |
| github_get_file     | 7-10       |
