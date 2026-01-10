/**
 * GitHub Tools
 *
 * Tools for interacting with GitHub repositories (file contents, code search, repo search).
 */

import type { ToolRegistration } from '../types.js'
import { githubGetFileTool, handleGitHubGetFile } from './github-get-file.js'
import { githubSearchCodeTool, handleGitHubSearchCode } from './github-search-code.js'
import { githubSearchReposTool, handleGitHubSearchRepos } from './github-search-repos.js'

export const githubTools: ToolRegistration[] = [
  { definition: githubGetFileTool, handler: handleGitHubGetFile },
  { definition: githubSearchCodeTool, handler: handleGitHubSearchCode },
  { definition: githubSearchReposTool, handler: handleGitHubSearchRepos },
]
