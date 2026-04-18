import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listPosts, readPost } from '../lib/github'
import { parseFrontmatter, type Frontmatter } from '../lib/frontmatter'
import { parseFilename } from '../lib/filename'

export interface PostSummary {
  name: string
  path: string
  sha: string
  date: string | null
  slug: string | null
  frontmatter: Frontmatter
  body: string
}

export const usePostsStore = defineStore('posts', () => {
  const items = ref<PostSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const files = await listPosts()
      const summaries: PostSummary[] = []
      for (const f of files) {
        const post = await readPost(f.path)
        const { data, content } = parseFrontmatter(post.content)
        const parsed = parseFilename(f.name)
        summaries.push({
          name: f.name,
          path: f.path,
          sha: post.sha,
          date: parsed?.date ?? null,
          slug: parsed?.slug ?? null,
          frontmatter: data,
          body: content
        })
      }
      summaries.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      items.value = summaries
    } catch (e) {
      error.value = (e as Error).message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  function bySlug(slug: string): PostSummary | undefined {
    return items.value.find((p) => p.slug === slug)
  }

  function invalidate(): void {
    items.value = []
  }

  return { items, loading, error, load, bySlug, invalidate }
})
