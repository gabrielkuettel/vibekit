/**
 * github_search_repositories tool
 *
 * Searches for repositories across GitHub.
 * Uses the GitHub Repository Search API.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { parseArgs, type ToolContext } from '../types.js'

export const githubSearchReposTool: Tool = {
  name: 'github_search_repositories',
  description:
    'Search for repositories on GitHub by name, description, topics, or other criteria. Useful for discovering projects.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Search query using GitHub repository search syntax (e.g., "topic:algorand language:typescript", "algorand nft")',
      },
      sort: {
        type: 'string',
        enum: ['stars', 'forks', 'help-wanted-issues', 'updated'],
        description: 'Sort field',
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

interface GitHubSearchReposArgs {
  query: string
  sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated'
  order?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

interface GitHubRepoResult {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  updated_at: string
}

interface GitHubSearchReposResponse {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepoResult[]
}

export async function handleGitHubSearchRepos(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  totalCount: number
  incompleteResults: boolean
  items: Array<{
    name: string
    fullName: string
    description: string | null
    url: string
    stars: number
    forks: number
    language: string | null
    topics: string[]
    updatedAt: string
  }>
}> {
  const { config } = ctx
  const typedArgs = parseArgs<GitHubSearchReposArgs>(args)
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

  const url = `https://api.github.com/search/repositories?${params.toString()}`

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

  const data = (await response.json()) as GitHubSearchReposResponse

  return {
    totalCount: data.total_count,
    incompleteResults: data.incomplete_results,
    items: data.items.map((item) => ({
      name: item.name,
      fullName: item.full_name,
      description: item.description,
      url: item.html_url,
      stars: item.stargazers_count,
      forks: item.forks_count,
      language: item.language,
      topics: item.topics,
      updatedAt: item.updated_at,
    })),
  }
}
