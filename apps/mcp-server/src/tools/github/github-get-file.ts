/**
 * github_get_file_contents tool
 *
 * Gets file or directory contents from a GitHub repository.
 * Uses the GitHub Contents API.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'

export const githubGetFileTool: Tool = {
  name: 'github_get_file_contents',
  description:
    'Get the contents of a file or directory from a GitHub repository. Returns decoded file content for files, or a list of entries for directories.',
  inputSchema: {
    type: 'object',
    properties: {
      owner: {
        type: 'string',
        description: 'Repository owner (username or organization)',
      },
      repo: {
        type: 'string',
        description: 'Repository name',
      },
      path: {
        type: 'string',
        description: 'Path to file or directory (default: root)',
      },
      ref: {
        type: 'string',
        description: 'Git ref (branch, tag, or commit SHA)',
      },
    },
    required: ['owner', 'repo'],
  },
}

interface GitHubGetFileArgs {
  owner: string
  repo: string
  path?: string
  ref?: string
}

interface GitHubFileContent {
  type: 'file'
  name: string
  path: string
  sha: string
  size: number
  content: string
  encoding: string
}

interface GitHubDirEntry {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  name: string
  path: string
  sha: string
  size: number
}

type GitHubContentsResponse = GitHubFileContent | GitHubDirEntry[]

export async function handleGitHubGetFile(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  type: 'file' | 'directory'
  content?: string
  entries?: GitHubDirEntry[]
  path: string
  sha?: string
  size?: number
}> {
  const { config } = ctx
  const typedArgs = parseArgs<GitHubGetFileArgs>(args)
  const { owner, repo, path = '', ref } = typedArgs

  if (!config.githubToken) {
    throw new Error(
      'GITHUB_TOKEN environment variable not set. ' +
        'A GitHub Personal Access Token is required for this tool.'
    )
  }

  const cleanPath = path.replace(/^\//, '')
  let url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}`
  if (ref) {
    url += `?ref=${encodeURIComponent(ref)}`
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${config.githubToken}`,
      'User-Agent': 'vibekit-mcp-server',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error (${response.status}): ${error}`)
  }

  const data = (await response.json()) as GitHubContentsResponse

  // Directory response is an array
  if (Array.isArray(data)) {
    return {
      type: 'directory',
      path: cleanPath || '/',
      entries: data.map((entry) => ({
        type: entry.type,
        name: entry.name,
        path: entry.path,
        sha: entry.sha,
        size: entry.size,
      })),
    }
  }

  // File response
  if (data.type === 'file') {
    // Decode base64 content
    let content = ''
    if (data.content && data.encoding === 'base64') {
      content = Buffer.from(data.content, 'base64').toString('utf-8')
    }

    return {
      type: 'file',
      path: data.path,
      sha: data.sha,
      size: data.size,
      content,
    }
  }

  throw new Error(`Unexpected response type from GitHub API`)
}
