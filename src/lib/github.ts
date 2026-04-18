import { Octokit } from '@octokit/rest'
import { useSettingsStore } from '../stores/settings'

export interface RepoConfig {
  owner: string
  repo: string
  postsDir: string
  baseBranch: string
}

export function cfg(): RepoConfig {
  const settings = useSettingsStore()
  const { owner, repo, postsDir, baseBranch } = settings.state
  return { owner, repo, postsDir, baseBranch: baseBranch || 'main' }
}

export function gh(): Octokit {
  const settings = useSettingsStore()
  if (!settings.state.token) throw new Error('No token configured')
  return new Octokit({ auth: settings.state.token })
}

export interface PostFile {
  name: string
  path: string
  sha: string
}

export async function listPosts(): Promise<PostFile[]> {
  const { owner, repo, postsDir, baseBranch } = cfg()
  const { data } = await gh().rest.repos.getContent({
    owner,
    repo,
    path: postsDir,
    ref: baseBranch
  })
  if (!Array.isArray(data)) throw new Error(`${postsDir} is not a directory`)
  return data
    .filter((f) => f.type === 'file' && f.name.endsWith('.md'))
    .map((f) => ({ name: f.name, path: f.path, sha: f.sha }))
}

export async function readPost(
  path: string,
  ref?: string
): Promise<{ sha: string; content: string; path: string }> {
  const { owner, repo, baseBranch } = cfg()
  const { data } = await gh().rest.repos.getContent({
    owner,
    repo,
    path,
    ref: ref ?? baseBranch
  })
  if (Array.isArray(data) || data.type !== 'file') throw new Error(`Expected file at ${path}`)
  const file = data as { sha: string; path: string; content: string }
  return { sha: file.sha, path: file.path, content: fromBase64(file.content) }
}

export async function getBaseHeadSha(): Promise<string> {
  const { owner, repo, baseBranch } = cfg()
  const { data } = await gh().rest.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`
  })
  return data.object.sha
}

export async function branchExists(branch: string): Promise<boolean> {
  try {
    const { owner, repo } = cfg()
    await gh().rest.git.getRef({ owner, repo, ref: `heads/${branch}` })
    return true
  } catch {
    return false
  }
}

export async function createBranch(branch: string): Promise<void> {
  const sha = await getBaseHeadSha()
  const { owner, repo } = cfg()
  await gh().rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha
  })
}

export async function putFile(
  branch: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const { owner, repo } = cfg()
  await gh().rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: toBase64(content),
    branch,
    sha
  })
}

export async function openPr(branch: string, title: string, body = ''): Promise<number> {
  const { owner, repo, baseBranch } = cfg()
  const { data } = await gh().rest.pulls.create({
    owner,
    repo,
    head: branch,
    base: baseBranch,
    title,
    body
  })
  return data.number
}

export async function findOpenPrForBranch(branch: string): Promise<number | null> {
  const { owner, repo } = cfg()
  const { data } = await gh().rest.pulls.list({
    owner,
    repo,
    head: `${owner}:${branch}`,
    state: 'open'
  })
  return data[0]?.number ?? null
}

export async function mergePr(prNumber: number): Promise<void> {
  const { owner, repo } = cfg()
  await gh().rest.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: 'squash'
  })
}

export function toBase64(s: string): string {
  const utf8 = new TextEncoder().encode(s)
  let bin = ''
  for (const byte of utf8) bin += String.fromCharCode(byte)
  return btoa(bin)
}

export function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}
