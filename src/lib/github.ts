import { Octokit } from '@octokit/rest'
import { useAuthStore } from '../stores/auth'

export const REPO_OWNER = 'ThomUK'
export const REPO_NAME = 'blog_posts'
export const POSTS_DIR = 'smith_data/posts'
export const BASE_BRANCH = 'main'

export function gh(): Octokit {
  const auth = useAuthStore()
  if (!auth.token) throw new Error('Not authenticated')
  return new Octokit({ auth: auth.token })
}

export interface PostFile {
  name: string
  path: string
  sha: string
}

export async function listPosts(): Promise<PostFile[]> {
  const { data } = await gh().rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: POSTS_DIR,
    ref: BASE_BRANCH
  })
  if (!Array.isArray(data)) throw new Error(`${POSTS_DIR} is not a directory`)
  return data
    .filter((f) => f.type === 'file' && f.name.endsWith('.md'))
    .map((f) => ({ name: f.name, path: f.path, sha: f.sha }))
}

export async function readPost(path: string, ref?: string): Promise<{ sha: string; content: string; path: string }> {
  const { data } = await gh().rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    ref: ref ?? BASE_BRANCH
  })
  if (Array.isArray(data) || data.type !== 'file') throw new Error(`Expected file at ${path}`)
  // Narrow: file content has `.content` base64
  const file = data as { sha: string; path: string; content: string }
  return { sha: file.sha, path: file.path, content: fromBase64(file.content) }
}

export async function getBaseHeadSha(): Promise<string> {
  const { data } = await gh().rest.git.getRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: `heads/${BASE_BRANCH}`
  })
  return data.object.sha
}

export async function branchExists(branch: string): Promise<boolean> {
  try {
    await gh().rest.git.getRef({ owner: REPO_OWNER, repo: REPO_NAME, ref: `heads/${branch}` })
    return true
  } catch {
    return false
  }
}

export async function createBranch(branch: string): Promise<void> {
  const sha = await getBaseHeadSha()
  await gh().rest.git.createRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
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
  await gh().rest.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message,
    content: toBase64(content),
    branch,
    sha
  })
}

export async function openPr(branch: string, title: string, body = ''): Promise<number> {
  const { data } = await gh().rest.pulls.create({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    head: branch,
    base: BASE_BRANCH,
    title,
    body
  })
  return data.number
}

export async function findOpenPrForBranch(branch: string): Promise<number | null> {
  const { data } = await gh().rest.pulls.list({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    head: `${REPO_OWNER}:${branch}`,
    state: 'open'
  })
  return data[0]?.number ?? null
}

export async function mergePr(prNumber: number): Promise<void> {
  await gh().rest.pulls.merge({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    merge_method: 'squash'
  })
}

export function toBase64(s: string): string {
  // Handle Unicode safely: btoa only accepts Latin-1.
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
