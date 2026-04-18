import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listPosts, readPost } from '../lib/github'
import { parseFrontmatter, type Frontmatter } from '../lib/frontmatter'
import { parseFilename } from '../lib/filename'
import { useDraftsStore } from './drafts'

export interface PostSummary {
  key: string
  name: string
  path: string
  sha: string
  date: string | null
  slug: string | null
  frontmatter: Frontmatter
  body: string
  draftOnly: boolean
}

export const usePostsStore = defineStore('posts', () => {
  const items = ref<PostSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const drafts = useDraftsStore()
      const files = await listPosts()
      const summaries: PostSummary[] = []
      const seenPaths = new Set<string>()

      for (const f of files) {
        const post = await readPost(f.path)
        const { data, content } = parseFrontmatter(post.content)
        const parsed = parseFilename(f.name)
        summaries.push({
          key: f.name.replace(/\.md$/, ''),
          name: f.name,
          path: f.path,
          sha: post.sha,
          date: parsed?.date ?? null,
          slug: parsed?.slug ?? null,
          frontmatter: data,
          body: content,
          draftOnly: false
        })
        seenPaths.add(f.path)
      }

      for (const [key, info] of Object.entries(drafts.map)) {
        if (seenPaths.has(info.path)) continue
        try {
          const fresh = await readPost(info.path, info.branch)
          const { data, content } = parseFrontmatter(fresh.content)
          const name = info.path.split('/').pop() ?? `${key}.md`
          const parsed = parseFilename(name)
          summaries.push({
            key,
            name,
            path: info.path,
            sha: fresh.sha,
            date: parsed?.date ?? null,
            slug: parsed?.slug ?? null,
            frontmatter: data,
            body: content,
            draftOnly: true
          })
        } catch {
          drafts.remove(key)
        }
      }

      summaries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      items.value = summaries
    } catch (e) {
      error.value = (e as Error).message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  function byKey(key: string): PostSummary | undefined {
    return items.value.find((p) => p.key === key)
  }

  function invalidate(): void {
    items.value = []
  }

  return { items, loading, error, load, byKey, invalidate }
})
