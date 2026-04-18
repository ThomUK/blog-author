<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostsStore } from '../stores/posts'
import { useDraftsStore } from '../stores/drafts'
import { renderMarkdown } from '../lib/markdown'
import { mergePr, findOpenPrForBranch } from '../lib/github'

const props = defineProps<{ slug: string }>()
const posts = usePostsStore()
const drafts = useDraftsStore()
const router = useRouter()
const { items } = storeToRefs(posts)

const merging = ref(false)
const actionError = ref<string | null>(null)

const post = computed(() => posts.bySlug(props.slug))
const html = computed(() => (post.value ? renderMarkdown(post.value.body) : ''))
const draft = computed(() => drafts.get(props.slug))

onMounted(async () => {
  if (items.value.length === 0) await posts.load()
  // Reconcile draft state: if we have a stored draft, confirm the PR is still open.
  const d = drafts.get(props.slug)
  if (d && d.branch) {
    const prNumber = await findOpenPrForBranch(d.branch).catch(() => null)
    if (prNumber === null) drafts.remove(props.slug)
    else if (prNumber !== d.prNumber) drafts.set(props.slug, { ...d, prNumber })
  }
})

async function publish(): Promise<void> {
  const d = draft.value
  if (!d || !d.prNumber) return
  merging.value = true
  actionError.value = null
  try {
    await mergePr(d.prNumber)
    drafts.remove(props.slug)
    posts.invalidate()
    await posts.load()
    router.push({ name: 'posts' })
  } catch (e) {
    actionError.value = (e as Error).message ?? 'Failed to merge PR'
  } finally {
    merging.value = false
  }
}
</script>

<template>
  <section class="stack">
    <div class="row">
      <RouterLink to="/posts" class="btn btn-ghost">&larr; Back</RouterLink>
      <div style="flex: 1;"></div>
      <RouterLink v-if="post" :to="{ name: 'edit', params: { slug: props.slug } }" class="btn">Edit</RouterLink>
      <button
        v-if="draft && draft.prNumber"
        class="btn btn-ok"
        type="button"
        :disabled="merging"
        @click="publish"
      >{{ merging ? 'Publishing\u2026' : 'Publish (merge PR #' + draft.prNumber + ')' }}</button>
    </div>

    <p v-if="actionError" class="error">{{ actionError }}</p>

    <article v-if="post" class="card stack">
      <header>
        <h1 style="margin: 0 0 0.25rem;">{{ post.frontmatter.friendly_title || post.slug }}</h1>
        <p class="muted" style="margin: 0;">
          <span>{{ post.date }}</span>
          <span v-if="post.frontmatter.tags"> \u00b7 {{ post.frontmatter.tags }}</span>
          <span
            class="badge"
            :class="post.frontmatter.visible ? 'badge-ok' : 'badge-warn'"
            style="margin-left: 0.5rem;"
          >{{ post.frontmatter.visible ? 'visible' : 'hidden' }}</span>
        </p>
      </header>
      <div class="markdown-body" v-html="html"></div>
    </article>

    <p v-else class="muted">Post not found.</p>
  </section>
</template>

<style>
.markdown-body { line-height: 1.55; word-wrap: break-word; }
.markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 1.25rem; }
.markdown-body pre {
  background: #0b1220;
  border: 1px solid var(--border);
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow: auto;
}
.markdown-body code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; }
.markdown-body img { max-width: 100%; height: auto; }
.markdown-body blockquote {
  border-left: 3px solid var(--border);
  padding-left: 0.75rem;
  color: var(--muted);
  margin: 0.75rem 0;
}
</style>
