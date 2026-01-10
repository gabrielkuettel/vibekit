/**
 * github_search_code tool
 *
 * Searches for code across GitHub repositories.
 * Uses the GitHub Code Search API.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'

export const githubSearchCodeTool: Tool = {
  name: 'github_search_code',
  description:
    'Search for code across GitHub repositories. Supports GitHub code search syntax like "org:algorandfoundation language:typescript".',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Search query using GitHub code search syntax (e.g., "org:algorandfoundation Contract language:typescript")',
      },
      sort: {
        type: 'string',
        enum: ['indexed'],
        description: 'Sort field (only "indexed" supported)',
      },
      order: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order',
      },
      page: {
        type: 'number',
        description: 'Page number for pagination (default: 1)',
      },
      perPage: {
        type: 'number',
        description: 'Results per page (max 100, default: 30)',
      },
    },
    required: ['query'],
  },
}

interface GitHubSearchCodeArgs {
  query: string
  sort?: 'indexed'
  order?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

interface GitHubSearchCodeResult {
  name: string
  path: string
  sha: string
  html_url: string
  repository: {
    full_name: string
    description: string | null
    html_url: string
  }
}

interface GitHubSearchCodeResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubSearchCodeResult[]
}

export async function handleGitHubSearchCode(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  totalCount: number
  incompleteResults: boolean
  items: Array<{
    name: string
    path: string
    sha: string
    url: string
    repository: string
    repositoryUrl: string
  }>
}> {
  const { config } = ctx
  const typedArgs = parseArgs<GitHubSearchCodeArgs>(args)
  const { query, sort, order, page = 1, perPage = 30 } = typedArgs

  if (!config.githubToken) {
    throw new Error(
      'GITHUB_TOKEN environment variable not set. ' +
        'A GitHub Personal Access Token is required for this tool.'
    )
  }

  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(Math.min(perPage, 100)),
  })
  if (sort) params.set('sort', sort)
  if (order) params.set('order', order)

  const url = `https://api.github.com/search/code?${params.toString()}`

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

  const data = (await response.json()) as GitHubSearchCodeResponse

  return {
    totalCount: data.total_count,
    incompleteResults: data.incomplete_results,
    items: data.items.map((item) => ({
      name: item.name,
      path: item.path,
      sha: item.sha,
      url: item.html_url,
      repository: item.repository.full_name,
      repositoryUrl: item.repository.html_url,
    })),
  }
}
