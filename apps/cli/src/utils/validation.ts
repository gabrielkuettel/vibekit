export const GITHUB_PAT_PREFIXES = ['ghp_', 'github_pat_'] as const

export function isValidGitHubPATFormat(pat: string): boolean {
  return GITHUB_PAT_PREFIXES.some((prefix) => pat.startsWith(prefix))
}
